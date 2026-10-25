import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubmitScholarshipDto } from './dto/submit-scholarship.dto';
import { getCountryFlag, isAseanCountry } from '../../common/constants/asean.constants';
import slugify from 'slugify';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);
  private memorySubmissions: any[] = [];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit scholarship from community into PENDING review queue
   */
  async submit(dto: SubmitScholarshipDto) {
    this.logger.log(`New scholarship submission received: "${dto.name}" from ${dto.submitter_email}`);

    const deadlineDate = new Date(dto.deadline);

    if (this.prisma.isConnected) {
      try {
        const record = await this.prisma.submission.create({
          data: {
            name: dto.name,
            provider: dto.provider,
            country: dto.country,
            level: dto.level,
            field: dto.field || ['any'],
            funding: dto.funding,
            amount: dto.amount || 'See official website for details',
            deadline: deadlineDate,
            official_link: dto.official_link,
            description: dto.description || '',
            submitter_email: dto.submitter_email,
            status: 'PENDING',
          },
        });

        return {
          success: true,
          message: 'Thank you! Your submission will be reviewed within 48 hours.',
          id: record.id,
        };
      } catch (err) {
        this.logger.error(`Failed to save submission in Prisma: ${err.message}`);
      }
    }

    // Memory fallback
    const id = `sub-${Date.now()}`;
    const newSubmission = {
      id,
      ...dto,
      amount: dto.amount || 'See official website for details',
      field: dto.field || ['any'],
      deadline: deadlineDate,
      status: 'PENDING',
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.memorySubmissions.push(newSubmission);

    return {
      success: true,
      message: 'Thank you! Your submission will be reviewed within 48 hours.',
      id,
    };
  }

  /**
   * Admin: List submissions by status
   */
  async getSubmissions(status?: string) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.submission.findMany({
          where: status ? { status } : undefined,
          orderBy: { created_at: 'desc' },
        });
      } catch (err) {
        this.logger.warn(`Prisma getSubmissions failed: ${err.message}`);
      }
    }

    if (status) {
      return this.memorySubmissions.filter((s) => s.status === status);
    }
    return this.memorySubmissions;
  }

  /**
   * Admin: One-click approval to publish to main Scholarship table
   */
  async approveSubmission(id: string) {
    let submission: any = null;

    if (this.prisma.isConnected) {
      submission = await this.prisma.submission.findUnique({ where: { id } });
    } else {
      submission = this.memorySubmissions.find((s) => s.id === id);
    }

    if (!submission) {
      throw new NotFoundException(`Submission with id ${id} not found.`);
    }

    // Generate SEO friendly slug
    const baseSlug = slugify(submission.name, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    const flag = getCountryFlag(submission.country);
    const isAsean = isAseanCountry(submission.country);

    if (this.prisma.isConnected) {
      // Create published scholarship
      const scholarship = await this.prisma.scholarship.create({
        data: {
          slug,
          name: submission.name,
          provider: submission.provider,
          country: submission.country,
          flag,
          level: submission.level,
          field: submission.field,
          funding: submission.funding,
          amount: submission.amount || 'Full tuition + stipend',
          deadline: submission.deadline,
          eligible_nationalities: ['all', submission.country],
          eligible_countries: ['all'],
          is_asean_friendly: isAsean,
          description:
            submission.description ||
            `Scholarship provided by ${submission.provider} in ${submission.country}. Apply via the official link below.`,
          short_description: submission.description?.slice(0, 160) || submission.name,
          benefits: ['Tuition coverage', 'Academic support'],
          requirements: ['Check official guidelines'],
          documents_required: ['Application form', 'Academic transcripts'],
          how_to_apply: [
            {
              step: 1,
              title: 'Review Guidelines',
              description: 'Check official website for detailed eligibility criteria.',
            },
            {
              step: 2,
              title: 'Submit Application',
              description: 'Apply directly through the official application portal.',
            },
          ],
          official_link: submission.official_link,
          source_url: submission.official_link,
          thumbnail:
            'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
          tags: [submission.country, submission.funding === 'full' ? 'Fully Funded' : 'Partial'],
          status: 'PUBLISHED',
          is_featured: false,
        },
      });

      // Update submission status to APPROVED
      await this.prisma.submission.update({
        where: { id },
        data: { status: 'APPROVED', review_notes: 'Approved and published to live directory.' },
      });

      return {
        success: true,
        message: 'Submission approved and published successfully!',
        scholarship,
      };
    }

    // Memory fallback update
    submission.status = 'APPROVED';
    return {
      success: true,
      message: 'Submission approved (memory mode)',
      slug,
    };
  }

  /**
   * Admin: Reject submission
   */
  async rejectSubmission(id: string, notes?: string) {
    if (this.prisma.isConnected) {
      await this.prisma.submission.update({
        where: { id },
        data: {
          status: 'REJECTED',
          review_notes: notes || 'Submission did not meet publication standards.',
        },
      });
      return { success: true, message: 'Submission rejected.' };
    }

    const item = this.memorySubmissions.find((s) => s.id === id);
    if (!item) throw new NotFoundException(`Submission with id ${id} not found.`);
    item.status = 'REJECTED';
    item.review_notes = notes;
    return { success: true, message: 'Submission rejected.' };
  }
}
