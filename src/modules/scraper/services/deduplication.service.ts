import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import slugify from 'slugify';

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalizes a URL by stripping tracking parameters, hashes, protocols, and trailing slashes
   */
  normalizeUrl(rawUrl: string): string {
    if (!rawUrl) return '';
    try {
      const parsed = new URL(rawUrl.trim());
      // Strip common tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'];
      trackingParams.forEach((param) => parsed.searchParams.delete(param));

      let clean = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
      if (clean.endsWith('/')) {
        clean = clean.slice(0, -1);
      }
      return clean;
    } catch {
      return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
    }
  }

  /**
   * Calculates similarity ratio (0 to 1) between two titles using token overlap (Dice/Jaccard coefficient)
   */
  calculateTitleSimilarity(str1: string, str2: string): number {
    const tokenize = (s: string) =>
      new Set(
        s
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter(Boolean),
      );

    const tokens1 = tokenize(str1);
    const tokens2 = tokenize(str2);

    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    const intersection = new Set([...tokens1].filter((t) => tokens2.has(t)));
    return (2 * intersection.size) / (tokens1.size + tokens2.size);
  }

  /**
   * Checks whether a scholarship is a duplicate based on normalized URL or high title similarity
   */
  async isDuplicate(
    officialUrl: string,
    title: string,
  ): Promise<{ isDuplicate: boolean; reason?: string; existingSlug?: string }> {
    const normalizedTargetUrl = this.normalizeUrl(officialUrl);
    const generatedSlug = slugify(title, { lower: true, strict: true });

    if (this.prisma.isConnected) {
      try {
        // 1. Direct slug match
        const bySlug = await this.prisma.scholarship.findUnique({
          where: { slug: generatedSlug },
        });
        if (bySlug) {
          return { isDuplicate: true, reason: 'Slug already exists in database', existingSlug: bySlug.slug };
        }

        // 2. Official URL or source URL match
        if (officialUrl) {
          const byUrl = await this.prisma.scholarship.findFirst({
            where: {
              OR: [
                { official_link: { contains: normalizedTargetUrl, mode: 'insensitive' } },
                { source_url: { contains: normalizedTargetUrl, mode: 'insensitive' } },
              ],
            },
          });
          if (byUrl) {
            return { isDuplicate: true, reason: 'URL already indexed in database', existingSlug: byUrl.slug };
          }
        }

        // 3. Title similarity check against recent published items
        const recentItems = await this.prisma.scholarship.findMany({
          select: { slug: true, name: true },
          take: 100,
          orderBy: { created_at: 'desc' },
        });

        for (const item of recentItems) {
          const similarity = this.calculateTitleSimilarity(title, item.name);
          if (similarity >= 0.85) {
            return {
              isDuplicate: true,
              reason: `High title similarity (${Math.round(similarity * 100)}%) with "${item.name}"`,
              existingSlug: item.slug,
            };
          }
        }
      } catch (err) {
        this.logger.warn(`Prisma duplicate check error: ${err.message}`);
      }
    }

    return { isDuplicate: false };
  }
}
