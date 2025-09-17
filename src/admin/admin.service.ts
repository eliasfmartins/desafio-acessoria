import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SoftDeleteService } from '../common/soft-delete/soft-delete.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private softDeleteService: SoftDeleteService
  ) {}

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  async findAllTasks() {
    const tasks = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tasks;
  }

  async updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.role === role) {
      throw new BadRequestException(`Usuário já possui o role ${role}`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tasks: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    
    await this.softDeleteService.softDeleteUser(userId);

    return {
      message: 'Usuário deletado com sucesso (soft delete)',
      deletedTasks: user.tasks.length,
      canRestore: true,
    };
  }

  
  async findDeletedUsers() {
    return this.softDeleteService.findDeletedUsers();
  }

  async findDeletedTasks() {
    return this.softDeleteService.findDeletedTasks();
  }

  async restoreUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!user.deletedAt) {
      throw new BadRequestException('Usuário não está deletado');
    }

    await this.softDeleteService.restoreUser(userId);

    return {
      message: 'Usuário restaurado com sucesso',
    };
  }

  async restoreTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada');
    }

    if (!task.deletedAt) {
      throw new BadRequestException('Task não está deletada');
    }

    await this.softDeleteService.restoreTask(taskId);

    return {
      message: 'Task restaurada com sucesso',
    };
  }

  async hardDeleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.softDeleteService.hardDeleteUser(userId);

    return {
      message: 'Usuário deletado permanentemente',
    };
  }

  async hardDeleteTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada');
    }

    await this.softDeleteService.hardDeleteTask(taskId);

    return {
      message: 'Task deletada permanentemente',
    };
  }
}

