import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { SubmissionsModule } from '../submissions/submissions.module';
import { ScraperModule } from '../scraper/scraper.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SubmissionsModule, ScraperModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
