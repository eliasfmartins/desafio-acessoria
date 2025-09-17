import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TagsService', () => {
  let service: TagsService;
  let prismaService: PrismaService;
  let cacheManager: any;

  const mockTag = {
    id: 'tag-1',
    name: 'Test Tag',
    color: '#FF5733',
    createdAt: new Date(),
    updatedAt: new Date(),
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
    tag: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
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
        TagsService,
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

    service = module.get<TagsService>(TagsService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      const createTagDto = {
        name: 'Test Tag',
        color: '#FF5733',
      };

      mockPrismaService.tag.findUnique.mockResolvedValue(null);
      mockPrismaService.tag.create.mockResolvedValue(mockTag);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.create(createTagDto);

      expect(mockPrismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { name: createTagDto.name },
      });
      expect(mockPrismaService.tag.create).toHaveBeenCalledWith({
        data: createTagDto,
      });
      expect(result).toEqual(mockTag);
    });

    it('should throw ConflictException if tag name already exists', async () => {
      const createTagDto = {
        name: 'Test Tag',
        color: '#FF5733',
      };

      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);

      await expect(service.create(createTagDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all tags', async () => {
      const mockTags = [mockTag];

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.tag.findMany.mockResolvedValue(mockTags);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.findAll();

      expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: 'asc',
        },
      });
      expect(result).toEqual(mockTags);
    });

    it('should return cached result if available', async () => {
      const mockTags = [mockTag];

      mockCacheManager.get.mockResolvedValue(mockTags);

      const result = await service.findAll();

      expect(result).toEqual(mockTags);
      expect(mockPrismaService.tag.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a tag by id', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.findOne('tag-1');

      expect(mockPrismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
      });
      expect(result).toEqual(mockTag);
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.tag.findUnique.mockResolvedValue(null);

      await expect(service.findOne('tag-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a tag', async () => {
      const updateTagDto = {
        color: '#00FF00',
      };

      const updatedTag = { ...mockTag, ...updateTagDto };

      mockCacheManager.get.mockResolvedValue(mockTag);
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPrismaService.tag.update.mockResolvedValue(updatedTag);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.update('tag-1', updateTagDto);

      expect(mockPrismaService.tag.update).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
        data: updateTagDto,
      });
      expect(result).toEqual(updatedTag);
    });

    it('should throw ConflictException if new name already exists', async () => {
      const updateTagDto = {
        name: 'Existing Tag',
      };

      const existingTag = { ...mockTag, name: 'Existing Tag' };

      mockCacheManager.get.mockResolvedValue(mockTag);
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(mockTag)
        .mockResolvedValueOnce(existingTag);

      await expect(service.update('tag-1', updateTagDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a tag', async () => {
      mockCacheManager.get.mockResolvedValue(mockTag);
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPrismaService.tag.delete.mockResolvedValue(mockTag);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.remove('tag-1');

      expect(mockPrismaService.tag.delete).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
      });
      expect(result).toEqual({
        message: 'Tag deletada com sucesso',
      });
    });
  });

  describe('addTagToTask', () => {
    it('should add a tag to a task', async () => {
      const taskWithTags = { ...mockTask, tags: [] };

      mockCacheManager.get.mockResolvedValue(mockTag);
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPrismaService.task.findUnique.mockResolvedValue(taskWithTags);
      mockPrismaService.task.update.mockResolvedValue(taskWithTags);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.addTagToTask('task-1', 'tag-1');

      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: {
          tags: {
            connect: { id: 'tag-1' },
          },
        },
      });
      expect(result).toEqual({
        message: 'Tag adicionada à tarefa com sucesso',
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockCacheManager.get.mockResolvedValue(mockTag);
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.addTagToTask('task-1', 'tag-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if tag already associated', async () => {
      const taskWithTags = { ...mockTask, tags: [mockTag] };

      mockCacheManager.get.mockResolvedValue(mockTag);
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPrismaService.task.findUnique.mockResolvedValue(taskWithTags);

      await expect(service.addTagToTask('task-1', 'tag-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removeTagFromTask', () => {
    it('should remove a tag from a task', async () => {
      const taskWithTags = { ...mockTask, tags: [mockTag] };

      mockPrismaService.task.findUnique.mockResolvedValue(taskWithTags);
      mockPrismaService.task.update.mockResolvedValue(taskWithTags);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.removeTagFromTask('task-1', 'tag-1');

      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: {
          tags: {
            disconnect: { id: 'tag-1' },
          },
        },
      });
      expect(result).toEqual({
        message: 'Tag removida da tarefa com sucesso',
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.removeTagFromTask('task-1', 'tag-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if tag not associated', async () => {
      const taskWithTags = { ...mockTask, tags: [] };

      mockPrismaService.task.findUnique.mockResolvedValue(taskWithTags);

      await expect(service.removeTagFromTask('task-1', 'tag-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
