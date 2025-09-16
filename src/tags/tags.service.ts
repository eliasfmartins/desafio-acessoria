import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async create(createTagDto: CreateTagDto) {
    const { name, color } = createTagDto;

    // Verificar se já existe uma tag com o mesmo nome
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

    // Invalidar cache de tags após criação
    await this.invalidateTagsCache();

    return tag;
  }

  private async invalidateTagsCache() {
    await this.cacheManager.del('tags:all');
  }

  async findAll() {
    const cacheKey = 'tags:all';
    
    // Tentar buscar no cache primeiro
    const cachedTags = await this.cacheManager.get(cacheKey);
    if (cachedTags) {
      return cachedTags;
    }

    const tags = await this.prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    // Armazenar no cache por 10 minutos (tags não mudam com frequência)
    await this.cacheManager.set(cacheKey, tags, 600000);

    return tags;
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag não encontrada');
    }

    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const existingTag = await this.findOne(id);

    // Se está tentando alterar o nome, verificar se já existe
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

    return tag;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.tag.delete({
      where: { id },
    });

    return { message: 'Tag deletada com sucesso' };
  }

  // Métodos para relacionamento com tarefas
  async addTagToTask(taskId: string, tagId: string) {
    // Verificar se a tag existe
    await this.findOne(tagId);

    // Verificar se a tarefa existe
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { tags: true },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    // Verificar se a tag já está associada à tarefa
    const tagAlreadyAssociated = task.tags.some(tag => tag.id === tagId);
    if (tagAlreadyAssociated) {
      throw new ConflictException('Tag já está associada a esta tarefa');
    }

    // Adicionar a tag à tarefa
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        tags: {
          connect: { id: tagId },
        },
      },
    });

    return { message: 'Tag adicionada à tarefa com sucesso' };
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    // Verificar se a tarefa existe
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { tags: true },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    // Verificar se a tag está associada à tarefa
    const tagAssociated = task.tags.some(tag => tag.id === tagId);
    if (!tagAssociated) {
      throw new NotFoundException('Tag não está associada a esta tarefa');
    }

    // Remover a tag da tarefa
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
    });

    return { message: 'Tag removida da tarefa com sucesso' };
  }
}

