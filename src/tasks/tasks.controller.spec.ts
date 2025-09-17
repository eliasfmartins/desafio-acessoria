import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
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

      const mockRequest = { user: mockUser };

      mockTasksService.create.mockResolvedValue(mockTask);

      const result = await controller.create(mockRequest, createTaskDto);

      expect(tasksService.create).toHaveBeenCalledWith('user-1', createTaskDto);
      expect(result).toEqual(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return all tasks with pagination', async () => {
      const query = { page: 1, limit: 10 };
      const mockRequest = { user: mockUser };
      const expectedResult = {
        tasks: [mockTask],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockTasksService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockRequest, query);

      expect(tasksService.findAll).toHaveBeenCalledWith('user-1', query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const mockRequest = { user: mockUser };

      mockTasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne(mockRequest, 'task-1');

      expect(tasksService.findOne).toHaveBeenCalledWith('user-1', 'task-1');
      expect(result).toEqual(mockTask);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto = {
        title: 'Updated Task',
        status: 'IN_PROGRESS' as const,
      };

      const updatedTask = { ...mockTask, ...updateTaskDto };
      const mockRequest = { user: mockUser };

      mockTasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(mockRequest, 'task-1', updateTaskDto);

      expect(tasksService.update).toHaveBeenCalledWith('user-1', 'task-1', updateTaskDto);
      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('should soft delete a task', async () => {
      const mockRequest = { user: mockUser };
      const expectedResult = {
        message: 'Tarefa deletada com sucesso (soft delete)',
        canRestore: true,
      };

      mockTasksService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(mockRequest, 'task-1');

      expect(tasksService.remove).toHaveBeenCalledWith('user-1', 'task-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('restore', () => {
    it('should restore a soft deleted task', async () => {
      const mockRequest = { user: mockUser };
      const expectedResult = {
        message: 'Tarefa restaurada com sucesso',
      };

      mockTasksService.restore.mockResolvedValue(expectedResult);

      const result = await controller.restore(mockRequest, 'task-1');

      expect(tasksService.restore).toHaveBeenCalledWith('user-1', 'task-1');
      expect(result).toEqual(expectedResult);
    });
  });
});
