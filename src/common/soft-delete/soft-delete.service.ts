import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class SoftDeleteService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  
  async softDeleteUser(userId: string) {
    const startTime = Date.now();
    
    const tasksResult = await this.prisma.task.updateMany({
      where: { userId },
      data: { deletedAt: new Date() },
    });

    const userResult = await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    const duration = Date.now() - startTime;
    this.logger.logBusiness('user_soft_deleted', 'User', userId, userId, {
      deletedTasks: tasksResult.count,
      duration: `${duration}ms`
    });

    return userResult;
  }

  async softDeleteTask(taskId: string) {
    const startTime = Date.now();
    
    const result = await this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    const duration = Date.now() - startTime;
    this.logger.logBusiness('task_soft_deleted', 'Task', taskId, result.userId, {
      duration: `${duration}ms`
    });

    return result;
  }

  async restoreUser(userId: string) {
    await this.prisma.task.updateMany({
      where: { userId },
      data: { deletedAt: null },
    });

    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
  }

  async restoreTask(taskId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: null },
    });
  }

  
  async hardDeleteUser(userId: string) {
    await this.prisma.task.deleteMany({
      where: { userId },
    });

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async hardDeleteTask(taskId: string) {
    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  
  async findDeletedUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: { not: null } },
      include: {
        tasks: {
          where: { deletedAt: { not: null } },
        },
      },
    });
  }

  
  async findDeletedTasks() {
    return this.prisma.task.findMany({
      where: { deletedAt: { not: null } },
      include: {
        user: true,
        tags: true,
      },
    });
  }
}

