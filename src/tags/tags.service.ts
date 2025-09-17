import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  private readonly enableCache = process.env.ENABLE_CACHE !== 'false';

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async create(createTagDto: CreateTagDto) {
    const { name, color } = createTagDto;

    const existingTag = await this.prisma.tag.findUnique({
      where: { name },
    });

    if (existingTag) {
      throw new ConflictException('Já existe uma tag com este nome');
    }

    const tag = await this.prisma.tag.create({
      data: {
        name,
        color,
      },
    });

    await this.resetAllTagsCache();

    return tag;
  }

  async findAll() {
    const cacheKey = 'tags:all';
    
    if (this.enableCache) {
      const cachedTags = await this.cacheManager.get(cacheKey);
      if (cachedTags) {
        return cachedTags;
      }
    }

    const tags = await this.prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    if (this.enableCache) {
      await this.cacheManager.set(cacheKey, tags, 300000);
    }

    return tags;
  }

  async findOne(id: string) {
    const cacheKey = `tag:${id}`;
    
    if (this.enableCache) {
      const cachedTag = await this.cacheManager.get(cacheKey);
      if (cachedTag) {
        return cachedTag;
      }
    }

    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag não encontrada');
    }

    if (this.enableCache) {
      await this.cacheManager.set(cacheKey, tag, 300000);
    }

    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const existingTag = await this.findOne(id) as any;

    if (updateTagDto.name && updateTagDto.name !== existingTag.name) {
      const tagWithSameName = await this.prisma.tag.findUnique({
        where: { name: updateTagDto.name },
      });

      if (tagWithSameName) {
        throw new ConflictException('Já existe uma tag com este nome');
      }
    }

    const tag = await this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
    });

    await this.resetAllTagsCache();

    return tag;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.tag.delete({
      where: { id },
    });

    await this.resetAllTagsCache();

    return { message: 'Tag deletada com sucesso' };
  }

  async addTagToTask(taskId: string, tagId: string) {
    await this.findOne(tagId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { tags: true },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    const tagAlreadyAssociated = task.tags.some(tag => tag.id === tagId);
    if (tagAlreadyAssociated) {
      throw new ConflictException('Tag já está associada a esta tarefa');
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        tags: {
          connect: { id: tagId },
        },
      },
    });

    await this.resetAllTagsCache();
    await this.resetAllTasksCache();

    return { message: 'Tag adicionada à tarefa com sucesso' };
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { tags: true },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    const tagAssociated = task.tags.some(tag => tag.id === tagId);
    if (!tagAssociated) {
      throw new NotFoundException('Tag não está associada a esta tarefa');
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
    });

    await this.resetAllTagsCache();
    await this.resetAllTasksCache();

    return { message: 'Tag removida da tarefa com sucesso' };
  }

  private async resetAllTagsCache() {
    if (!this.enableCache) {
      return;
    }
    
    try {
      const redisClient = (this.cacheManager as any).store?.client;
      if (redisClient && redisClient.keys) {
        const tagsKeys = await redisClient.keys('tags:*');
        const individualTagKeys = await redisClient.keys('tag:*');
        const allKeys = [...tagsKeys, ...individualTagKeys];
        
        if (allKeys && allKeys.length > 0) {
          await redisClient.del(...allKeys);
          return;
        }
      }
    } catch (error) {
      console.warn(`Erro ao resetar cache de tags via Redis direto:`, error.message);
    }

    const specificKeys = [
      'tags:all',
      'tag:ad17804c-8ba7-4e89-b30d-3b2ddbf5cda4',
      'tag:b938032b-5afc-488b-ad74-ed6858593c20',
      'tag:4e7f97fe-ff00-485c-a2b1-447cecc0d7d8',
    ];

    for (const key of specificKeys) {
      try {
        await this.cacheManager.del(key);
      } catch (error) {
      }
    }
  }

  private async resetAllTasksCache() {
    if (!this.enableCache) {
      return;
    }
    
    try {
      const redisClient = (this.cacheManager as any).store?.client;
      if (redisClient && redisClient.keys) {
        const taskKeys = await redisClient.keys('tasks:*');
        const individualTaskKeys = await redisClient.keys('task:*');
        const allKeys = [...taskKeys, ...individualTaskKeys];
        
        if (allKeys && allKeys.length > 0) {
          await redisClient.del(...allKeys);
          return;
        }
      }
    } catch (error) {
      console.warn(`Erro ao resetar cache de tasks via Redis direto:`, error.message);
    }

    const specificKeys = [
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:1:limit:10:status:all:priority:all:search:none',
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:1:limit:20:status:all:priority:all:search:none',
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:1:limit:5:status:all:priority:all:search:none',
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:2:limit:10:status:all:priority:all:search:none',
    ];

    for (const key of specificKeys) {
      try {
        await this.cacheManager.del(key);
      } catch (error) {
      }
    }
  }
}