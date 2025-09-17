import { Test, TestingModule } from '@nestjs/testing';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('StatsController', () => {
  let controller: StatsController;
  let statsService: StatsService;

  const mockStatsService = {
    getDashboardStats: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  };

  const mockStats = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [
        {
          provide: StatsService,
          useValue: mockStatsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StatsController>(StatsController);
    statsService = module.get<StatsService>(StatsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard stats for regular user', async () => {
      const mockRequest = { user: mockUser };

      mockStatsService.getDashboardStats.mockResolvedValue(mockStats);

      const result = await controller.getDashboardStats(mockRequest);

      expect(statsService.getDashboardStats).toHaveBeenCalledWith('user-1', 'USER');
      expect(result).toEqual(mockStats);
    });

    it('should return dashboard stats for admin user', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      const mockRequest = { user: adminUser };
      const adminStats = {
        ...mockStats,
        adminStats: {
          totalTasks: 10,
          tasksByStatus: {
            PENDING: 3,
            IN_PROGRESS: 2,
            COMPLETED: 4,
            CANCELLED: 1,
          },
          tasksByPriority: {
            LOW: 2,
            MEDIUM: 3,
            HIGH: 3,
            URGENT: 2,
          },
          overdueTasks: 2,
          completionRate: 40,
        },
      };

      mockStatsService.getDashboardStats.mockResolvedValue(adminStats);

      const result = await controller.getDashboardStats(mockRequest);

      expect(statsService.getDashboardStats).toHaveBeenCalledWith('user-1', 'ADMIN');
      expect(result).toEqual(adminStats);
    });
  });
});
