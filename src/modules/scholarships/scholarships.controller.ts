import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ScholarshipsService } from './scholarships.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { GetScholarshipsQueryDto } from './dto/get-scholarships-query.dto';
import { SubmitScholarshipDto } from '../submissions/dto/submit-scholarship.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('Scholarships')
@Controller('scholarships')
export class ScholarshipsController {
  constructor(
    private readonly scholarshipsService: ScholarshipsService,
    private readonly submissionsService: SubmissionsService,
  ) {}

  /**
   * ⚠️ IMPORTANT: /featured MUST be defined before /:id to prevent route shadowing
   */
  @Get('featured')
  @ApiOperation({
    summary: 'Get 6 featured scholarships for the homepage hero/featured section',
  })
  @ApiResponse({
    status: 200,
    description: 'List of 6 featured scholarships',
  })
  async getFeatured() {
    return this.scholarshipsService.findFeatured();
  }

  /**
   * Filtered search and paginated list of scholarships
   */
  @Get()
  @ApiOperation({
    summary: 'Search and filter scholarships with pagination and sorting',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated scholarships with metadata',
  })
  async getAll(@Query() query: GetScholarshipsQueryDto) {
    return this.scholarshipsService.findAll(query);
  }

  /**
   * Community submission endpoint (POST /api/scholarships/submit)
   */
  @Post('submit')
  @ApiOperation({
    summary: 'Submit a new scholarship proposal for editorial review',
  })
  @ApiResponse({
    status: 201,
    description: 'Submission received and placed in PENDING queue',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async submitScholarship(@Body() dto: SubmitScholarshipDto) {
    return this.submissionsService.submit(dto);
  }

  /**
   * Scholarship details by ID or SEO slug
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get full scholarship breakdown by ID or SEO slug',
  })
  @ApiParam({
    name: 'id',
    description: 'Scholarship slug (e.g. chevening-2026) or UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Full scholarship detail including requirements and application steps',
  })
  @ApiResponse({
    status: 404,
    description: 'Scholarship not found',
  })
  async getDetail(@Param('id') id: string) {
    return this.scholarshipsService.findByIdOrSlug(id);
  }
}
