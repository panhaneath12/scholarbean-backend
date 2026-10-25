export type FundingType = 'full' | 'partial';
export type LevelType = 'undergraduate' | 'masters' | 'phd';

export interface ScholarshipCard {
  id: string;
  name: string;
  slug: string;
  provider: string;
  country: string;
  flag: string;
  level: LevelType[];
  field: string[];
  funding: FundingType;
  amount: string;
  deadline: string; // ISO 8601
  eligible_nationalities: string[];
  thumbnail: string;
  short_description: string;
  is_featured: boolean;
  is_asean_friendly: boolean;
  tags: string[];
}

export interface HowToApplyStep {
  step: number;
  title: string;
  description: string;
}

export interface RelatedScholarship {
  id: string;
  name: string;
  country: string;
  flag: string;
  funding: FundingType;
  deadline: string;
}

export interface ScholarshipDetail extends ScholarshipCard {
  logo?: string;
  duration?: string;
  start_date?: string;
  eligible_countries: string[];
  description: string; // Markdown text
  benefits: string[];
  requirements: string[];
  documents_required: string[];
  how_to_apply: HowToApplyStep[];
  official_link: string;
  source_url?: string;
  related_scholarships: RelatedScholarship[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ScholarshipListResponse {
  data: ScholarshipCard[];
  pagination: PaginationMeta;
}

export interface CategoryStat {
  name: string;
  count: number;
  icon: string;
}

export interface PopularCountryStat {
  name: string;
  flag: string;
  count: number;
}

export interface MetaResponse {
  total_scholarships: number;
  total_countries: number;
  categories: CategoryStat[];
  popular_countries: PopularCountryStat[];
}

export interface AutocompleteItem {
  id: string;
  name: string;
  country: string;
  flag: string;
  funding: FundingType;
}

export interface AutocompleteResponse {
  results: AutocompleteItem[];
}
