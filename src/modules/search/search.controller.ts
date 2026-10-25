import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('autocomplete')
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 req/min limit to prevent spam
  @ApiOperation({
    summary: 'Live autocomplete suggestions for search bar dropdown (minimum 2 characters)',
  })
  @ApiQuery({
    name: 'q',
    description: 'Query string for search suggestions (e.g. "mext", "japan")',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Top 5 matching scholarships with id, name, country, and funding type',
  })
  async autocomplete(@Query('q') query: string) {
    return this.searchService.autocomplete(query || '');
  }
}
