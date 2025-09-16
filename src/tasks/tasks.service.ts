import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SoftDeleteService } from '../common/soft-delete/soft-delete.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private softDeleteService: SoftDeleteService
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

    return task;
  }

  async findAll(userId: string, query: QueryTasksDto) {
    const { status, priority, search, page = 1, limit = 10 } = query;
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

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, taskId: string) {
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

    return task;
  }

  async remove(userId: string, taskId: string) {
    // Verificar se a tarefa existe e pertence ao usuário
    await this.findOne(userId, taskId);

    // Usar soft delete ao invés de hard delete
    await this.softDeleteService.softDeleteTask(taskId);

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

    return { message: 'Tarefa restaurada com sucesso' };
  }
}
