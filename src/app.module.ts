import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { TagsModule } from './tags/tags.module';
import { AdminModule } from './admin/admin.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [AuthModule, TasksModule, TagsModule, AdminModule, StatsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
