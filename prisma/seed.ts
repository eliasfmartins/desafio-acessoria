import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Criar 5 usuários
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@acessoria.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        email: 'joao@acessoria.com',
        name: 'João Silva',
        password: hashedPassword,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria@acessoria.com',
        name: 'Maria Santos',
        password: hashedPassword,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'pedro@acessoria.com',
        name: 'Pedro Costa',
        password: hashedPassword,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'ana@acessoria.com',
        name: 'Ana Oliveira',
        password: hashedPassword,
        role: 'USER',
      },
    }),
  ]);

  console.log('✅ 5 usuários criados');

  // Criar 5 tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: 'Urgente',
        color: '#FF0000',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Importante',
        color: '#FFA500',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Desenvolvimento',
        color: '#008000',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Bug',
        color: '#800080',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Feature',
        color: '#0000FF',
      },
    }),
  ]);

  console.log('✅ 5 tags criadas');

  // Criar 5 tasks para cada usuário (exceto admin)
  const regularUsers = users.filter(user => user.role === 'USER');
  
  for (const user of regularUsers) {
    const userTasks = await Promise.all([
      prisma.task.create({
        data: {
          title: `Implementar funcionalidade X - ${user.name}`,
          description: `Criar nova funcionalidade para o usuário ${user.name}`,
          status: 'PENDING',
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
          userId: user.id,
        },
      }),
      prisma.task.create({
        data: {
          title: `Corrigir bug Y - ${user.name}`,
          description: `Resolver problema identificado pelo usuário ${user.name}`,
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
          userId: user.id,
        },
      }),
      prisma.task.create({
        data: {
          title: `Revisar código - ${user.name}`,
          description: `Fazer code review do trabalho do usuário ${user.name}`,
          status: 'COMPLETED',
          priority: 'LOW',
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
          userId: user.id,
        },
      }),
      prisma.task.create({
        data: {
          title: `Testes unitários - ${user.name}`,
          description: `Escrever testes para o código do usuário ${user.name}`,
          status: 'PENDING',
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias
          userId: user.id,
        },
      }),
      prisma.task.create({
        data: {
          title: `Documentação - ${user.name}`,
          description: `Atualizar documentação do projeto do usuário ${user.name}`,
          status: 'CANCELLED',
          priority: 'LOW',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias
          userId: user.id,
        },
      }),
    ]);

    // Associar algumas tags às tasks
    await Promise.all([
      // Task 1 - Urgente + Desenvolvimento
      prisma.task.update({
        where: { id: userTasks[0].id },
        data: {
          tags: {
            connect: [
              { id: tags[0].id }, // Urgente
              { id: tags[2].id }, // Desenvolvimento
            ],
          },
        },
      }),
      // Task 2 - Bug + Importante
      prisma.task.update({
        where: { id: userTasks[1].id },
        data: {
          tags: {
            connect: [
              { id: tags[3].id }, // Bug
              { id: tags[1].id }, // Importante
            ],
          },
        },
      }),
      // Task 3 - Feature
      prisma.task.update({
        where: { id: userTasks[2].id },
        data: {
          tags: {
            connect: [
              { id: tags[4].id }, // Feature
            ],
          },
        },
      }),
    ]);
  }

  console.log('✅ 5 tasks criadas para cada usuário (20 tasks total)');
  console.log('✅ Tags associadas às tasks');
  
  console.log(`📊 Resumo do seed:`);
  console.log(`   - ${users.length} usuários criados (1 admin, 4 usuários)`);
  console.log(`   - ${tags.length} tags criadas`);
  console.log(`   - ${regularUsers.length * 5} tasks criadas`);
  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
