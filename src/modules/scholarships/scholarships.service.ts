import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GetScholarshipsQueryDto } from './dto/get-scholarships-query.dto';
import {
  ScholarshipCard,
  ScholarshipDetail,
  ScholarshipListResponse,
  RelatedScholarship,
} from '../../common/interfaces/scholarship.types';
import { MOCK_SCHOLARSHIPS, ScholarshipRecord } from '../../common/data/mock-scholarships.data';
import { isAseanCountry } from '../../common/constants/asean.constants';

@Injectable()
export class ScholarshipsService {
  private readonly logger = new Logger(ScholarshipsService.name);
  private memoryScholarships: ScholarshipRecord[] = JSON.parse(JSON.stringify(MOCK_SCHOLARSHIPS));

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Return 6 featured scholarships for the homepage hero/featured section
   */
  async findFeatured(): Promise<{ data: ScholarshipCard[] }> {
    if (this.prisma.isConnected) {
      try {
        const results = await this.prisma.scholarship.findMany({
          where: {
            status: 'PUBLISHED',
            is_featured: true,
          },
          take: 6,
          orderBy: { view_count: 'desc' },
        });

        if (results.length > 0) {
          return { data: results.map((item) => this.mapToCard(item)) };
        }
      } catch (err) {
        this.logger.warn(`Prisma featured fetch failed, falling back to memory: ${err.message}`);
      }
    }

    // Fallback: mock memory
    const featured = this.memoryScholarships
      .filter((s) => s.status === 'PUBLISHED' && s.is_featured)
      .slice(0, 6);

    return { data: featured.map((item) => this.mapToCard(item)) };
  }

