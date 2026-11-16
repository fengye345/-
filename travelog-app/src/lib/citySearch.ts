import { CITY_INDEX } from '../data/seed';
import type { CityRecord, CityIndexItem } from '../types';

export interface CitySearchResult {
  city: CityIndexItem;
  lit: boolean;
  visits: number;
  days: number;
  current: boolean;
}

const normalize = (s: string) => s.toLowerCase().replace(/[\s'’·-]/g, '');

/**
 * City search: name substring, pinyin prefix, or province substring.
 * Prefix matches rank first, then lit cities, then hot cities.
 */
export function searchCities(
  query: string,
  cities: Record<string, CityRecord>,
  currentCity: string,
): CitySearchResult[] {
  const q = normalize(query.trim());
  if (!q) return [];

  const results = CITY_INDEX
    .filter((c) => normalize(c.n).includes(q) || c.py.startsWith(q) || normalize(c.p).includes(q))
    .map((city) => {
      const rec = cities[city.n];
      return {
        city,
        lit: !!rec?.lit,
        visits: rec?.visits ?? 0,
        days: rec?.days ?? 0,
        current: city.n === currentCity,
      };
    });

  return results.sort((a, b) => {
    const ap = normalize(a.city.n).startsWith(q) || a.city.py.startsWith(q) ? 0 : 1;
    const bp = normalize(b.city.n).startsWith(q) || b.city.py.startsWith(q) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    if (a.lit !== b.lit) return a.lit ? -1 : 1;
    return Number(b.city.hot) - Number(a.city.hot);
  });
}

export function hotCities(): CityIndexItem[] {
  return CITY_INDEX.filter((c) => c.hot);
}
