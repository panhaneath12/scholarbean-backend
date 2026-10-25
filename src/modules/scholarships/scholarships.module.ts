import { Module } from '@nestjs/common';
import { ScholarshipsController } from './scholarships.controller';
import { ScholarshipsService } from './scholarships.service';
import { SubmissionsModule } from '../submissions/submissions.module';

@Module({
  imports: [SubmissionsModule],
  controllers: [ScholarshipsController],
  providers: [ScholarshipsService],
  exports: [ScholarshipsService],
})
export class ScholarshipsModule {}
