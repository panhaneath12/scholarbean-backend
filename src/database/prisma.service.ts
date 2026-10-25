import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error', 'warn'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log(' Successfully connected to PostgreSQL database via Prisma');
    } catch (error) {
      this.isConnected = false;
      this.logger.error(
        ` Could not connect to PostgreSQL at ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')}: ${error.message}`,
      );
      this.logger.warn(
        'Database operations will fail until a valid PostgreSQL connection is available. Run `npm run prisma:push` once your PostgreSQL database is reachable.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.isConnected = false;
    this.logger.log('Prisma disconnected from database');
  }
}
