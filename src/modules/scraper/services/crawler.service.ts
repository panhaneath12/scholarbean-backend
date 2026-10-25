import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CrawledItem {
  title: string;
  sourceUrl: string;
  rawText: string;
}

export const ACTIVE_RSS_FEEDS = [
  {
    name: 'Opportunity Desk - Scholarships',
    url: 'https://opportunitydesk.org/category/scholarships/feed/',
  },
  {
    name: 'Scholars4Dev - Developing Countries',
    url: 'https://www.scholars4dev.com/feed/',
  },
];

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  /**
   * Fetches an HTML page and extracts clean text content
   */
  async fetchPageText(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ScholarBeanBot/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);

      // Strip script, style, nav, footer tags
      $('script, style, nav, footer, noscript, svg, header').remove();

      return $('body').text().replace(/\s+/g, ' ').trim();
    } catch (err) {
      this.logger.warn(`Failed to fetch page at ${url}: ${err.message}`);
      return null;
    }
  }

  /**
   * Fetches and parses an RSS feed to extract active scholarship listings
   */
  async fetchRssFeedItems(feedUrl: string, maxItems = 5): Promise<CrawledItem[]> {
    try {
      this.logger.log(`Fetching RSS feed from: ${feedUrl}`);
      const response = await axios.get(feedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ScholarBeanBot/1.0',
          Accept: 'application/rss+xml, application/xml, text/xml;q=0.9',
        },
        timeout: 12000,
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const items: CrawledItem[] = [];

      $('item').slice(0, maxItems).each((_, el) => {
        const title = $(el).find('title').text().trim();
        const link = $(el).find('link').text().trim() || $(el).find('guid').text().trim();
        const description = $(el).find('description').text().trim();
        const contentEncoded = $(el).find('content\\:encoded').text().trim();

        const rawText = [title, description, contentEncoded]
          .filter(Boolean)
          .join('\n\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (title && link) {
          items.push({
            title,
            sourceUrl: link,
            rawText: rawText.length > 200 ? rawText : `${title}\n${description}`,
          });
        }
      });

      this.logger.log(`Extracted ${items.length} items from RSS feed: ${feedUrl}`);
      return items;
    } catch (err) {
      this.logger.warn(`Failed to fetch or parse RSS feed ${feedUrl}: ${err.message}`);
      return [];
    }
  }

  /**
   * Pulls fresh scholarship items across all configured live RSS feeds,
   * falling back to curated seed crawl items if offline or rate-limited.
   */
  async fetchAllActiveFeeds(maxPerFeed = 4): Promise<CrawledItem[]> {
    const combinedItems: CrawledItem[] = [];

    for (const feed of ACTIVE_RSS_FEEDS) {
      try {
        const feedItems = await this.fetchRssFeedItems(feed.url, maxPerFeed);
        combinedItems.push(...feedItems);
      } catch (err) {
        this.logger.warn(`Error pulling feed ${feed.name}: ${err.message}`);
      }
    }

    if (combinedItems.length > 0) {
      this.logger.log(`Total live items fetched from feeds: ${combinedItems.length}`);
      return combinedItems;
    }

    this.logger.log('No live items from RSS feeds; falling back to curated seed items.');
    return this.getCuratedSeedCrawlItems();
  }

  /**
   * Generates sample simulated crawl items from curated global sources
   */
  getCuratedSeedCrawlItems(): CrawledItem[] {
    return [
      {
        title: 'New Zealand Manaaki Scholarships 2026',
        sourceUrl: 'https://www.nzscholarships.govt.nz',
        rawText: `New Zealand Manaaki Scholarships 2026.
Offered by the New Zealand Government Ministry of Foreign Affairs and Trade (MFAT).
Eligible for citizens of Southeast Asia: Cambodia, Indonesia, Laos, Malaysia, Myanmar, Philippines, Thailand, Timor-Leste, Viet Nam.
Degree Level: Postgraduate certificate, Postgraduate diploma, Master's Degree (1-2 years), PhD (up to 3.5 years).
Coverage: Full tuition fees, living allowance of NZD $531 per week, an establishment allowance of NZD $3,000, medical insurance, travel tickets.
Applications open February 1 and close around March 31, 2026.
Fields: Climate Change and the Environment, Disaster Risk Management, Food Security and Agriculture, Renewable Energy, Good Governance.`,
      },
      {
        title: 'Swedish Institute SI Scholarship for Global Professionals 2026',
        sourceUrl: 'https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/',
        rawText: `Swedish Institute Scholarships for Global Professionals (SISGP) 2026.
Funded by the Swedish Ministry for Foreign Affairs.
Level: Master's degree (1 or 2 years) in Sweden.
Funding: Fully funded. Covers tuition fees directly paid to the Swedish university, living expenses of SEK 12,000 per month, travel grant of SEK 15,000, insurance.
Eligibility: Professionals from selected countries with minimum 3,000 hours of demonstrated leadership and work experience.
Applications open in February with deadline mid-February. Studies start autumn semester.`,
      },
      {
        title: 'Swiss Government Excellence Scholarships for Foreign Scholars 2026',
        sourceUrl: 'https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants/swiss-government-excellence-scholarships.html',
        rawText: `Swiss Government Excellence Scholarships for Foreign Scholars and Artists 2026-2027.
Federal Commission for Scholarships for Foreign Students (FCS).
Level: PhD, Postdoctoral research, Research fellowships at Swiss public universities, federal institutes of technology (ETH, EPFL).
Funding: Fully funded monthly stipend (CHF 1,920 for PhD), health insurance, housing allowance, flight allowance.
Eligible: Postgraduate researchers from over 180 countries including ASEAN countries.
Deadline depends on Swiss Embassy in each respective country (typically September - November).`,
      },
    ];
  }
}