  /**
   * Search and filter scholarships with pagination
   */
  async findAll(query: GetScholarshipsQueryDto): Promise<ScholarshipListResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    if (this.prisma.isConnected) {
      try {
        const where: any = { status: 'PUBLISHED' };

        // Text search
        if (query.q && query.q.trim()) {
          const qLower = query.q.trim().toLowerCase();
          where.OR = [
            { name: { contains: qLower, mode: 'insensitive' } },
            { provider: { contains: qLower, mode: 'insensitive' } },
            { country: { contains: qLower, mode: 'insensitive' } },
            { description: { contains: qLower, mode: 'insensitive' } },
          ];
        }

        // Country filter
        if (query.country && query.country.trim()) {
          where.country = { equals: query.country.trim(), mode: 'insensitive' };
        }

        // Degree Level filter
        if (query.level && query.level.trim()) {
          where.level = { has: query.level.trim().toLowerCase() };
        }

        // Field filter
        if (query.field && query.field.trim()) {
          where.field = { has: query.field.trim().toLowerCase() };
        }

        // Funding filter
        if (query.funded) {
          where.funding = query.funded;
        }

        // ASEAN friendly filter
        if (query.asean) {
          where.is_asean_friendly = true;
        }

        // Eligible nationality filter
        if (query.eligible && query.eligible.trim()) {
          const eligibleNation = query.eligible.trim();
          where.OR = [
            ...(where.OR || []),
            { eligible_nationalities: { has: eligibleNation } },
            { eligible_nationalities: { has: 'all' } },
          ];
        }

        // Sorting
        let orderBy: any = { created_at: 'desc' };
        if (query.sort === 'deadline') {
          orderBy = { deadline: 'asc' };
        } else if (query.sort === 'popular') {
          orderBy = { view_count: 'desc' };
        }

        const [total, records] = await Promise.all([
          this.prisma.scholarship.count({ where }),
          this.prisma.scholarship.findMany({
            where,
            skip,
            take: limit,
            orderBy,
          }),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          data: records.map((r) => this.mapToCard(r)),
          pagination: {
            total,
            page,
            limit,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        };
      } catch (err) {
        this.logger.warn(`Prisma findAll failed, falling back to memory: ${err.message}`);
      }
    }

    // Memory Store Fallback
    let filtered = this.memoryScholarships.filter((s) => s.status === 'PUBLISHED');

    if (query.q && query.q.trim()) {
      const q = query.q.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.provider.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (query.country && query.country.trim()) {
      const c = query.country.toLowerCase().trim();
      filtered = filtered.filter((s) => s.country.toLowerCase() === c);
    }

    if (query.level && query.level.trim()) {
      const lvl = query.level.toLowerCase().trim();
      filtered = filtered.filter((s) => s.level.some((l) => l.toLowerCase() === lvl));
    }

    if (query.field && query.field.trim()) {
      const fld = query.field.toLowerCase().trim();
      filtered = filtered.filter(
        (s) => s.field.includes('any') || s.field.some((f) => f.toLowerCase().includes(fld)),
      );
    }

    if (query.funded) {
      filtered = filtered.filter((s) => s.funding === query.funded);
    }

    if (query.asean) {
      filtered = filtered.filter(
        (s) =>
          s.is_asean_friendly ||
          s.eligible_nationalities.some((n) => isAseanCountry(n) || n.toLowerCase() === 'all'),
      );
    }

    if (query.eligible && query.eligible.trim()) {
      const e = query.eligible.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.eligible_nationalities.some((n) => n.toLowerCase() === e || n.toLowerCase() === 'all'),
      );
    }

    // Sort
    if (query.sort === 'deadline') {
      filtered.sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      );
    } else if (query.sort === 'popular') {
      filtered.sort((a, b) => b.view_count - a.view_count);
    } else {
      filtered.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paged = filtered.slice(skip, skip + limit);

    return {
      data: paged.map((r) => this.mapToCard(r)),
      pagination: {
        total,
        page,
        limit,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Find a scholarship by ID or slug, increment view_count, and return detail with related scholarships
   */
  async findByIdOrSlug(idOrSlug: string): Promise<ScholarshipDetail> {
    if (this.prisma.isConnected) {
      try {
        const item = await this.prisma.scholarship.findFirst({
          where: {
            OR: [{ slug: idOrSlug }, { id: idOrSlug }],
          },
        });

        if (item) {
          // Increment view count asynchronously
          this.prisma.scholarship
            .update({
              where: { id: item.id },
              data: { view_count: { increment: 1 } },
            })
            .catch((e) => this.logger.error(`Error incrementing view count: ${e.message}`));

          // Get related scholarships (same country or level or featured, excluding current)
          const relatedRaw = await this.prisma.scholarship.findMany({
            where: {
              id: { not: item.id },
              status: 'PUBLISHED',
              OR: [
                { country: item.country },
                { is_featured: true },
              ],
            },
            take: 3,
            orderBy: { view_count: 'desc' },
          });

          const related: RelatedScholarship[] = relatedRaw.map((r) => ({
            id: r.slug || r.id,
            name: r.name,
            country: r.country,
            flag: r.flag,
            funding: r.funding as any,
            deadline: r.deadline.toISOString(),
          }));

          return this.mapToDetail(item, related);
        }
      } catch (err) {
        this.logger.warn(`Prisma findByIdOrSlug failed, falling back to memory: ${err.message}`);
      }
    }

    // Memory fallback
    const found = this.memoryScholarships.find(
      (s) => s.slug === idOrSlug || s.id === idOrSlug,
    );

    if (!found) {
      throw new NotFoundException(`Scholarship with identifier "${idOrSlug}" was not found.`);
    }

    found.view_count += 1;

    const related: RelatedScholarship[] = this.memoryScholarships
      .filter((s) => s.id !== found.id && s.status === 'PUBLISHED')
      .slice(0, 2)
      .map((r) => ({
        id: r.slug || r.id,
        name: r.name,
        country: r.country,
        flag: r.flag,
        funding: r.funding,
        deadline: r.deadline,
      }));

    return this.mapToDetail(found, related);
  }

  // --- Helper mappers ---

  private mapToCard(raw: any): ScholarshipCard {
    const deadlineStr =
      raw.deadline instanceof Date ? raw.deadline.toISOString() : String(raw.deadline);

    return {
      id: raw.slug || raw.id,
      name: raw.name,
      slug: raw.slug,
      provider: raw.provider,
      country: raw.country,
      flag: raw.flag,
      level: Array.isArray(raw.level) ? raw.level : [],
      field: Array.isArray(raw.field) ? raw.field : [],
      funding: raw.funding,
      amount: raw.amount,
      deadline: deadlineStr,
      eligible_nationalities: Array.isArray(raw.eligible_nationalities)
        ? raw.eligible_nationalities
        : [],
      thumbnail: raw.thumbnail || '',
      short_description: raw.short_description || '',
      is_featured: Boolean(raw.is_featured),
      is_asean_friendly: Boolean(raw.is_asean_friendly),
      tags: Array.isArray(raw.tags) ? raw.tags : [],
    };
  }

  private mapToDetail(raw: any, related: RelatedScholarship[]): ScholarshipDetail {
    const card = this.mapToCard(raw);

    const parseJsonArray = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    return {
      ...card,
      logo: raw.logo,
      duration: raw.duration,
      start_date: raw.start_date,
      eligible_countries: Array.isArray(raw.eligible_countries)
        ? raw.eligible_countries
        : ['all'],
      description: raw.description,
      benefits: parseJsonArray(raw.benefits),
      requirements: parseJsonArray(raw.requirements),
      documents_required: parseJsonArray(raw.documents_required),
      how_to_apply: parseJsonArray(raw.how_to_apply),
      official_link: raw.official_link,
      source_url: raw.source_url,
      related_scholarships: related,
      view_count: raw.view_count || 0,
      created_at:
        raw.created_at instanceof Date ? raw.created_at.toISOString() : String(raw.created_at),
      updated_at:
        raw.updated_at instanceof Date ? raw.updated_at.toISOString() : String(raw.updated_at),
    };
  }
}
