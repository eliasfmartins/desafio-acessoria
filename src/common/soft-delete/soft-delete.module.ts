import { Module } from '@nestjs/common';
import { SoftDeleteService } from './soft-delete.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [SoftDeleteService, PrismaService],
  exports: [SoftDeleteService],
})
export class SoftDeleteModule {}

