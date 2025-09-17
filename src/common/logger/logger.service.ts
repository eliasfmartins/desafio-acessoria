import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const logEntry = {
            timestamp,
            level,
            message,
            context,
            ...meta,
          };
          return JSON.stringify(logEntry);
        })
      ),
      defaultMeta: {
        service: 'acessoria-api',
        version: process.env.npm_package_version || '1.0.0',
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const contextStr = context ? `[${context}]` : '';
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} ${level} ${contextStr} ${message}${metaStr}`;
            })
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string, meta?: any) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    this.logger.error(message, { 
      context, 
      trace, 
      stack: trace,
      ...meta 
    });
  }

  warn(message: string, context?: string, meta?: any) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: any) {
    this.logger.debug(message, { context, ...meta });
  }

  verbose(message: string, context?: string, meta?: any) {
    this.logger.verbose(message, { context, ...meta });
  }

  logRequest(method: string, url: string, statusCode: number, responseTime: number, userAgent?: string, userId?: string) {
    this.log('HTTP Request', 'HTTP', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      userAgent,
      userId,
    });
  }

  logAuth(action: string, email: string, success: boolean, ip?: string, userAgent?: string) {
    const level = success ? 'info' : 'warn';
    this.logger[level](`Authentication ${action}`, {
      context: 'AUTH',
      action,
      email,
      success,
      ip,
      userAgent,
    });
  }

  logDatabase(operation: string, table: string, duration: number, success: boolean, error?: string) {
    const level = success ? 'debug' : 'error';
    this.logger[level](`Database ${operation}`, {
      context: 'DATABASE',
      operation,
      table,
      duration: `${duration}ms`,
      success,
      error,
    });
  }

  logBusiness(action: string, entity: string, entityId: string, userId: string, details?: any) {
    this.log(`Business Action: ${action}`, 'BUSINESS', {
      action,
      entity,
      entityId,
      userId,
      details,
    });
  }

  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) {
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    this.logger[level](`Security Event: ${event}`, {
      context: 'SECURITY',
      event,
      severity,
      ...details,
    });
  }
}
