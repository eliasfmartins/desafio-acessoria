import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { SoftDeleteService } from '../common/soft-delete/soft-delete.service';

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: PrismaService;
  let softDeleteService: SoftDeleteService;

  const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tasks: [{ id: 'task-1' }, { id: 'task-2' }],
    _count: {
      tasks: 5,
    },
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
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    tags: [],
  };

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockSoftDeleteService = {
    softDeleteUser: jest.fn(),
    restoreUser: jest.fn(),
    softDeleteTask: jest.fn(),
    restoreTask: jest.fn(),
    findDeletedUsers: jest.fn(),
    findDeletedTasks: jest.fn(),
    hardDeleteUser: jest.fn(),
    hardDeleteTask: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SoftDeleteService,
          useValue: mockSoftDeleteService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get<PrismaService>(PrismaService);
    softDeleteService = module.get<SoftDeleteService>(SoftDeleteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllUsers', () => {
    it('should return all users with task count', async () => {
      const mockUsers = [mockUser];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAllUsers();

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findAllTasks', () => {
    it('should return all tasks with user and tags', async () => {
      const mockTasks = [mockTask];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAllTasks();

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockTasks);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const updatedUser = { ...mockUser, role: 'ADMIN' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole('user-1', 'ADMIN');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateUserRole('user-1', 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockSoftDeleteService.softDeleteUser.mockResolvedValue(undefined);

      const result = await service.deleteUser('user-1');

      expect(mockSoftDeleteService.softDeleteUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        message: 'Usuário deletado com sucesso (soft delete)',
        deletedTasks: 2,
        canRestore: true,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findDeletedUsers', () => {
    it('should return all deleted users', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      const mockDeletedUsers = [deletedUser];

      mockSoftDeleteService.findDeletedUsers.mockResolvedValue(mockDeletedUsers);

      const result = await service.findDeletedUsers();

      expect(mockSoftDeleteService.findDeletedUsers).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedUsers);
    });
  });

  describe('findDeletedTasks', () => {
    it('should return all deleted tasks', async () => {
      const deletedTask = { ...mockTask, deletedAt: new Date() };
      const mockDeletedTasks = [deletedTask];

      mockSoftDeleteService.findDeletedTasks.mockResolvedValue(mockDeletedTasks);

      const result = await service.findDeletedTasks();

      expect(mockSoftDeleteService.findDeletedTasks).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedTasks);
    });
  });

  describe('restoreUser', () => {
    it('should restore a deleted user', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };

      mockPrismaService.user.findUnique.mockResolvedValue(deletedUser);
      mockSoftDeleteService.restoreUser.mockResolvedValue(undefined);

      const result = await service.restoreUser('user-1');

      expect(mockSoftDeleteService.restoreUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        message: 'Usuário restaurado com sucesso',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.restoreUser('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restoreTask', () => {
    it('should restore a deleted task', async () => {
      const deletedTask = { ...mockTask, deletedAt: new Date() };

      mockPrismaService.task.findUnique.mockResolvedValue(deletedTask);
      mockSoftDeleteService.restoreTask.mockResolvedValue(undefined);

      const result = await service.restoreTask('task-1');

      expect(mockSoftDeleteService.restoreTask).toHaveBeenCalledWith('task-1');
      expect(result).toEqual({
        message: 'Task restaurada com sucesso',
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.restoreTask('task-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hardDeleteUser', () => {
    it('should permanently delete a user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockSoftDeleteService.hardDeleteUser.mockResolvedValue(undefined);

      const result = await service.hardDeleteUser('user-1');

      expect(mockSoftDeleteService.hardDeleteUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        message: 'Usuário deletado permanentemente',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.hardDeleteUser('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hardDeleteTask', () => {
    it('should permanently delete a task', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockSoftDeleteService.hardDeleteTask.mockResolvedValue(undefined);

      const result = await service.hardDeleteTask('task-1');

      expect(mockSoftDeleteService.hardDeleteTask).toHaveBeenCalledWith('task-1');
      expect(result).toEqual({
        message: 'Task deletada permanentemente',
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.hardDeleteTask('task-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
