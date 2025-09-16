import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SoftDeleteService {
  constructor(private prisma: PrismaService) {}

  /**
   * Soft delete para usuários
   */
  async softDeleteUser(userId: string) {
    // Primeiro, soft delete todas as tasks do usuário
    await this.prisma.task.updateMany({
      where: { userId },
      data: { deletedAt: new Date() },
    });

    // Depois, soft delete o usuário
    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Soft delete para tasks
   */
  async softDeleteTask(taskId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restaurar usuário (hard restore)
   */
  async restoreUser(userId: string) {
    // Primeiro, restaurar todas as tasks do usuário
    await this.prisma.task.updateMany({
      where: { userId },
      data: { deletedAt: null },
    });

    // Depois, restaurar o usuário
    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
  }

  /**
   * Restaurar task (hard restore)
   */
  async restoreTask(taskId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: null },
    });
  }

  /**
   * Deletar permanentemente um usuário (hard delete)
   */
  async hardDeleteUser(userId: string) {
    // Primeiro, hard delete todas as tasks do usuário
    await this.prisma.task.deleteMany({
      where: { userId },
    });

    // Depois, hard delete o usuário
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Deletar permanentemente uma task (hard delete)
   */
  async hardDeleteTask(taskId: string) {
    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  /**
   * Listar usuários deletados (soft deleted)
   */
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

  /**
   * Listar tasks deletadas (soft deleted)
   */
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

