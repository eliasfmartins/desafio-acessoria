import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { StatsService } from './stats.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StatsService', () => {
  let service: StatsService;
  let prismaService: PrismaService;
  let cacheManager: any;

  const mockTasks = [
    {
      id: 'task-1',
      title: 'Task 1',
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: new Date('2020-01-01'),
      userId: 'user-1',
    },
    {
      id: 'task-2',
      title: 'Task 2',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      dueDate: new Date('2023-01-01'),
      userId: 'user-1',
    },
    {
      id: 'task-3',
      title: 'Task 3',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      dueDate: new Date('2025-12-31'),
      userId: 'user-1',
    },
  ];

  const mockPrismaService = {
    task: {
      findMany: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return user stats for regular user', async () => {
      const expectedStats = {
        totalTasks: 3,
        tasksByStatus: {
          PENDING: 1,
          IN_PROGRESS: 1,
          COMPLETED: 1,
          CANCELLED: 0,
        },
        tasksByPriority: {
          LOW: 1,
          MEDIUM: 1,
          HIGH: 1,
          URGENT: 0,
        },
        overdueTasks: 1,
        completionRate: 33.3,
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.getDashboardStats('user-1', 'USER');

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual(expectedStats);
    });

    it('should return user and admin stats for admin user', async () => {
      const allTasks = [
        ...mockTasks,
        {
          id: 'task-4',
          title: 'Task 4',
          status: 'COMPLETED',
          priority: 'URGENT',
          dueDate: null,
          userId: 'user-2',
        },
      ];

      const expectedStats = {
        totalTasks: 3,
        tasksByStatus: {
          PENDING: 1,
          IN_PROGRESS: 1,
          COMPLETED: 1,
          CANCELLED: 0,
        },
        tasksByPriority: {
          LOW: 1,
          MEDIUM: 1,
          HIGH: 1,
          URGENT: 0,
        },
        overdueTasks: 1,
        completionRate: 33.3,
        adminStats: {
          totalTasks: 4,
          tasksByStatus: {
            PENDING: 1,
            IN_PROGRESS: 1,
            COMPLETED: 2,
            CANCELLED: 0,
          },
          tasksByPriority: {
            LOW: 1,
            MEDIUM: 1,
            HIGH: 1,
            URGENT: 1,
          },
          overdueTasks: 1,
          completionRate: 50,
        },
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.task.findMany
        .mockResolvedValueOnce(mockTasks)
        .mockResolvedValueOnce(allTasks);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.getDashboardStats('user-1', 'ADMIN');

      expect(mockPrismaService.task.findMany).toHaveBeenCalledTimes(2);
      expect(result).toEqual(expectedStats);
    });

    it('should return cached result if available', async () => {
      const cachedStats = {
        totalTasks: 3,
        tasksByStatus: {
          PENDING: 1,
          IN_PROGRESS: 1,
          COMPLETED: 1,
          CANCELLED: 0,
        },
        tasksByPriority: {
          LOW: 1,
          MEDIUM: 1,
          HIGH: 1,
          URGENT: 0,
        },
        overdueTasks: 1,
        completionRate: 33.3,
      };

      mockCacheManager.get.mockResolvedValue(cachedStats);

      const result = await service.getDashboardStats('user-1', 'USER');

      expect(result).toEqual(cachedStats);
      expect(mockPrismaService.task.findMany).not.toHaveBeenCalled();
    });
  });

  describe('calculateStats', () => {
    it('should calculate correct statistics', () => {
      const result = service['calculateStats'](mockTasks);

      expect(result).toEqual({
        totalTasks: 3,
        tasksByStatus: {
          PENDING: 1,
          IN_PROGRESS: 1,
          COMPLETED: 1,
          CANCELLED: 0,
        },
        tasksByPriority: {
          LOW: 1,
          MEDIUM: 1,
          HIGH: 1,
          URGENT: 0,
        },
        overdueTasks: 1,
        completionRate: 33.3,
      });
    });

    it('should handle empty tasks array', () => {
      const result = service['calculateStats']([]);

      expect(result).toEqual({
        totalTasks: 0,
        tasksByStatus: {
          PENDING: 0,
          IN_PROGRESS: 0,
          COMPLETED: 0,
          CANCELLED: 0,
        },
        tasksByPriority: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          URGENT: 0,
        },
        overdueTasks: 0,
        completionRate: 0,
      });
    });

    it('should correctly identify overdue tasks', () => {
      const tasksWithOverdue = [
        {
          id: 'task-1',
          status: 'PENDING',
          dueDate: new Date('2020-01-01'),
        },
        {
          id: 'task-2',
          status: 'COMPLETED',
          dueDate: new Date('2020-01-01'),
        },
        {
          id: 'task-3',
          status: 'CANCELLED',
          dueDate: new Date('2020-01-01'),
        },
        {
          id: 'task-4',
          status: 'PENDING',
          dueDate: new Date('2030-01-01'),
        },
      ];

      const result = service['calculateStats'](tasksWithOverdue);

      expect(result.overdueTasks).toBe(1);
    });
  });
});
