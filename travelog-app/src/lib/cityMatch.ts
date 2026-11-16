import type { ProvinceCity } from '../data/provinceGeo';
import type { CityRecord } from '../types';

/**
 * Province datasets use full names (杭州市 / 大理白族自治州) while the store is
 * keyed by the short display name (杭州 / 大理). Match adcode first, then name,
 * then the label/prefix, so a lit city is coloured correctly in the drill-down.
 */
export function matchProvinceCity(
  cities: Record<string, CityRecord>,
  city: ProvinceCity,
): CityRecord | undefined {
  const byAdcode = Object.values(cities).find((r) => r.adcode && r.adcode === city.a);
  if (byAdcode) return byAdcode;

  const direct = cities[city.n] ?? cities[city.label];
  if (direct) return direct;

  const base = city.n.replace(/(市|地区|盟|特别行政区|自治州)$/, '');
  if (cities[base]) return cities[base];

  for (const key of Object.keys(cities)) {
    if (key.length < 2) continue;
    if (city.n.startsWith(key) || city.label.startsWith(key)) return cities[key];
  }
  return undefined;
}

/** Store keys use short names (杭州), while map data uses full names (杭州市). */
export function canonicalCityKey(
  cities: Record<string, CityRecord>,
  city: ProvinceCity,
): string {
  const match = matchProvinceCity(cities, city);
  if (match) {
    const key = Object.keys(cities).find((k) => cities[k] === match);
    if (key) return key;
  }
  return city.label;
}
