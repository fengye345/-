import { describe, expect, it } from 'vitest';
import { canonicalCityKey, matchProvinceCity } from './cityMatch';
import type { ProvinceCity } from '../data/provinceGeo';
import type { CityRecord } from '../types';

const cities: Record<string, CityRecord> = {
  杭州: { province: '浙江省', first: '2023-04-06', visits: 4, days: 11, lit: true, deep: true },
  大理: { province: '云南省', first: '2024-08-02', visits: 2, days: 6, lit: true },
  北京: { province: '北京市', first: '2024-02-11', visits: 1, days: 2, lit: true },
};

const pc = (n: string, label: string, a: string): ProvinceCity => ({ n, label, a, x: 0, y: 0, d: '' });

describe('province city matching', () => {
  it('matches full prefecture names to short store keys', () => {
    expect(matchProvinceCity(cities, pc('杭州市', '杭州', '330100'))).toBe(cities['杭州']);
    expect(canonicalCityKey(cities, pc('杭州市', '杭州', '330100'))).toBe('杭州');
  });

  it('matches autonomous prefectures by prefix', () => {
    expect(matchProvinceCity(cities, pc('大理白族自治州', '大理州', '532900'))).toBe(cities['大理']);
  });

  it('matches by adcode when available', () => {
    const withAdcode = { ...cities, 北京: { ...cities['北京'], adcode: '110100' } };
    expect(matchProvinceCity(withAdcode, pc('北京市', '北京', '110100'))).toBe(withAdcode['北京']);
  });

  it('returns undefined for an unvisited prefecture', () => {
    expect(matchProvinceCity(cities, pc('湖州市', '湖州', '330500'))).toBeUndefined();
    expect(canonicalCityKey(cities, pc('湖州市', '湖州', '330500'))).toBe('湖州');
  });
});
