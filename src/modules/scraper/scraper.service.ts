import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { CrawlerService } from './services/crawler.service';
import { DeduplicationService } from './services/deduplication.service';
import { AiParserService } from './services/ai-parser.service';
import slugify from 'slugify';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private isRunning = false;
  private memoryLogs: any[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly crawlerService: CrawlerService,
    private readonly deduplicationService: DeduplicationService,
    private readonly aiParserService: AiParserService,
  ) {}

  /**
   * Daily scheduled cron task (runs automatically at 2:00 AM)
   */
  @Cron(process.env.SCRAPER_SCHEDULE || CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyCronSync() {
    this.logger.log('⏰ Daily scheduled scholarship sync triggered by NestJS cron.');
    try {
      await this.runPipeline('Daily Automated Sync');
    } catch (err) {
      this.logger.error(`Error during daily scheduled sync: ${err.message}`);
    }
  }

  /**
   * Execute the full scraping, deduplication, AI extraction, and ingestion pipeline
   */
  async runPipeline(sourceName = 'Manual On-Demand Sync') {
    if (this.isRunning) {
      return {
        status: 'RUNNING',
        message: 'A scraping pipeline job is already in progress.',
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    let itemsFound = 0;
    let itemsIngested = 0;
    let errorMessage: string | null = null;

    this.logger.log(` Starting automated data ingestion pipeline: [${sourceName}]`);

    try {
      // 1. Fetch crawl items (from live RSS feeds, with curated fallback)
      const crawlItems = await this.crawlerService.fetchAllActiveFeeds();
      itemsFound = crawlItems.length;

      for (const item of crawlItems) {
        // 2. Deduplication check
        const { isDuplicate, reason } = await this.deduplicationService.isDuplicate(
          item.sourceUrl,
          item.title,
        );

        if (isDuplicate) {
          this.logger.log(` Skipped duplicate: "${item.title}" (${reason})`);
          continue;
        }

        // 3. AI extraction & normalization
        this.logger.log(` Parsing with AI extractor: "${item.title}"`);
        const extracted = await this.aiParserService.parseRawContent(
          item.rawText,
          item.sourceUrl,
        );

        // 4. Ingest into database
        const baseSlug = slugify(extracted.name, { lower: true, strict: true });
        const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

        if (this.prisma.isConnected) {
          await this.prisma.scholarship.create({
            data: {
              slug,
              name: extracted.name,
              provider: extracted.provider,
              country: extracted.country,
              flag: extracted.flag,
              level: extracted.level,
              field: extracted.field,
              funding: extracted.funding,
              amount: extracted.amount,
              duration: extracted.duration,
              deadline: new Date(extracted.deadline),
              start_date: extracted.start_date,
              eligible_nationalities: extracted.eligible_nationalities,
              eligible_countries: extracted.eligible_countries,
              is_asean_friendly: extracted.is_asean_friendly,
              description: extracted.description,
              short_description: extracted.short_description,
              benefits: extracted.benefits,
              requirements: extracted.requirements,
              documents_required: extracted.documents_required,
              how_to_apply: extracted.how_to_apply,
              official_link: extracted.official_link,
              source_url: item.sourceUrl,
              thumbnail: extracted.thumbnail,
              tags: extracted.tags,
              status: 'PUBLISHED',
              is_featured: false,
            },
          });
        }

        itemsIngested++;
        this.logger.log(` Ingested scholarship: "${extracted.name}" [slug: ${slug}]`);
      }
    } catch (err) {
      errorMessage = err.message;
      this.logger.error(`Pipeline failure: ${err.message}`, err.stack);
    } finally {
      this.isRunning = false;
      const durationMs = Date.now() - startTime;
      const status = errorMessage ? 'FAILED' : 'SUCCESS';

      // 5. Save ScraperLog
      const logEntry = {
        source: sourceName,
        status,
        items_found: itemsFound,
        items_ingested: itemsIngested,
        error_message: errorMessage,
        duration_ms: durationMs,
        created_at: new Date(),
      };

      if (this.prisma.isConnected) {
        try {
          await this.prisma.scraperLog.create({ data: logEntry });
        } catch (logErr) {
          this.logger.error(`Failed to write ScraperLog: ${logErr.message}`);
        }
      } else {
        this.memoryLogs.unshift({ id: `log-${Date.now()}`, ...logEntry });
      }

      this.logger.log(
        `✅ Pipeline finished: status=${status}, found=${itemsFound}, ingested=${itemsIngested}, duration=${durationMs}ms`,
      );

      return {
        success: !errorMessage,
        status,
        source: sourceName,
        items_found: itemsFound,
        items_ingested: itemsIngested,
        duration_ms: durationMs,
        error_message: errorMessage,
      };
    }
  }

  /**
   * Retrieve scraper execution logs
   */
  async getLogs(limit = 20) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.scraperLog.findMany({
          take: limit,
          orderBy: { created_at: 'desc' },
        });
      } catch (err) {
        this.logger.warn(`Prisma getLogs failed: ${err.message}`);
      }
    }

    return this.memoryLogs.slice(0, limit);
  }
}
