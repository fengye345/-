import { describe, expect, it } from 'vitest';
import { searchCities } from './citySearch';
import { CITY_INDEX } from '../data/seed';
import type { CityRecord } from '../types';

const cities: Record<string, CityRecord> = {
  杭州: { province: '浙江省', first: '2023-04-06', visits: 4, days: 11, lit: true, deep: true },
  大理: { province: '云南省', first: '2024-08-02', visits: 2, days: 6, lit: true },
};

describe('city search', () => {
  it('matches pinyin prefix without noisy substrings', () => {
    const names = searchCities('da', cities, '杭州').map((r) => r.city.n);
    expect(names).toEqual(['大理', '大连']);
    expect(names).not.toContain('青岛');
    expect(names).not.toContain('秦皇岛');
  });

  it('matches Chinese province and returns all cities in it', () => {
    const names = searchCities('云南', cities, '杭州').map((r) => r.city.n);
    expect(names).toContain('大理');
    expect(names).toContain('丽江');
    expect(names.length).toBe(5);
  });

  it('ranks the exact name first', () => {
    const first = searchCities('杭州', cities, '杭州')[0];
    expect(first.city.n).toBe('杭州');
    expect(first.lit).toBe(true);
    expect(first.current).toBe(true);
  });

  it('returns nothing for unknown input', () => {
    expect(searchCities('zzzz', cities, '杭州')).toHaveLength(0);
  });

  it('has 64 indexed cities', () => {
    expect(CITY_INDEX).toHaveLength(64);
  });
});
