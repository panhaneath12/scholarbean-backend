import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max, IsBoolean, IsIn } from 'class-validator';

export class GetScholarshipsQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 12, description: 'Items per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 12;

  @ApiPropertyOptional({ description: 'Keyword search in name, provider, tags, or description' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Host country (e.g. Japan, UK)' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Degree level',
    enum: ['undergraduate', 'masters', 'phd'],
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'Field of study (e.g. engineering, medicine)' })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({ description: 'Eligible applicant nationality (e.g. Thailand, Cambodia)' })
  @IsOptional()
  @IsString()
  eligible?: string;

  @ApiPropertyOptional({
    description: 'Funding coverage',
    enum: ['full', 'partial'],
  })
  @IsOptional()
  @IsIn(['full', 'partial'])
  funded?: 'full' | 'partial';

  @ApiPropertyOptional({ description: 'Filter only ASEAN-friendly scholarships' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  asean?: boolean;

  @ApiPropertyOptional({
    description: 'Sorting criteria',
    enum: ['newest', 'deadline', 'popular'],
    default: 'newest',
  })
  @IsOptional()
  @IsIn(['newest', 'deadline', 'popular'])
  sort?: 'newest' | 'deadline' | 'popular' = 'newest';
}
