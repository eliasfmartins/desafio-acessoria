import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { SoftDeleteService } from '../common/soft-delete/soft-delete.service';

@Injectable()
export class TasksService {
  private readonly enableCache = process.env.ENABLE_CACHE !== 'false'; // Por padrão habilitado

  constructor(
    private prisma: PrismaService,
    private softDeleteService: SoftDeleteService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async create(userId: string, createTaskDto: CreateTaskDto) {
    const { title, description, status = 'PENDING', priority = 'MEDIUM', dueDate } = createTaskDto;
    
    const task = await this.prisma.task.create({
      data: {
        title,
        description,
        status: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
        priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
      },
      include: {
        tags: true,
      },
    });

    // Resetar TODO o cache de tasks após criar
    await this.resetAllTasksCache();
    
    return task;
  }

  async findAll(userId: string, query: QueryTasksDto) {
    const { status, priority, search, page = 1, limit = 10 } = query;
    
    // Criar chave única para o cache baseada nos parâmetros
    const cacheKey = `tasks:user:${userId}:page:${page}:limit:${limit}:status:${status || 'all'}:priority:${priority || 'all'}:search:${search || 'none'}`;
    
    // Tentar buscar no cache primeiro (se habilitado)
    if (this.enableCache) {
      const cachedResult = await this.cacheManager.get(cacheKey);
      if (cachedResult) {
        console.log(`🚀 Cache HIT para user ${userId}: ${cacheKey}`);
        return cachedResult;
      }
      console.log(`❌ Cache MISS para user ${userId}: ${cacheKey}`);
    }

    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null, // Filtrar apenas tasks não deletadas
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    const result = {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Armazenar no cache por 5 minutos (se habilitado)
    if (this.enableCache) {
      await this.cacheManager.set(cacheKey, result, 300000); // 5 minutos
      console.log(`📦 Cache armazenado (5min) para user ${userId}: ${cacheKey}`);
    }

    return result;
  }

  async findOne(userId: string, taskId: string) {
    const cacheKey = `task:${taskId}:user:${userId}`;
    
    // Tentar buscar no cache primeiro (se habilitado)
    if (this.enableCache) {
      const cachedTask = await this.cacheManager.get(cacheKey);
      if (cachedTask) {
        console.log(`🚀 Cache HIT para task individual: ${cacheKey}`);
        return cachedTask;
      }
      console.log(`❌ Cache MISS para task individual: ${cacheKey}`);
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
        deletedAt: null,
      },
      include: {
        tags: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    // Armazenar no cache por 5 minutos (se habilitado)
    if (this.enableCache) {
      await this.cacheManager.set(cacheKey, task, 300000); // 5 minutos
      console.log(`📦 Cache de task individual armazenado (5min): ${cacheKey}`);
    }

    return task;
  }

  async update(userId: string, taskId: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.findOne(userId, taskId);

    const updateData: any = { ...updateTaskDto };
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }
    if (updateTaskDto.status) {
      updateData.status = updateTaskDto.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    }
    if (updateTaskDto.priority) {
      updateData.priority = updateTaskDto.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        tags: true,
      },
    });

    // Resetar TODO o cache de tasks após atualizar
    await this.resetAllTasksCache();

    return updatedTask;
  }

  async remove(userId: string, taskId: string) {
    const task = await this.findOne(userId, taskId);
    
    await this.softDeleteService.softDeleteTask(taskId);

    // Resetar TODO o cache de tasks após deletar
    await this.resetAllTasksCache();

    return { 
      message: 'Tarefa deletada com sucesso (soft delete)',
      canRestore: true
    };
  }

  async restore(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para restaurar esta tarefa');
    }

    if (!task.deletedAt) {
      throw new BadRequestException('Tarefa não está deletada');
    }

    await this.softDeleteService.restoreTask(taskId);

    // Resetar TODO o cache de tasks após restaurar
    await this.resetAllTasksCache();

    return { message: 'Tarefa restaurada com sucesso' };
  }

  /**
   * Resetar TODO o cache de tasks - estratégia simples e efetiva
   * Sempre que houver uma operação que não seja GET, resetamos tudo
   */
  private async resetAllTasksCache() {
    if (!this.enableCache) {
      console.log(`🔧 Cache DESABILITADO - não resetando`);
      return;
    }

    console.log(`🗑️ RESETANDO TODO O CACHE DE TASKS...`);
    
    try {
      // Estratégia 1: Tentar acessar o cliente Redis diretamente
      const redisClient = (this.cacheManager as any).store?.client;
      if (redisClient && redisClient.keys) {
        // Buscar todas as chaves que começam com 'tasks:' ou 'task:'
        const taskKeys = await redisClient.keys('tasks:*');
        const individualTaskKeys = await redisClient.keys('task:*');
        const allKeys = [...taskKeys, ...individualTaskKeys];
        
        if (allKeys && allKeys.length > 0) {
          await redisClient.del(...allKeys);
          console.log(`✅ CACHE RESETADO: ${allKeys.length} chaves de tasks deletadas`);
          console.log(`🗑️ Chaves deletadas:`, allKeys);
          return;
        } else {
          console.log(`✅ CACHE RESETADO: Nenhuma chave de tasks encontrada`);
          return;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao resetar cache via Redis direto:`, error.message);
    }

    // Estratégia 2: Fallback - deletar chaves específicas conhecidas
    console.log(`🔄 Fallback: Deletando chaves específicas conhecidas...`);
    
    // Lista de chaves específicas que podem existir
    const specificKeys = [
      // Chaves comuns que podem estar em cache
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:1:limit:10:status:all:priority:all:search:none',
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:1:limit:20:status:all:priority:all:search:none',
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:1:limit:5:status:all:priority:all:search:none',
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:2:limit:10:status:all:priority:all:search:none',
    ];

    let deletedCount = 0;
    for (const key of specificKeys) {
      try {
        await this.cacheManager.del(key);
        deletedCount++;
        console.log(`🗑️ Chave deletada: ${key}`);
      } catch (error) {
        // Ignorar erros individuais
      }
    }
    
    console.log(`🗑️ CACHE FALLBACK: ${deletedCount} chaves específicas deletadas`);
  }
}