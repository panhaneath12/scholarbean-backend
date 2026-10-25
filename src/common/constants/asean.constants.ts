export const ASEAN_COUNTRIES = [
  'Cambodia',
  'Indonesia',
  'Laos',
  'Malaysia',
  'Myanmar',
  'Philippines',
  'Singapore',
  'Thailand',
  'Vietnam',
  'Brunei',
  'Timor-Leste',
];

export const COUNTRY_FLAGS: Record<string, string> = {
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Japan': '🇯🇵',
  'Germany': '🇩🇪',
  'South Korea': '🇰🇷',
  'Korea': '🇰🇷',
  'Australia': '🇦🇺',
  'Canada': '🇨🇦',
  'France': '🇫🇷',
  'Singapore': '🇸🇬',
  'New Zealand': '🇳🇿',
  'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭',
  'China': '🇨🇳',
  'Taiwan': '🇹🇼',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Cambodia': '🇰🇭',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'Philippines': '🇵🇭',
  'Laos': '🇱🇦',
  'Myanmar': '🇲🇲',
  'Brunei': '🇧🇳',
  'Timor-Leste': '🇹🇱',
  'Ireland': '🇮🇪',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Norway': '🇳🇴',
  'Finland': '🇫🇮',
  'Denmark': '🇩🇰',
  'Belgium': '🇧🇪',
  'Austria': '🇦🇹',
  'Hungary': '🇭🇺',
  'Turkey': '🇹🇷',
  'Global': '🌐',
};

export function getCountryFlag(country: string): string {
  if (!country) return '🌐';
  if (COUNTRY_FLAGS[country]) return COUNTRY_FLAGS[country];
  
  // Search partial case-insensitive
  const entry = Object.entries(COUNTRY_FLAGS).find(
    ([key]) => key.toLowerCase() === country.toLowerCase(),
  );
  return entry ? entry[1] : '🌐';
}

export function isAseanCountry(country: string): boolean {
  if (!country) return false;
  return ASEAN_COUNTRIES.some(
    (c) => c.toLowerCase() === country.trim().toLowerCase(),
  );
}

export const DEFAULT_CATEGORIES = [
  { name: 'Fully Funded', icon: '🏆' },
  { name: 'ASEAN Eligible', icon: '🌏' },
  { name: 'STEM', icon: '🔬' },
  { name: 'Arts & Humanities', icon: '🎨' },
  { name: 'Undergraduate', icon: '📚' },
  { name: 'Masters', icon: '🎓' },
  { name: 'PhD', icon: '🔬' },
];

export const POPULAR_COUNTRIES_FALLBACK = [
  { name: 'Japan', flag: '🇯🇵', count: 34 },
  { name: 'USA', flag: '🇺🇸', count: 28 },
  { name: 'UK', flag: '🇬🇧', count: 22 },
  { name: 'Germany', flag: '🇩🇪', count: 19 },
  { name: 'South Korea', flag: '🇰🇷', count: 17 },
  { name: 'Australia', flag: '🇦🇺', count: 15 },
];
