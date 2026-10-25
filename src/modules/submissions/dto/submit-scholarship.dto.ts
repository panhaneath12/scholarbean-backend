import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  IsArray,
  ArrayMinSize,
  IsUrl,
  IsEmail,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsDateString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: string, _args: ValidationArguments) {
    if (!propertyValue) return false;
    const date = new Date(propertyValue);
    if (isNaN(date.getTime())) return false;
    // Check if the date is today or later
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return date >= now;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Deadline must be a valid future date';
  }
}

export class SubmitScholarshipDto {
  @ApiProperty({ example: 'Chevening Scholarship 2026', minLength: 5 })
  @IsString()
  @MinLength(5, { message: 'name must be at least 5 characters' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @ApiProperty({ example: 'UK Government', minLength: 3 })
  @IsString()
  @MinLength(3, { message: 'provider must be at least 3 characters' })
  @IsNotEmpty({ message: 'provider is required' })
  provider: string;

  @ApiProperty({ example: 'United Kingdom' })
  @IsString()
  @IsNotEmpty({ message: 'country is required' })
  country: string;

  @ApiProperty({
    example: ['masters'],
    description: 'Degree levels supported',
    type: [String],
  })
  @IsArray({ message: 'level must be an array' })
  @ArrayMinSize(1, { message: 'level must contain at least 1 item' })
  @IsString({ each: true })
  level: string[];

  @ApiPropertyOptional({
    example: ['any'],
    description: 'Fields of study',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  field: string[] = ['any'];

  @ApiProperty({ example: 'full', enum: ['full', 'partial'] })
  @IsString()
  @IsIn(['full', 'partial'], { message: 'funding must be full or partial' })
  funding: 'full' | 'partial';

  @ApiPropertyOptional({ example: 'Full tuition + monthly living stipend' })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiProperty({ example: '2026-11-05', description: 'ISO 8601 date string' })
  @IsDateString({}, { message: 'deadline must be a valid ISO date string' })
  @Validate(IsFutureDateConstraint)
  deadline: string;

  @ApiProperty({ example: 'https://www.chevening.org/apply/' })
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'official_link must be a valid HTTPS URL' },
  )
  @IsNotEmpty({ message: 'official_link is required' })
  official_link: string;

  @ApiPropertyOptional({
    example: 'Prestigious global scholarship funded by the UK government.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'student@example.com' })
  @IsEmail({}, { message: 'submitter_email must be a valid email format' })
  @IsNotEmpty({ message: 'submitter_email is required' })
  submitter_email: string;
}
