import { describe, expect, it } from 'vitest';
import { adcodeForCity, reviewsForCity, spotsForCity } from './scenic';

describe('scenic recommendations', () => {
  it('returns curated Hangzhou spots first', () => {
    const spots = spotsForCity('330100', '杭州', '浙江省');
    expect(spots).toHaveLength(6);
    expect(spots[0].name).toBe('西湖');
    expect(spots[0].city).toBe('杭州');
  });

  it('falls back to four generated spots for an uncurated city', () => {
    const spots = spotsForCity('440600', '佛山', '广东省');
    expect(spots).toHaveLength(4);
    expect(spots.map((s) => s.name)).toContain('佛山老城');
    expect(spots.every((s) => s.adcode === '440600')).toBe(true);
  });

  it('produces both recommend and avoid reviews', () => {
    const reviews = reviewsForCity('330100', '杭州', '浙江省');
    expect(reviews.some((r) => r.kind === 'RECOMMEND')).toBe(true);
    expect(reviews.some((r) => r.kind === 'AVOID')).toBe(true);
    expect(reviews.every((r) => r.city === '杭州')).toBe(true);
  });

  it('maps display city names to adcodes', () => {
    expect(adcodeForCity('杭州')).toBe('330100');
    expect(adcodeForCity('大理')).toBe('532900');
    expect(adcodeForCity('未知城市')).toBe('000000');
  });
});
