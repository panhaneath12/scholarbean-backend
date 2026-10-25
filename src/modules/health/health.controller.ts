import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Backend uptime and database connectivity health check' })
  @ApiResponse({
    status: 200,
    description: 'System health status',
    schema: {
      example: {
        status: 'ok',
        uptime: 120.45,
        database: {
          connected: true,
          mode: 'postgresql',
        },
        timestamp: '2026-10-25T13:40:00.000Z',
      },
    },
  })
  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      database: {
        connected: this.prisma.isConnected,
        mode: this.prisma.isConnected ? 'postgresql' : 'in-memory-fallback',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
