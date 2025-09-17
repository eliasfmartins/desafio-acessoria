import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const loggerService = app.get(LoggerService);
  app.useLogger(loggerService);
  
  app.useGlobalInterceptors(new LoggingInterceptor(loggerService));
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  loggerService.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
