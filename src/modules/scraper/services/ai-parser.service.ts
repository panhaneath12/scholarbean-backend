import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCountryFlag, isAseanCountry, ASEAN_COUNTRIES } from '../../../common/constants/asean.constants';

export interface ExtractedScholarshipData {
  name: string;
  provider: string;
  country: string;
  flag: string;
  level: string[];
  field: string[];
  funding: 'full' | 'partial';
  amount: string;
  duration?: string;
  deadline: string; // ISO 8601 string
  start_date?: string;
  eligible_nationalities: string[];
  eligible_countries: string[];
  is_asean_friendly: boolean;
  short_description: string;
  description: string;
  benefits: string[];
  requirements: string[];
  documents_required: string[];
  how_to_apply: { step: number; title: string; description: string }[];
  tags: string[];
  official_link: string;
  thumbnail?: string;
}

@Injectable()
export class AiParserService {
  private readonly logger = new Logger(AiParserService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.logger.log(' Google Gemini API client initialized for automated scholarship extraction');
      } catch (err) {
        this.logger.warn(`Failed to initialize Gemini AI: ${err.message}`);
      }
    } else {
      this.logger.log('ℹ️ GEMINI_API_KEY not configured. Rule-based heuristic extraction parser will be used.');
    }
  }

  /**
   * Parse raw crawled text/HTML into a structured scholarship schema
   */
  async parseRawContent(
    rawText: string,
    sourceUrl: string,
    defaultCountry?: string,
  ): Promise<ExtractedScholarshipData> {
    if (this.genAI) {
      try {
        const parsed = await this.extractWithGemini(rawText, sourceUrl);
        if (parsed) return parsed;
      } catch (err) {
        this.logger.error(`Gemini AI extraction error: ${err.message}. Falling back to heuristic parser.`);
      }
    }

    return this.extractWithHeuristics(rawText, sourceUrl, defaultCountry);
  }

  /**
   * AI Extraction using Gemini
   */
  private async extractWithGemini(
    rawText: string,
    sourceUrl: string,
  ): Promise<ExtractedScholarshipData | null> {
    if (!this.genAI) return null;

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert AI parser for ScholarBean, a global scholarship directory.
Extract and normalize the following scholarship text into a strict JSON object.

Content:
"""
${rawText.slice(0, 6000)}
"""
Source URL: ${sourceUrl}

Return ONLY a valid JSON object with EXACTLY the following structure (no markdown fences, no explanation):
{
  "name": "Full Official Scholarship Title",
  "provider": "Host University or Organization Name",
  "country": "Host Country name",
  "level": ["undergraduate" | "masters" | "phd"],
  "field": ["stem", "humanities", "any", etc],
  "funding": "full" or "partial",
  "amount": "Concise summary of coverage and monthly stipend",
  "duration": "e.g. 1-2 years or 4 years",
  "deadline": "ISO 8601 formatted date string like 2026-11-30T23:59:00Z (estimate if needed)",
  "start_date": "e.g. September 2027",
  "eligible_nationalities": ["list of eligible nationalities or countries, include 'all' if global"],
  "is_asean_friendly": true or false (true if citizens of ASEAN countries like Cambodia, Thailand, Vietnam, Indonesia, etc are eligible),
  "short_description": "1-2 sentence hook for scholarship card",
  "description": "Comprehensive markdown description with headings",
  "benefits": ["Array of bullet points of benefits"],
  "requirements": ["Array of bullet points of criteria"],
  "documents_required": ["Array of required documents"],
  "how_to_apply": [
    { "step": 1, "title": "Step title", "description": "Step detail" }
  ],
  "tags": ["Array of 3-5 tags like country, field, or funding type"],
  "official_link": "Official application URL if found, otherwise use source URL"
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean JSON markdown blocks if returned
    const jsonStr = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const data = JSON.parse(jsonStr);

    const country = data.country || 'Global';
    const flag = getCountryFlag(country);

    return {
      name: data.name || 'International Scholarship Program',
      provider: data.provider || 'Scholarship Foundation',
      country,
      flag,
      level: Array.isArray(data.level) && data.level.length > 0 ? data.level : ['masters'],
      field: Array.isArray(data.field) && data.field.length > 0 ? data.field : ['any'],
      funding: data.funding === 'partial' ? 'partial' : 'full',
      amount: data.amount || 'Tuition coverage + stipend',
      duration: data.duration || '1-2 years',
      deadline: data.deadline || new Date(Date.now() + 90 * 86400000).toISOString(),
      start_date: data.start_date || 'Academic Year 2026/2027',
      eligible_nationalities: Array.isArray(data.eligible_nationalities) ? data.eligible_nationalities : ['all'],
      eligible_countries: Array.isArray(data.eligible_countries) ? data.eligible_countries : ['all'],
      is_asean_friendly: Boolean(data.is_asean_friendly),
      short_description: data.short_description || `${data.name} for international students in ${country}.`,
      description: data.description || `Comprehensive scholarship program offered in ${country}.`,
      benefits: Array.isArray(data.benefits) ? data.benefits : ['Tuition waiver', 'Living allowance'],
      requirements: Array.isArray(data.requirements) ? data.requirements : ['Academic transcript', 'Good standing'],
      documents_required: Array.isArray(data.documents_required) ? data.documents_required : ['Application form', 'Passport'],
      how_to_apply: Array.isArray(data.how_to_apply) ? data.how_to_apply : [
        { step: 1, title: 'Review Guidelines', description: 'Review criteria on the official website.' },
        { step: 2, title: 'Submit Application', description: 'Complete online application before the deadline.' }
      ],
      tags: Array.isArray(data.tags) ? data.tags : [country, 'Fully Funded'],
      official_link: data.official_link || sourceUrl,
      thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
    };
  }

  /**
   * Rule-based heuristic extraction fallback (runs when AI is offline or key missing)
   */
  private extractWithHeuristics(
    rawText: string,
    sourceUrl: string,
    defaultCountry?: string,
  ): ExtractedScholarshipData {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const title = lines[0] || 'International Academic Scholarship 2026';
    const textLower = rawText.toLowerCase();

    // Determine country
    let country = defaultCountry || 'Global';
    if (!defaultCountry) {
      if (textLower.includes('japan') || textLower.includes('mext')) country = 'Japan';
      else if (textLower.includes('united kingdom') || textLower.includes('uk') || textLower.includes('chevening')) country = 'United Kingdom';
      else if (textLower.includes('united states') || textLower.includes('usa') || textLower.includes('fulbright')) country = 'USA';
      else if (textLower.includes('germany') || textLower.includes('daad')) country = 'Germany';
      else if (textLower.includes('singapore')) country = 'Singapore';
      else if (textLower.includes('australia')) country = 'Australia';
      else if (textLower.includes('korea')) country = 'South Korea';
    }

    const flag = getCountryFlag(country);

    // Determine level
    const level: string[] = [];
    if (textLower.includes('undergraduate') || textLower.includes('bachelor')) level.push('undergraduate');
    if (textLower.includes('master') || textLower.includes('postgraduate')) level.push('masters');
    if (textLower.includes('phd') || textLower.includes('doctoral')) level.push('phd');
    if (level.length === 0) level.push('masters');

    // Funding
    const isFull = textLower.includes('full') || textLower.includes('fully funded') || textLower.includes('stipend');
    const funding: 'full' | 'partial' = isFull ? 'full' : 'partial';

    // ASEAN check
    const hasAsean = ASEAN_COUNTRIES.some((c) => textLower.includes(c.toLowerCase())) ||
      textLower.includes('asean') || textLower.includes('all nationalit') || textLower.includes('international');

    // Deadline heuristic (3 months from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);

    return {
      name: title,
      provider: 'Host University / Government',
      country,
      flag,
      level,
      field: ['any', 'stem'],
      funding,
      amount: isFull ? 'Full tuition coverage + monthly living stipend' : 'Partial tuition reduction',
      duration: '1 to 3 years',
      deadline: futureDate.toISOString(),
      start_date: 'Academic Year 2026/2027',
      eligible_nationalities: ['all', ...ASEAN_COUNTRIES],
      eligible_countries: ['all'],
      is_asean_friendly: hasAsean,
      short_description: `${title} offered in ${country} with ${funding === 'full' ? 'full' : 'partial'} financial coverage.`,
      description: `### Overview\n${rawText.slice(0, 1000)}\n\n### Application Notice\nReview requirements thoroughly on the official website.`,
      benefits: [
        'Tuition fee coverage',
        'Academic resources and mentorship',
        ...(isFull ? ['Monthly living allowance', 'Return travel subsidy'] : []),
      ],
      requirements: [
        'Recognized academic transcripts and qualifications',
        'Demonstrated commitment to the field of study',
        'Adequate language proficiency (English or host country language)',
      ],
      documents_required: [
        'Online application form',
        'Certified academic transcripts',
        'Curriculum Vitae (CV)',
        'Recommendation letters',
      ],
      how_to_apply: [
        {
          step: 1,
          title: 'Verify Eligibility',
          description: 'Ensure nationality and academic criteria match the scholarship requirements.',
        },
        {
          step: 2,
          title: 'Prepare Documentation',
          description: 'Obtain certified transcripts and letters of recommendation.',
        },
        {
          step: 3,
          title: 'Submit Online',
          description: 'Complete the submission on the official portal before the closing deadline.',
        },
      ],
      tags: [country, funding === 'full' ? 'Fully Funded' : 'Partial', ...level],
      official_link: sourceUrl,
      thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
    };
  }
}
