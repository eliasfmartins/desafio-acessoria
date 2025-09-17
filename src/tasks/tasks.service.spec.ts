import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { SoftDeleteService } from '../common/soft-delete/soft-delete.service';

describe('TasksService', () => {
  let service: TasksService;
  let prismaService: PrismaService;
  let softDeleteService: SoftDeleteService;
  let cacheManager: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: null,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tags: [],
  };

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockSoftDeleteService = {
    softDeleteTask: jest.fn(),
    restoreTask: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SoftDeleteService,
          useValue: mockSoftDeleteService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prismaService = module.get<PrismaService>(PrismaService);
    softDeleteService = module.get<SoftDeleteService>(SoftDeleteService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'PENDING' as const,
        priority: 'MEDIUM' as const,
      };

      mockPrismaService.task.create.mockResolvedValue(mockTask);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.create('user-1', createTaskDto);

      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          status: 'PENDING',
          priority: 'MEDIUM',
          dueDate: null,
          userId: 'user-1',
        },
        include: {
          tags: true,
        },
      });
      expect(result).toEqual(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return tasks with pagination', async () => {
      const query = { page: 1, limit: 10 };
      const mockTasks = [mockTask];
      const mockTotal = 1;

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(mockTotal);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.findAll('user-1', query);

      expect(result).toEqual({
        tasks: mockTasks,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should return cached result if available', async () => {
      const query = { page: 1, limit: 10 };
      const cachedResult = {
        tasks: [mockTask],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.findAll('user-1', query);

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.task.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.findOne('user-1', 'task-1');

      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          userId: 'user-1',
          deletedAt: null,
        },
        include: {
          tags: true,
        },
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'task-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto = {
        title: 'Updated Task',
        status: 'IN_PROGRESS' as const,
      };

      const updatedTask = { ...mockTask, ...updateTaskDto };

      mockCacheManager.get.mockResolvedValue(mockTask);
      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.update('user-1', 'task-1', updateTaskDto);

      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: updateTaskDto,
        include: {
          tags: true,
        },
      });
      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('should soft delete a task', async () => {
      mockCacheManager.get.mockResolvedValue(mockTask);
      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockSoftDeleteService.softDeleteTask.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.remove('user-1', 'task-1');

      expect(mockSoftDeleteService.softDeleteTask).toHaveBeenCalledWith('task-1');
      expect(result).toEqual({
        message: 'Tarefa deletada com sucesso (soft delete)',
        canRestore: true,
      });
    });
  });

  describe('restore', () => {
    it('should restore a soft deleted task', async () => {
      const deletedTask = { ...mockTask, deletedAt: new Date() };

      mockPrismaService.task.findUnique.mockResolvedValue(deletedTask);
      mockSoftDeleteService.restoreTask.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.restore('user-1', 'task-1');

      expect(mockSoftDeleteService.restoreTask).toHaveBeenCalledWith('task-1');
      expect(result).toEqual({
        message: 'Tarefa restaurada com sucesso',
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.restore('user-1', 'task-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const otherUserTask = { ...mockTask, userId: 'other-user' };

      mockPrismaService.task.findUnique.mockResolvedValue(otherUserTask);

      await expect(service.restore('user-1', 'task-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if task is not deleted', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(service.restore('user-1', 'task-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
