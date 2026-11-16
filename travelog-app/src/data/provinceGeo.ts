export interface ProvinceCity {
  n: string;
  label: string;
  a: string;
  x: number;
  y: number;
  d: string;
}

export interface ProvinceGeo {
  adcode: string;
  name: string;
  w: number;
  h: number;
  cities: ProvinceCity[];
}

const cache = new Map<string, ProvinceGeo>();

/**
 * Prefecture-level maps are generated ahead of time (one JSON per province)
 * and loaded on demand, so the initial bundle stays small and the app works
 * offline inside the Capacitor shell once a province has been opened.
 */
export async function loadProvinceGeo(adcode: string | number): Promise<ProvinceGeo> {
  const key = String(adcode).padStart(6, '0');
  const hit = cache.get(key);
  if (hit) return hit;

  const res = await fetch(`${import.meta.env.BASE_URL}geo/provinces/${key}.json`);
  if (!res.ok) throw new Error(`province geo ${key} not found`);
  const geo = (await res.json()) as ProvinceGeo;
  cache.set(key, geo);
  return geo;
}
