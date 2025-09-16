import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string, userRole?: string) {
    // Buscar todas as tarefas do usuário
    const userTasks = await this.prisma.task.findMany({
      where: { userId },
    });

    const userStats = this.calculateStats(userTasks);

    // Se for admin, buscar estatísticas de todos os usuários
    if (userRole === 'ADMIN') {
      const allTasks = await this.prisma.task.findMany();
      const adminStats = this.calculateStats(allTasks);

      return {
        ...userStats,
        adminStats,
      };
    }

    return userStats;
  }

  private calculateStats(tasks: any[]) {
    const totalTasks = tasks.length;

    // Contar tarefas por status
    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Contar tarefas por prioridade
    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Contar tarefas atrasadas
    const now = new Date();
    const overdueTasks = tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'COMPLETED' && 
      task.status !== 'CANCELLED'
    ).length;

    // Calcular taxa de conclusão
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      tasksByStatus: {
        PENDING: tasksByStatus.PENDING || 0,
        IN_PROGRESS: tasksByStatus.IN_PROGRESS || 0,
        COMPLETED: tasksByStatus.COMPLETED || 0,
        CANCELLED: tasksByStatus.CANCELLED || 0,
      },
      tasksByPriority: {
        LOW: tasksByPriority.LOW || 0,
        MEDIUM: tasksByPriority.MEDIUM || 0,
        HIGH: tasksByPriority.HIGH || 0,
        URGENT: tasksByPriority.URGENT || 0,
      },
      overdueTasks,
      completionRate: Math.round(completionRate * 10) / 10, // Arredondar para 1 casa decimal
    };
  }
}
