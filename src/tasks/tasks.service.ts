import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { SoftDeleteService } from '../common/soft-delete/soft-delete.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@Injectable()
export class TasksService {
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

    // Invalidar cache relacionado após criação
    await this.invalidateUserTasksCache(userId);

    return task;
  }

  private async invalidateUserTasksCache(userId: string) {
    const pattern = `tasks:user:${userId}:*`;
    // Invalidar todas as chaves de cache do usuário
    await this.cacheManager.del(pattern);
  }

  async findAll(userId: string, query: QueryTasksDto) {
    const { status, priority, search, page = 1, limit = 10 } = query;
    
    // Criar chave única para o cache baseada nos parâmetros
    const cacheKey = `tasks:user:${userId}:page:${page}:limit:${limit}:status:${status || 'all'}:priority:${priority || 'all'}:search:${search || 'none'}`;
    
    // Tentar buscar no cache primeiro
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
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

    // Armazenar no cache por 2 minutos
    await this.cacheManager.set(cacheKey, result, 120000);

    return result;
  }

  async findOne(userId: string, taskId: string) {
    const cacheKey = `task:${taskId}:user:${userId}`;
    
    // Tentar buscar no cache primeiro
    const cachedTask = await this.cacheManager.get(cacheKey);
    if (cachedTask) {
      return cachedTask;
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        tags: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta tarefa');
    }

    if (task.deletedAt) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    // Armazenar no cache por 5 minutos
    await this.cacheManager.set(cacheKey, task, 300000);

    return task;
  }

  async update(userId: string, taskId: string, updateTaskDto: UpdateTaskDto) {
    // Verificar se a tarefa existe e pertence ao usuário
    await this.findOne(userId, taskId);

    const updateData: any = { ...updateTaskDto };
    
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    // Garantir que os enums sejam tratados corretamente
    if (updateTaskDto.status) {
      updateData.status = updateTaskDto.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    }
    
    if (updateTaskDto.priority) {
      updateData.priority = updateTaskDto.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        tags: true,
      },
    });

    // Invalidar cache após atualização
    await this.invalidateTaskCache(taskId, userId);
    await this.invalidateUserTasksCache(userId);

    return task;
  }

  private async invalidateTaskCache(taskId: string, userId: string) {
    const taskCacheKey = `task:${taskId}:user:${userId}`;
    await this.cacheManager.del(taskCacheKey);
  }

  async remove(userId: string, taskId: string) {
    // Verificar se a tarefa existe e pertence ao usuário
    await this.findOne(userId, taskId);

    // Usar soft delete ao invés de hard delete
    await this.softDeleteService.softDeleteTask(taskId);

    // Invalidar cache após remoção
    await this.invalidateTaskCache(taskId, userId);
    await this.invalidateUserTasksCache(userId);

    return { 
      message: 'Tarefa deletada com sucesso (soft delete)',
      canRestore: true
    };
  }

  async restore(userId: string, taskId: string) {
    // Verificar se a tarefa existe
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    // Verificar se a tarefa pertence ao usuário
    if (task.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para restaurar esta tarefa');
    }

    // Verificar se a tarefa está deletada
    if (!task.deletedAt) {
      throw new BadRequestException('Tarefa não está deletada');
    }

    await this.softDeleteService.restoreTask(taskId);

    // Invalidar cache após restauração
    await this.invalidateTaskCache(taskId, userId);
    await this.invalidateUserTasksCache(userId);

    return { message: 'Tarefa restaurada com sucesso' };
  }
}
