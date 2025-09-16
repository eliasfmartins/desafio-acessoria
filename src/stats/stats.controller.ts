import { Controller, Get, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheInterceptor, CacheKey, CacheTTL } from '../common/interceptors/cache.interceptor';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('stats:dashboard')
  @CacheTTL(180000) // 3 minutos
  getDashboardStats(@Request() req) {
    return this.statsService.getDashboardStats(req.user.id, req.user.role);
  }
}
