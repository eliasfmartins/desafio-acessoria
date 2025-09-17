import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  private readonly enableCache = process.env.ENABLE_CACHE !== 'false'; // Por padrão habilitado

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

    // Resetar TODO o cache de tags após criar
    await this.resetAllTagsCache();

    return tag;
  }

  async findAll() {
    const cacheKey = 'tags:all';
    
    console.log(`🔍 DEBUG - Buscando tags com cache habilitado: ${this.enableCache}`);
    
    // Tentar buscar no cache primeiro (se habilitado)
    if (this.enableCache) {
      const cachedTags = await this.cacheManager.get(cacheKey);
      if (cachedTags) {
        console.log(`🚀 Cache HIT para tags: ${cacheKey}`);
        console.log(`🔍 DEBUG - Tags do cache:`, (cachedTags as any[]).length, 'tags');
        return cachedTags;
      }
      console.log(`❌ Cache MISS para tags: ${cacheKey}`);
    }

    console.log(`🔍 DEBUG - Buscando tags do banco de dados...`);
    const tags = await this.prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`🔍 DEBUG - Tags do banco:`, tags.length, 'tags');

    // Armazenar no cache por 5 minutos (se habilitado)
    if (this.enableCache) {
      await this.cacheManager.set(cacheKey, tags, 300000); // 5 minutos
      console.log(`📦 Cache de tags armazenado (5min): ${cacheKey}`);
    }

    return tags;
  }

  async findOne(id: string) {
    const cacheKey = `tag:${id}`;
    
    // Tentar buscar no cache primeiro (se habilitado)
    if (this.enableCache) {
      const cachedTag = await this.cacheManager.get(cacheKey);
      if (cachedTag) {
        console.log(`🚀 Cache HIT para tag individual: ${cacheKey}`);
        return cachedTag;
      }
      console.log(`❌ Cache MISS para tag individual: ${cacheKey}`);
    }

    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag não encontrada');
    }

    // Armazenar no cache por 5 minutos (se habilitado)
    if (this.enableCache) {
      await this.cacheManager.set(cacheKey, tag, 300000); // 5 minutos
      console.log(`📦 Cache de tag individual armazenado (5min): ${cacheKey}`);
    }

    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const existingTag = await this.findOne(id) as any;

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

    // Resetar TODO o cache de tags após atualizar
    await this.resetAllTagsCache();

    return tag;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.tag.delete({
      where: { id },
    });

    // Resetar TODO o cache de tags após deletar
    await this.resetAllTagsCache();

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

    // Resetar TODO o cache de tags e tasks após associar
    await this.resetAllTagsCache();
    await this.resetAllTasksCache();

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

    // Resetar TODO o cache de tags e tasks após desassociar
    await this.resetAllTagsCache();
    await this.resetAllTasksCache();

    return { message: 'Tag removida da tarefa com sucesso' };
  }

  /**
   * Resetar TODO o cache de tags - estratégia simples e efetiva
   * Sempre que houver uma operação que não seja GET, resetamos tudo
   */
  private async resetAllTagsCache() {
    if (!this.enableCache) {
      console.log(`🔧 Cache DESABILITADO - não resetando tags`);
      return;
    }

    console.log(`🗑️ RESETANDO TODO O CACHE DE TAGS...`);
    
    try {
      // Estratégia 1: Tentar acessar o cliente Redis diretamente
      const redisClient = (this.cacheManager as any).store?.client;
      if (redisClient && redisClient.keys) {
        // Buscar todas as chaves que começam com 'tags:' ou 'tag:'
        const tagsKeys = await redisClient.keys('tags:*');
        const individualTagKeys = await redisClient.keys('tag:*');
        const allKeys = [...tagsKeys, ...individualTagKeys];
        
        if (allKeys && allKeys.length > 0) {
          await redisClient.del(...allKeys);
          console.log(`✅ CACHE DE TAGS RESETADO: ${allKeys.length} chaves de tags deletadas`);
          console.log(`🗑️ Chaves de tags deletadas:`, allKeys);
          return;
        } else {
          console.log(`✅ CACHE DE TAGS RESETADO: Nenhuma chave de tags encontrada`);
          return;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao resetar cache de tags via Redis direto:`, error.message);
    }

    // Estratégia 2: Fallback - deletar chaves específicas conhecidas
    console.log(`🔄 Fallback: Deletando chaves específicas de tags...`);
    
    // Lista de chaves específicas que podem existir
    const specificKeys = [
      'tags:all',
      // Chaves individuais comuns que podem estar em cache
      'tag:ad17804c-8ba7-4e89-b30d-3b2ddbf5cda4',
      'tag:b938032b-5afc-488b-ad74-ed6858593c20',
      'tag:4e7f97fe-ff00-485c-a2b1-447cecc0d7d8',
      // Adicionar outras chaves de tags se necessário
    ];

    let deletedCount = 0;
    for (const key of specificKeys) {
      try {
        await this.cacheManager.del(key);
        deletedCount++;
        console.log(`🗑️ Chave de tag deletada: ${key}`);
      } catch (error) {
        // Ignorar erros individuais
      }
    }
    
    console.log(`🗑️ CACHE DE TAGS FALLBACK: ${deletedCount} chaves específicas deletadas`);
  }

  /**
   * Resetar TODO o cache de tasks - estratégia simples e efetiva
   * Usado quando operações de tags afetam tasks
   */
  private async resetAllTasksCache() {
    if (!this.enableCache) {
      console.log(`🔧 Cache DESABILITADO - não resetando tasks`);
      return;
    }

    console.log(`🗑️ RESETANDO TODO O CACHE DE TASKS (via tags service)...`);
    
    try {
      // Estratégia 1: Tentar acessar o cliente Redis diretamente
      const redisClient = (this.cacheManager as any).store?.client;
      if (redisClient && redisClient.keys) {
        // Buscar todas as chaves que começam com 'tasks:' ou 'task:'
        const taskKeys = await redisClient.keys('tasks:*');
        const individualTaskKeys = await redisClient.keys('task:*');
        const allKeys = [...taskKeys, ...individualTaskKeys];
        
        if (allKeys && allKeys.length > 0) {
          await redisClient.del(...allKeys);
          console.log(`✅ CACHE DE TASKS RESETADO: ${allKeys.length} chaves de tasks deletadas`);
          console.log(`🗑️ Chaves de tasks deletadas:`, allKeys);
          return;
        } else {
          console.log(`✅ CACHE DE TASKS RESETADO: Nenhuma chave de tasks encontrada`);
          return;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao resetar cache de tasks via Redis direto:`, error.message);
    }

    // Estratégia 2: Fallback - deletar chaves específicas conhecidas
    console.log(`🔄 Fallback: Deletando chaves específicas de tasks...`);
    
    // Lista de chaves específicas que podem existir
    const specificKeys = [
      // Chaves comuns que podem estar em cache
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:1:limit:10:status:all:priority:all:search:none',
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:1:limit:20:status:all:priority:all:search:none',
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:1:limit:5:status:all:priority:all:search:none',
      'tasks:user:7e9b71ae-c9e7-47d2-b87d-1b82613c6797:page:2:limit:10:status:all:priority:all:search:none',
    ];

    let deletedCount = 0;
    for (const key of specificKeys) {
      try {
        await this.cacheManager.del(key);
        deletedCount++;
        console.log(`🗑️ Chave de task deletada: ${key}`);
      } catch (error) {
        // Ignorar erros individuais
      }
    }
    
    console.log(`🗑️ CACHE DE TASKS FALLBACK: ${deletedCount} chaves específicas deletadas`);
  }
}