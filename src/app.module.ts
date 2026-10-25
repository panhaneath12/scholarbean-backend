import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';

import { DatabaseModule } from './database/database.module';
import { ScholarshipsModule } from './modules/scholarships/scholarships.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { MetaModule } from './modules/meta/meta.module';
import { SearchModule } from './modules/search/search.module';
import { AuthModule } from './modules/auth/auth.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),

    // Background scheduled cron jobs
    ScheduleModule.forRoot(),

    // Rate Limiting (60 requests / minute default)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120,
      },
    ]),

    // In-memory response caching (1 hour default TTL)
    CacheModule.register({
      isGlobal: true,
      ttl: 3600000,
    }),

    // Database
    DatabaseModule,

    // Core Domain Modules
    ScholarshipsModule,
    SubmissionsModule,
    MetaModule,
    SearchModule,
    AuthModule,
    ScraperModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
