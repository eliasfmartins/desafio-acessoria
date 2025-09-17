import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    findAllUsers: jest.fn(),
    findAllTasks: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
    findDeletedUsers: jest.fn(),
    findDeletedTasks: jest.fn(),
    restoreUser: jest.fn(),
    restoreTask: jest.fn(),
    hardDeleteUser: jest.fn(),
    hardDeleteTask: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [mockUser];

      mockAdminService.findAllUsers.mockResolvedValue(mockUsers);

      const result = await controller.findAllUsers();

      expect(adminService.findAllUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findAllTasks', () => {
    it('should return all tasks', async () => {
      const mockTasks = [mockTask];

      mockAdminService.findAllTasks.mockResolvedValue(mockTasks);

      const result = await controller.findAllTasks();

      expect(adminService.findAllTasks).toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const body = { role: 'ADMIN' as const };
      const updatedUser = { ...mockUser, role: 'ADMIN' };

      mockAdminService.updateUserRole.mockResolvedValue(updatedUser);

      const result = await controller.updateUserRole('user-1', body);

      expect(adminService.updateUserRole).toHaveBeenCalledWith('user-1', 'ADMIN');
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user', async () => {
      const expectedResult = {
        message: 'Usuário deletado com sucesso (soft delete)',
        canRestore: true,
      };

      mockAdminService.deleteUser.mockResolvedValue(expectedResult);

      const result = await controller.deleteUser('user-1');

      expect(adminService.deleteUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findDeletedUsers', () => {
    it('should return all deleted users', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      const mockDeletedUsers = [deletedUser];

      mockAdminService.findDeletedUsers.mockResolvedValue(mockDeletedUsers);

      const result = await controller.findDeletedUsers();

      expect(adminService.findDeletedUsers).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedUsers);
    });
  });

  describe('findDeletedTasks', () => {
    it('should return all deleted tasks', async () => {
      const deletedTask = { ...mockTask, deletedAt: new Date() };
      const mockDeletedTasks = [deletedTask];

      mockAdminService.findDeletedTasks.mockResolvedValue(mockDeletedTasks);

      const result = await controller.findDeletedTasks();

      expect(adminService.findDeletedTasks).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedTasks);
    });
  });

  describe('restoreUser', () => {
    it('should restore a deleted user', async () => {
      const expectedResult = {
        message: 'Usuário restaurado com sucesso',
      };

      mockAdminService.restoreUser.mockResolvedValue(expectedResult);

      const result = await controller.restoreUser('user-1');

      expect(adminService.restoreUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('restoreTask', () => {
    it('should restore a deleted task', async () => {
      const expectedResult = {
        message: 'Tarefa restaurada com sucesso',
      };

      mockAdminService.restoreTask.mockResolvedValue(expectedResult);

      const result = await controller.restoreTask('task-1');

      expect(adminService.restoreTask).toHaveBeenCalledWith('task-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('hardDeleteUser', () => {
    it('should permanently delete a user', async () => {
      const expectedResult = {
        message: 'Usuário deletado permanentemente',
      };

      mockAdminService.hardDeleteUser.mockResolvedValue(expectedResult);

      const result = await controller.hardDeleteUser('user-1');

      expect(adminService.hardDeleteUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('hardDeleteTask', () => {
    it('should permanently delete a task', async () => {
      const expectedResult = {
        message: 'Tarefa deletada permanentemente',
      };

      mockAdminService.hardDeleteTask.mockResolvedValue(expectedResult);

      const result = await controller.hardDeleteTask('task-1');

      expect(adminService.hardDeleteTask).toHaveBeenCalledWith('task-1');
      expect(result).toEqual(expectedResult);
    });
  });
});
