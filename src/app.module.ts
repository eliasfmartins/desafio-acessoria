import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { TagsModule } from './tags/tags.module';
import { AdminModule } from './admin/admin.module';
import { StatsModule } from './stats/stats.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    // Configuração do Cache com Redis
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          store: await redisStore({
            socket: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
            },
            password: process.env.REDIS_PASSWORD,
          }),
          ttl: 300, // 5 minutos padrão
          max: 1000, // máximo 1000 chaves em cache
        };
      },
    }),
    LoggerModule, 
    AuthModule, 
    TasksModule, 
    TagsModule, 
    AdminModule, 
    StatsModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
