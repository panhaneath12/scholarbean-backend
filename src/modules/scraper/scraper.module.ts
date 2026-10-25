import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { CrawlerService } from './services/crawler.service';
import { DeduplicationService } from './services/deduplication.service';
import { AiParserService } from './services/ai-parser.service';

@Module({
  providers: [
    ScraperService,
    CrawlerService,
    DeduplicationService,
    AiParserService,
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
