import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AutocompleteResponse, AutocompleteItem } from '../../common/interfaces/scholarship.types';
import { MOCK_SCHOLARSHIPS } from '../../common/data/mock-scholarships.data';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async autocomplete(query: string): Promise<AutocompleteResponse> {
    const trimmed = (query || '').trim();
    if (trimmed.length < 2) {
      return { results: [] };
    }

    if (this.prisma.isConnected) {
      try {
        const matches = await this.prisma.scholarship.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { name: { contains: trimmed, mode: 'insensitive' } },
              { country: { contains: trimmed, mode: 'insensitive' } },
              { provider: { contains: trimmed, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            slug: true,
            name: true,
            country: true,
            flag: true,
            funding: true,
          },
          take: 5,
          orderBy: { view_count: 'desc' },
        });

        return {
          results: matches.map((m) => ({
            id: m.slug || m.id,
            name: m.name,
            country: m.country,
            flag: m.flag,
            funding: m.funding as any,
          })),
        };
      } catch (err) {
        this.logger.warn(`Prisma autocomplete search failed: ${err.message}`);
      }
    }

    // Memory fallback
    const qLower = trimmed.toLowerCase();
    const results: AutocompleteItem[] = MOCK_SCHOLARSHIPS
      .filter((s) => s.status === 'PUBLISHED')
      .filter(
        (s) =>
          s.name.toLowerCase().includes(qLower) ||
          s.country.toLowerCase().includes(qLower) ||
          s.provider.toLowerCase().includes(qLower),
      )
      .slice(0, 5)
      .map((s) => ({
        id: s.slug || s.id,
        name: s.name,
        country: s.country,
        flag: s.flag,
        funding: s.funding,
      }));

    return { results };
  }
}
