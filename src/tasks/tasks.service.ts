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
  private readonly enableCache = false;

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

    await this.resetAllTasksCache();
    
    return task;
  }

  async findAll(userId: string, query: QueryTasksDto) {
    const { status, priority, search, page = 1, limit = 10 } = query;
    
    const cacheKey = `tasks:user:${userId}:page:${page}:limit:${limit}:status:${status || 'all'}:priority:${priority || 'all'}:search:${search || 'none'}`;
    
    if (this.enableCache) {
      const cachedResult = await this.cacheManager.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
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

    if (this.enableCache) {
      await this.cacheManager.set(cacheKey, result, 300000);
    }

    return result;
  }

  async findOne(userId: string, taskId: string) {
    const cacheKey = `task:${taskId}:user:${userId}`;
    
    if (this.enableCache) {
      const cachedTask = await this.cacheManager.get(cacheKey);
      if (cachedTask) {
        return cachedTask;
      }
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

    if (this.enableCache) {
      await this.cacheManager.set(cacheKey, task, 300000);
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

    await this.resetAllTasksCache();

    return updatedTask;
  }

  async remove(userId: string, taskId: string) {
    const task = await this.findOne(userId, taskId);
    
    await this.softDeleteService.softDeleteTask(taskId);

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

    await this.resetAllTasksCache();

    return { message: 'Tarefa restaurada com sucesso' };
  }

  private async resetAllTasksCache() {
    if (!this.enableCache) {
      return;
    }
    
    try {
      const redisClient = (this.cacheManager as any).store?.client;
      if (redisClient && redisClient.keys) {
        const taskKeys = await redisClient.keys('tasks:*');
        const individualTaskKeys = await redisClient.keys('task:*');
        const allKeys = [...taskKeys, ...individualTaskKeys];
        
        if (allKeys && allKeys.length > 0) {
          await redisClient.del(...allKeys);
          return;
        }
      }
    } catch (error) {
      console.warn(`Erro ao resetar cache via Redis direto:`, error.message);
    }

    const specificKeys = [
      'tasks:user:0fc7b3fa-5a20-42f5-9c8a-8978d8e9e538:page:1:limit:10:status:all:priority:all:search:none',
      'tasks:user:0fc7b3fa-5a20-42f5-9c8a-8978d8e9e538:page:1:limit:20:status:all:priority:all:search:none',
      'tasks:user:0fc7b3fa-5a20-42f5-9c8a-8978d8e9e538:page:1:limit:5:status:all:priority:all:search:none',
      'tasks:user:0fc7b3fa-5a20-42f5-9c8a-8978d8e9e538:page:2:limit:10:status:all:priority:all:search:none',
      'tasks:user:4d3a5948-0cdf-4bea-96c4-a804fc307c8e:page:1:limit:10:status:all:priority:all:search:none',
      'tasks:user:4d3a5948-0cdf-4bea-96c4-a804fc307c8e:page:1:limit:20:status:all:priority:all:search:none',
      'tasks:user:4d3a5948-0cdf-4bea-96c4-a804fc307c8e:page:1:limit:5:status:all:priority:all:search:none',
      'tasks:user:4d3a5948-0cdf-4bea-96c4-a804fc307c8e:page:2:limit:10:status:all:priority:all:search:none',
    ];

    for (const key of specificKeys) {
      try {
        await this.cacheManager.del(key);
      } catch (error) {
      }
    }
  }
}