import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('TagsController', () => {
  let controller: TagsController;
  let tagsService: TagsService;

  const mockTagsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addTagToTask: jest.fn(),
    removeTagFromTask: jest.fn(),
  };

  const mockTag = {
    id: 'tag-1',
    name: 'Test Tag',
    color: '#FF5733',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        {
          provide: TagsService,
          useValue: mockTagsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TagsController>(TagsController);
    tagsService = module.get<TagsService>(TagsService);
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

      mockTagsService.create.mockResolvedValue(mockTag);

      const result = await controller.create(createTagDto);

      expect(tagsService.create).toHaveBeenCalledWith(createTagDto);
      expect(result).toEqual(mockTag);
    });
  });

  describe('findAll', () => {
    it('should return all tags', async () => {
      const mockTags = [mockTag];

      mockTagsService.findAll.mockResolvedValue(mockTags);

      const result = await controller.findAll();

      expect(tagsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTags);
    });
  });

  describe('findOne', () => {
    it('should return a tag by id', async () => {
      mockTagsService.findOne.mockResolvedValue(mockTag);

      const result = await controller.findOne('tag-1');

      expect(tagsService.findOne).toHaveBeenCalledWith('tag-1');
      expect(result).toEqual(mockTag);
    });
  });

  describe('update', () => {
    it('should update a tag', async () => {
      const updateTagDto = {
        name: 'Updated Tag',
        color: '#00FF00',
      };

      const updatedTag = { ...mockTag, ...updateTagDto };

      mockTagsService.update.mockResolvedValue(updatedTag);

      const result = await controller.update('tag-1', updateTagDto);

      expect(tagsService.update).toHaveBeenCalledWith('tag-1', updateTagDto);
      expect(result).toEqual(updatedTag);
    });
  });

  describe('remove', () => {
    it('should delete a tag', async () => {
      const expectedResult = {
        message: 'Tag deletada com sucesso',
      };

      mockTagsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove('tag-1');

      expect(tagsService.remove).toHaveBeenCalledWith('tag-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('addTagToTask', () => {
    it('should add a tag to a task', async () => {
      const body = { tagId: 'tag-1' };
      const expectedResult = {
        message: 'Tag adicionada à tarefa com sucesso',
      };

      mockTagsService.addTagToTask.mockResolvedValue(expectedResult);

      const result = await controller.addTagToTask('task-1', body);

      expect(tagsService.addTagToTask).toHaveBeenCalledWith('task-1', 'tag-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('removeTagFromTask', () => {
    it('should remove a tag from a task', async () => {
      const expectedResult = {
        message: 'Tag removida da tarefa com sucesso',
      };

      mockTagsService.removeTagFromTask.mockResolvedValue(expectedResult);

      const result = await controller.removeTagFromTask('task-1', 'tag-1');

      expect(tagsService.removeTagFromTask).toHaveBeenCalledWith('task-1', 'tag-1');
      expect(result).toEqual(expectedResult);
    });
  });
});
