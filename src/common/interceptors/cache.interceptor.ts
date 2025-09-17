import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Reflector } from '@nestjs/core';

export const CacheKey = Reflector.createDecorator<string>();
export const CacheTTL = Reflector.createDecorator<number>();

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.reflector.get(CacheKey, context.getHandler());
    const ttl = this.reflector.get(CacheTTL, context.getHandler()) || 300000; // 5 minutos padrão

    if (!cacheKey) {
      return next.handle();
    }

    const fullCacheKey = this.generateCacheKey(cacheKey, request);

    const cachedValue = await this.cacheManager.get(fullCacheKey);
    if (cachedValue) {
      response.set('X-Cache', 'HIT');
      return of(cachedValue);
    }

    response.set('X-Cache', 'MISS');
    return next.handle().pipe(
      tap(async (result) => {
        await this.cacheManager.set(fullCacheKey, result, ttl);
      }),
    );
  }

  private generateCacheKey(baseKey: string, request: any): string {
    const userId = request.user?.id || 'anonymous';
    const params = JSON.stringify(request.params || {});
    const query = JSON.stringify(request.query || {});
    
    return `${baseKey}:user:${userId}:params:${params}:query:${query}`;
  }
}
