import type { ProvinceCity, ProvinceGeo } from '../data/provinceGeo';
import { matchProvinceCity } from '../lib/cityMatch';
import type { CityRecord } from '../types';

interface Props {
  geo: ProvinceGeo;
  cities: Record<string, CityRecord>;
  selected: ProvinceCity | null;
  onSelect: (city: ProvinceCity) => void;
}

/** Province drill-down: prefecture-level cities only, no county/district layer. */
export function ProvinceMap({ geo, cities, selected, onSelect }: Props) {
  return (
    <svg
      className="province-map"
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${geo.name}地级市地图`}
    >
      <defs>
        <linearGradient id="provLit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C6DCCD" />
          <stop offset="100%" stopColor="#9FC7B2" />
        </linearGradient>
        <linearGradient id="provDeep" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#AFCEBB" />
          <stop offset="100%" stopColor="#83B59D" />
        </linearGradient>
      </defs>

      {geo.cities.map((city) => {
        const record = matchProvinceCity(cities, city);
        const lit = !!record?.lit;
        const deep = !!record?.deep;
        return (
          <g
            key={city.a || city.n}
            className={`pc-group${lit ? ' lit' : ''}${deep ? ' deep' : ''}${selected?.a === city.a ? ' sel' : ''}`}
            onClick={() => onSelect(city)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(city);
              }
            }}
          >
            <path className="pc-shape" d={city.d}>
              <title>{city.n}</title>
            </path>
            <text className="pc-label" x={city.x} y={city.y} textAnchor="middle">
              {city.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
