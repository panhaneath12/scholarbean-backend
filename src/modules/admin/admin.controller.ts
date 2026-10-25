import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmissionsService } from '../submissions/submissions.service';
import { ScraperService } from '../scraper/scraper.service';

@ApiTags('Admin & Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly scraperService: ScraperService,
  ) {}

  /**
   * List community submissions for review
   */
  @Get('submissions')
  @ApiOperation({ summary: 'View community submissions queue (e.g. status=PENDING)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  async getSubmissions(@Query('status') status?: string) {
    return this.submissionsService.getSubmissions(status);
  }

  /**
   * One-click approval to publish to the main Scholarship table
   */
  @Post('submissions/:id/approve')
  @ApiOperation({ summary: 'One-click approval to publish submission to live scholarships' })
  @ApiResponse({ status: 200, description: 'Submission approved and published' })
  async approveSubmission(@Param('id') id: string) {
    return this.submissionsService.approveSubmission(id);
  }

  /**
   * Reject community submission with optional notes
   */
  @Post('submissions/:id/reject')
  @ApiOperation({ summary: 'Reject submission with optional review notes' })
  async rejectSubmission(
    @Param('id') id: string,
    @Body('notes') notes?: string,
  ) {
    return this.submissionsService.rejectSubmission(id, notes);
  }

  /**
   * Manually trigger scraper ingestion pipeline
   */
  @Post('scraper/trigger')
  @ApiOperation({ summary: 'Manually trigger web scraping and AI ingestion pipeline' })
  @ApiResponse({ status: 200, description: 'Pipeline triggered and executed' })
  async triggerScraper(@Body('source') source?: string) {
    return this.scraperService.runPipeline(source || 'Admin Manual Trigger');
  }

  /**
   * View scraper execution logs and extraction stats
   */
  @Get('scraper/logs')
  @ApiOperation({ summary: 'View scraper logs, ingestion count, and errors' })
  async getScraperLogs(@Query('limit') limit?: number) {
    return this.scraperService.getLogs(limit ? Number(limit) : 20);
  }
}
