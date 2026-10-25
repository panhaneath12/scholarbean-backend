import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetaService } from './meta.service';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('Platform Meta')
@Controller('meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // 1 hour TTL
  @ApiOperation({
    summary: 'Get platform stats, category counts, and popular destination countries',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform overview statistics and category data for homepage',
  })
  async getMeta() {
    return this.metaService.getPlatformMeta();
  }
}
