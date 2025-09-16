import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar logger
  const loggerService = app.get(LoggerService);
  app.useLogger(loggerService);
  
  // Configurar interceptor de logging
  app.useGlobalInterceptors(new LoggingInterceptor(loggerService));
  
  // Configurar validação global
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
