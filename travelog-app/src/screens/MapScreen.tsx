import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CHINA_GEO } from '../data/geo';
import { useAppStore, litCities, unreadCount } from '../store/appStore';
import { useUiStore } from '../store/uiStore';
import { api } from '../api';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Portal } from '../components/Portal';
import { ProvinceMap } from '../components/ProvinceMap';
import { loadProvinceGeo, type ProvinceCity, type ProvinceGeo } from '../data/provinceGeo';
import { canonicalCityKey, matchProvinceCity } from '../lib/cityMatch';
import { Avatar, Badge, Empty, Ring } from '../components/ui';
import { useToast } from '../components/Toast';
import { CITY_META } from '../data/seed';
import type { CityRecord } from '../types';

const LABEL_OFFSET: Record<string, [number, number, string?]> = {
  杭州: [-10, -8, 'end'], 上海: [10, 14], 北京: [9, -2], 成都: [-8, -7, 'end'],
  大理: [-7, 11, 'end'], 厦门: [8, 4], 苏州: [8, -3], 重庆: [-8, 3, 'end'],
};

function ChinaMap({ cities, currentCity, onProvince }: {
  cities: Record<string, CityRecord>;
  currentCity: string;
  onProvince: (adcode: number) => void;
}) {
  const litProvinces = useMemo(() => {
    const set = new Set<string>();
    Object.values(cities).forEach((c) => { if (c.lit && c.province) set.add(c.province); });
    return set;
  }, [cities]);

  const dots = CHINA_GEO.cities
    .filter((c) => cities[c.n]?.lit)
    .map((c) => {
      const meta = cities[c.n];
      const off = LABEL_OFFSET[c.n] ?? [7, 3];
      const anchor = off[2] as 'end' | 'start' | undefined;
      return (
        <g key={c.n} pointerEvents="none">
          {c.n === currentCity ? <circle className="city-halo" cx={c.x} cy={c.y} r={6} /> : null}
          <circle className={`city-dot${meta.deep ? ' deep' : ''}`} cx={c.x} cy={c.y} r={meta.deep ? 4.2 : 3.4} />
          <text
            className={`city-name${meta.deep ? ' deep' : ''}`}
            x={c.x + off[0]}
            y={c.y + off[1]}
            textAnchor={anchor}
          >
            {c.n}
          </text>
        </g>
      );
    });

  return (
    <svg
      className="china-map"
      viewBox={`0 0 ${CHINA_GEO.w} ${CHINA_GEO.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="中国城市点亮地图"
    >
      <defs>
        <linearGradient id="litGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BFD8C8" /><stop offset="100%" stopColor="#9CC4AF" />
        </linearGradient>
        <linearGradient id="deepGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A9CBB8" /><stop offset="100%" stopColor="#7FB198" />
        </linearGradient>
      </defs>
      {CHINA_GEO.provinces.map((p) => {
        const lit = litProvinces.has(p.n);
        const deep = lit && Object.entries(cities).some(([n, c]) => c.lit && c.province === p.n && c.deep);
        return (
          <path
            key={p.a}
            className={`prov clickable${lit ? ' lit' : ''}${deep ? ' deep' : ''}`}
            d={p.d}
            onClick={() => onProvince(p.a)}
            role="button"
            tabIndex={0}
            aria-label={`进入${p.n}地级市地图`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onProvince(p.a);
              }
            }}
          >
            <title>{p.n}</title>
          </path>
        );
      })}
      {dots}
      <g transform="translate(600,455)">
        <rect className="inset-frame" width="92" height="92" rx="7" />
        <path
          d="M20 24c10 14 8 26 16 38s16 12 22 22"
          fill="none"
          stroke="#B9B2A1"
          strokeWidth="1.2"
          strokeDasharray="3 5"
          strokeLinecap="round"
          opacity=".85"
        />
        {[[30, 22], [36, 42], [33, 62], [46, 70], [58, 54], [62, 78]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="#C6BFAE" />
        ))}
        <text className="inset-label" x="46" y="86" textAnchor="middle">南海诸岛</text>
      </g>
    </svg>
  );
}

const CITY_MAP = `<svg viewBox="0 0 360 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="杭州本城地图">
<rect width="360" height="400" fill="#F2EEE3"/>
<g fill="#E9E4D6" stroke="#E1DBCB" stroke-width=".5">
<rect x="18" y="20" width="54" height="38" rx="4"/><rect x="80" y="20" width="46" height="38" rx="4"/><rect x="146" y="18" width="58" height="40" rx="4"/><rect x="210" y="18" width="52" height="40" rx="4"/><rect x="272" y="20" width="70" height="38" rx="4"/>
<rect x="18" y="66" width="40" height="32" rx="4"/><rect x="64" y="64" width="44" height="34" rx="4"/><rect x="116" y="64" width="46" height="34" rx="4"/><rect x="212" y="64" width="52" height="34" rx="4"/><rect x="270" y="64" width="72" height="34" rx="4"/>
<rect x="16" y="108" width="34" height="30" rx="4"/><rect x="252" y="108" width="44" height="30" rx="4"/><rect x="300" y="108" width="44" height="30" rx="4"/>
<rect x="300" y="152" width="44" height="30" rx="4"/><rect x="298" y="194" width="46" height="32" rx="4"/><rect x="296" y="236" width="48" height="34" rx="4"/><rect x="296" y="278" width="46" height="32" rx="4"/>
<rect x="20" y="300" width="48" height="34" rx="4"/><rect x="76" y="300" width="52" height="36" rx="4"/><rect x="136" y="302" width="46" height="34" rx="4"/><rect x="190" y="300" width="54" height="34" rx="4"/><rect x="252" y="300" width="40" height="32" rx="4"/>
</g>
<path class="cm-park" d="M206 118c18-8 40-2 50 12s4 34-12 40-38-2-46-18 0-28 8-34Z"/>
<path class="cm-park" d="M30 330c22-14 54-10 66 8s2 38-20 44-58-4-62-22 6-24 16-30Z" opacity=".8"/>
<path class="cm-water" d="M44 122c22-14 58-12 76 4 14 12 12 32 0 44-14 14-38 10-52 22-12 10-30 8-38-4-10-14 0-30 6-40 5-9 3-20 8-26Z"/>
<path class="cm-water" d="M0 318c60-10 96 8 150 10s96-14 150-4 60 2 60 2v74H0Z" opacity=".9"/>
<g class="cm-road main"><path d="M-10 96c60 22 96-6 150 4s110 34 230 18"/><path d="M192 -10c-6 60 16 96 8 150s-22 96-8 270"/></g>
<g class="cm-road"><path d="M-10 176c70 6 110-12 160-4s100 24 220 10"/><path d="M-10 252c80-8 120 14 180 10s110-16 200-6"/><path d="M96 -10c10 60-8 100-2 150s18 100 10 270"/><path d="M268 -10c-8 70 6 110 0 170s-6 180 2 250"/></g>
<g class="cm-road sec" opacity=".85"><path d="M-10 60h380M-10 148h380M-10 214h380M-10 292h380M60 -10v420M148 -10v420M226 -10v420M320 -10v420"/></g>
<ellipse cx="120" cy="168" rx="66" ry="54" fill="none" stroke="#FBF8F0" stroke-width="4" opacity=".9"/>
<text class="cm-label" x="66" y="164">西 湖</text><text class="cm-label" x="238" y="350" fill="#8FA9AD">钱 塘 江</text>
<text class="cm-label" x="210" y="40">武林门</text><text class="cm-label" x="286" y="120">钱江新城</text>
<g class="cm-pin"><circle class="halo" cx="104" cy="92" r="12"/><circle class="core" cx="104" cy="92" r="5"/><text x="104" y="78" text-anchor="middle">灵隐寺</text></g>
<g class="cm-pin"><circle class="halo" cx="150" cy="130" r="11"/><circle class="core" cx="150" cy="130" r="4.6"/><text x="172" y="128">断桥</text></g>
<g class="cm-pin"><circle class="halo" cx="168" cy="222" r="11"/><circle class="core" cx="168" cy="222" r="4.6"/><text x="186" y="226">河坊街</text></g>
<g class="cm-pin"><circle class="halo" cx="82" cy="212" r="11"/><circle class="core" cx="82" cy="212" r="4.6"/><text x="60" y="238" text-anchor="middle">龙井村</text></g>
<circle class="cm-me-halo" cx="182" cy="200" r="15"/><circle class="cm-me" cx="182" cy="200" r="5"/>
</svg>`;

function LightUp({
  city, onDone,
}: {
  city: { name: string; province: string; visits: number; days: number; first: string };
  onDone: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  return (
    <Portal id="overlays">
      <div className="lightup" style={{ opacity: leaving ? 0 : 1, transition: 'opacity .32s' }}>
        <div className="rings"><i /><i /><i /><i /></div>
        <div className="halo" />
        {Array.from({ length: 14 }).map((_, i) => {
          const angle = (i / 14) * Math.PI * 2;
          const dist = 90 + ((i * 37) % 90);
          const style = {
            left: '50%',
            top: '50%',
            width: 2 + (i % 4),
            height: 2 + (i % 4),
            '--dx': `${Math.cos(angle) * dist}px`,
            '--dy': `${Math.sin(angle) * dist}px`,
            animationDelay: `${(i % 7) * 0.3}s`,
          } as CSSProperties;
          return <i className="spark" key={i} style={style} />;
        })}
        <div className="lu-content">
          <div className="lu-kicker">TRAVELOG · 城市点亮</div>
          <h2 className="lu-city">{city.name}</h2>
          <div className="lu-sub">{city.province} · 第 {city.visits} 次到访</div>
          <div className="lu-stats">
            <div><b>{city.visits}</b><span>到访次数</span></div>
            <div><b>{city.days}</b><span>累计天数</span></div>
            <div><b>{city.first}</b><span>首次点亮</span></div>
          </div>
          <button
            className="lu-btn"
            onClick={() => { setLeaving(true); window.setTimeout(onDone, 320); }}
          >
            收下这张城市卡
          </button>
        </div>
      </div>
    </Portal>
  );
}

export function MapScreen() {
  const cities = useAppStore((s) => s.cities);
  const currentCity = useAppStore((s) => s.currentCity);
  const pending = useAppStore((s) => s.pendingArrival);
  const notifications = useAppStore((s) => s.notifications);
  const markAllRead = useAppStore((s) => s.markAllRead);
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const toast = useToast();
  const openAi = useUiStore((s) => s.openAi);
  const openCitySearch = useUiStore((s) => s.openCitySearch);

  const [mode, setMode] = useState<'china' | 'city'>('china');
  const [cardOpen, setCardOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [lit, setLit] = useState<null | { name: string; province: string; visits: number; days: number; first: string }>(null);
  const [busy, setBusy] = useState(false);
  const [province, setProvince] = useState<ProvinceGeo | null>(null);
  const [provinceLoading, setProvinceLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<ProvinceCity | null>(null);

  const addManualCity = useAppStore((s) => s.addManualCity);
  const setCurrentCity = useAppStore((s) => s.setCurrentCity);

  const record = cities[currentCity];
  const isLit = !!record?.lit;
  const litCount = litCities(cities).length;
  const boxCount = useAppStore((s) => s.boxes.filter((b) => b.city === currentCity).length);
  const provinces = new Set(Object.values(cities).filter((c) => c.lit).map((c) => c.province)).size;
  const provincePct = Math.round((provinces / 34) * 100);
  const meta = record ?? { province: CITY_META[currentCity]?.province ?? '', visits: 0, days: 0 };
  const provinceCities = province?.cities ?? [];
  const provinceLit = provinceCities.filter((c) => matchProvinceCity(cities, c)?.lit);
  const provinceVisits = provinceLit.reduce((n, c) => n + (matchProvinceCity(cities, c)?.visits ?? 0), 0);
  const selectedRecord = selectedCity ? matchProvinceCity(cities, selectedCity) : undefined;
  const selectedLit = !!selectedRecord?.lit;

  const openProvince = async (adcode: number, selectAdcode?: string) => {
    const key = String(adcode).padStart(6, '0');
    if (province?.adcode === key) return;
    setProvinceLoading(true);
    setSelectedCity(null);
    try {
      const geo = await loadProvinceGeo(key);
      setProvince(geo);
      if (selectAdcode) {
        const target = geo.cities.find((c) => c.a === selectAdcode);
        if (target) {
          const q = new URLSearchParams({ name: target.label, province: geo.name, p: geo.adcode });
          navigate(`/recommend/${target.a}?${q.toString()}`);
          return;
        }
      }
    } catch {
      toast('省级地图加载失败，请稍后重试', 'alert');
    } finally {
      setProvinceLoading(false);
    }
  };

  const closeProvince = () => {
    setProvince(null);
    setSelectedCity(null);
  };

  // QA / deep-link helper: /?demo=1&province=330000&city=330100
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search || window.location.search);
    const p = params.get('province');
    if (!p) return;
    const city = params.get('city') ?? undefined;
    void openProvince(Number(p), city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLightUp = async () => {
    if (isLit) { toast('该城市已点亮，不会重复点亮'); return; }
    setBusy(true);
    try {
      const rec = await api.visits.lightUp(currentCity);
      setLit({
        name: currentCity,
        province: rec.province || '',
        visits: rec.visits || 1,
        days: rec.days || 1,
        first: '今天',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="map-screen">
        <div className="map-stage">
          <div className="map-top">
            <button className="glass-pill" onClick={() => setCardOpen(true)}>
              <Icon name="pin" size={15} /> {currentCity}
              <span className="dot" />
              <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 10.5 }}>
                {isLit ? '已点亮' : '未点亮'}
              </span>
            </button>
            <div style={{ display: 'flex', gap: 7 }}>
              <button className="iconbtn" onClick={() => openCitySearch()} aria-label="搜索城市">
                <Icon name="search" size={18} />
              </button>
              <button className="iconbtn" onClick={() => setBellOpen(true)} aria-label="通知">
                <Icon name="bell" size={18} />
                {unreadCount(notifications) > 0 ? <i className="dot-badge" /> : null}
              </button>
              <button className="iconbtn" onClick={() => toast('更多地图设置')} aria-label="更多">
                <Icon name="more" size={18} />
              </button>
            </div>
          </div>

          {province && mode === 'china' ? (
            <div className="map-crumb">
              <button onClick={closeProvince}><Icon name="left" size={14} />全国</button>
              <span className="sep">/</span>
              <b>{province.name}</b>
              <span className="cnt">{provinceCities.length} 个地级市</span>
            </div>
          ) : (
            <div className="map-seg" role="tablist">
              <button className={mode === 'china' ? 'on' : ''} onClick={() => { setMode('china'); closeProvince(); }}>全国</button>
              <button className={mode === 'city' ? 'on' : ''} onClick={() => setMode('city')}>本城</button>
            </div>
          )}

          <div className="map-tools">
            <button className="iconbtn" onClick={() => toast('尚未获取定位 · 可在系统设置中开启')} aria-label="定位">
              <Icon name="locate" size={18} />
            </button>
            <button className="iconbtn" onClick={() => toast('图层：点亮城市 / 省份完成度 / 此刻现场')} aria-label="图层">
              <Icon name="layers" size={18} />
            </button>
            <button className="iconbtn" onClick={() => toast('定位安全：未检测到模拟定位', 'shield')} aria-label="定位安全">
              <Icon name="shield" size={18} />
            </button>
          </div>

          <div className="map-canvas">
            {mode === 'china'
              ? (province
                ? <ProvinceMap
                    geo={province}
                    cities={cities}
                    selected={selectedCity}
                    onSelect={(city) => navigate(`/recommend/${city.a}?name=${encodeURIComponent(city.label)}&province=${encodeURIComponent(province.name)}&p=${province.adcode}`)}
                  />
                : <ChinaMap cities={cities} currentCity={currentCity} onProvince={openProvince} />)
              : <div className="citymap" dangerouslySetInnerHTML={{ __html: CITY_MAP }} />}
            {provinceLoading ? (
              <div className="province-loading">
                <span className="spin" />
                <span>正在加载地级市边界…</span>
              </div>
            ) : null}
          </div>

          {province && mode === 'china' ? (
            <div className="map-stats">
              <div className="n">{provinceLit.length}<small>/ {provinceCities.length} 座已点亮</small></div>
              <div className="l">{province.name} · 仅显示地级市 · 到访 {provinceVisits} 次</div>
              <div className="bar">
                <i style={{ width: `${Math.round((provinceLit.length / Math.max(1, provinceCities.length)) * 100)}%` }} />
              </div>
            </div>
          ) : (
            <div className="map-stats">
              <div className="n">{litCount}<small>座城市</small></div>
              <div className="l">省级完成度 {provincePct}% · 点击省份看地级市</div>
              <div className="bar"><i style={{ width: `${Math.max(0, provincePct)}%` }} /></div>
            </div>
          )}

          <button className="fab ai" style={{ right: 14, bottom: 14, height: 42 }} onClick={() => openAi()}>
            <Icon name="sparkle" size={16} /><span style={{ fontSize: 11.5 }}>AI 助手</span>
          </button>
        </div>

        <div className="map-bottom">
          {province && mode === 'china' ? (
            <div className="province-panel">
              <div className="pp-head">
                <span className="pp-kicker">PROVINCE MAP · {province.adcode}</span>
                <button className="pp-back" onClick={closeProvince}>
                  <Icon name="left" size={12} />返回全国
                </button>
              </div>
              <div className="pp-title">
                <b>{province.name}</b>
                <span>{provinceLit.length} / {provinceCities.length} 已点亮</span>
              </div>
              <p>点击地图上的地级市查看详情。已点亮的城市为绿色，未点亮可手动补录；本层不展示区县。</p>
            </div>
          ) : (
            <div className="city-panel" onClick={() => (isLit ? setCardOpen(true) : doLightUp())} role="button" tabIndex={0}>
              <div className="city-panel-in">
                <div className="cp-top">
                  <div>
                    <div className="cp-kicker"><i />{isLit ? 'CURRENT CITY' : 'NOT LIT YET'} · {meta.province || '—'}</div>
                    <div className="cp-city">
                      <b>{currentCity}</b>
                      <span>{isLit ? `已点亮 · ${meta.visits} 次到访` : '尚未点亮 · 还没有到访记录'}</span>
                    </div>
                  </div>
                  <div className="cp-arrow">{isLit ? <Icon name="right" size={15} /> : <Icon name="locate" size={15} />}</div>
                </div>
                <div className="cp-stats">
                  <div className="cp-stat"><b>{pending?.minutes ?? meta.visits ?? 0}<small>{isLit ? '' : ' 分'}</small></b><span>{isLit ? '到访次数' : '本次停留'}</span></div>
                  <div className="cp-stat"><b>{pending?.points ?? meta.days ?? 0}<small>{isLit ? '' : ' 个'}</small></b><span>{isLit ? '累计天数' : '有效定位点'}</span></div>
                  <div className="cp-stat">
                    <b>{isLit ? boxCount : pending ? pending.accuracy : '—'}<small>{isLit || !pending ? '' : ' m'}</small></b>
                    <span>{isLit ? '回忆盒' : '定位精度'}</span>
                  </div>
                </div>
                <div className="cp-progress">
                  <Ring value={isLit ? 1 : 0} size={30} stroke={2.5} />
                  <div className="t">
                    <b>{isLit ? `已点亮 · ${meta.visits} 次到访` : '还没有定位记录'}</b>
                    <span>{isLit ? '每次到达会单独记入城市卡' : '可手动点亮；自动判定需 30 分钟 + 2 个定位点'}</span>
                  </div>
                  <button
                    className="go"
                    disabled={busy}
                    onClick={(e) => { e.stopPropagation(); if (!isLit) doLightUp(); else setCardOpen(true); }}
                  >
                    {busy ? '判定中…' : isLit ? '查看城市卡' : '手动点亮'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Sheet
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        title={`${currentCity} · 城市卡`}
        sub={`${meta.province} · ${record?.deep ? '深度点亮' : isLit ? '已点亮' : '未点亮'}`}
        footer={(
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => toast('分享图导出尚未接入')}>              <Icon name="share" size={16} />分享城市卡
            </button>
            <button className="btn primary" style={{ flex: 1 }} onClick={() => { setCardOpen(false); navigate('/memory'); }}>
              <Icon name="layers" size={16} />进入回忆盒
            </button>
          </div>
        )}
      >
        <div className="city-card-hero">
          <div className="k">TRAVELOG CITY CARD</div>
          <div className="city-card-name">{currentCity}</div>
          <div className="city-card-meta">首次到访 {record?.first ?? '—'} · 最近 {record?.last ?? '—'}</div>
          <div className="city-card-stats">
            <div><b>{meta.visits ?? 0}</b><span>到访次数</span></div>
            <div><b>{meta.days ?? 0}</b><span>累计天数</span></div>
            <div><b>{Object.values(cities).filter((c) => c.lit).length}</b><span>已点亮</span></div>
          </div>
          <div className="city-card-quote">{isLit ? '还没有为这座城市留下句子。' : '点亮城市后，这里会出现你的第一张城市卡。'}</div>
        </div>

        <div className="section-title" style={{ padding: 0, margin: '4px 0 8px' }}>
          <h2>到访记录</h2><span className="more">仅本人可见</span>
        </div>
        <div className="visit-list">
          {isLit && record ? (
            <div className="visit-row">
              <div><b>{record.first || '今天'}</b><span>手动点亮 · 首次记录</span></div>
              <span className="badge on">已记录</span>
            </div>
          ) : (
            <div className="empty" style={{ padding: '20px 12px' }}>
              <div className="ic"><Icon name="pin" size={20} /></div>
              <b>还没有到访记录</b>
              <p>点亮城市后，每次到达会单独记入这里</p>
            </div>
          )}
        </div>
        <p className="hint" style={{ margin: '10px 2px 0' }}>分享城市卡时不包含精确到访点、同行人和原始轨迹。</p>
      </Sheet>

      <Sheet
        open={!!selectedCity}
        onClose={() => setSelectedCity(null)}
        title={selectedCity?.n ?? ''}
        sub={selectedCity ? `${province?.name ?? ''} · 地级市 · ${selectedCity.a}` : ''}
        footer={selectedCity ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setSelectedCity(null)}>
              {selectedLit ? '关闭' : '取消'}
            </button>
            {selectedLit ? (
              <button
                className="btn primary"
                style={{ flex: 1 }}
                onClick={() => {
                  const key = canonicalCityKey(cities, selectedCity);
                  setCurrentCity(key);
                  closeProvince();
                  setCardOpen(true);
                  toast(`已切换到 ${key}`, 'pin');
                }}
              >
                设为当前城市
              </button>
            ) : (
              <button
                className="btn primary"
                style={{ flex: 1 }}
                onClick={() => {
                  const key = canonicalCityKey(cities, selectedCity);
                  addManualCity(key, province?.name, selectedCity.a);
                  toast(`${key} 已手动点亮`, 'pin');
                  setSelectedCity(null);
                }}
              >
                <Icon name="pin" size={15} />手动补录
              </button>
            )}
          </div>
        ) : null}
      >
        {selectedCity ? (
          <>
            <div className="prov-city-hero">
              <div className="pcf">{selectedCity.label.slice(0, 1)}</div>
              <div>
                <h2>{selectedCity.n}</h2>
                <p>{province?.name} · 地级市</p>
              </div>
              {selectedLit ? <Badge tone="on">已点亮</Badge> : <Badge>未点亮</Badge>}
            </div>

            {selectedLit ? (
              <>
                <div className="prov-city-stats">
                  <div><b>{selectedRecord?.visits ?? 0}</b><span>到访次数</span></div>
                  <div><b>{selectedRecord?.days ?? 0}</b><span>累计天数</span></div>
                  <div><b>{selectedRecord?.first ?? '—'}</b><span>首次到访</span></div>
                </div>
                <p className="hint" style={{ margin: '12px 2px 0' }}>
                  {selectedRecord?.manual ? '该城市为手动补录记录，会在城市卡中单独标记。' : '城市卡包含到访记录、回忆盒与分享入口。'}
                </p>
              </>
            ) : (
              <>
                <div className="menu" style={{ margin: '0 0 10px' }}>
                  <div className="mrow">
                    <span className="ic"><Icon name="clock" size={15} /></span>
                    <span className="t">停留 30 分钟<span>进入城市边界内累计停留不少于 30 分钟</span></span>
                  </div>
                  <div className="mrow">
                    <span className="ic"><Icon name="locate" size={15} /></span>
                    <span className="t">2 个有效定位点<span>间隔不少于 10 分钟，精度不高于 200 米</span></span>
                  </div>
                  <div className="mrow">
                    <span className="ic"><Icon name="calendar" size={15} /></span>
                    <span className="t">24 小时一条记录<span>再次到达且间隔超过 24 小时，生成新的到访</span></span>
                  </div>
                </div>
                <p className="hint" style={{ margin: '0 3px 0' }}>
                  飞行中转、铁路经停与高速路过不点亮。若你确实到过但未被记录，可手动补录。
                </p>
              </>
            )}
          </>
        ) : null}
      </Sheet>

      <Sheet open={bellOpen} onClose={() => setBellOpen(false)} title="消息中心" sub={`${unreadCount(notifications)} 条未读`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.length ? notifications.map((n) => (
            <div className="notice-row" key={n.id}>
              <span className="notice-ico"><Icon name={n.type === 'team' ? 'users' : n.type === 'like' ? 'heart' : 'bell'} size={15} /></span>
              <div><b>{n.title}</b><p>{n.body}</p></div>
            </div>
          )) : (
            <Empty icon="bell" title="还没有消息" text="队伍、喜欢和系统通知会出现在这里" />
          )}
        </div>
        <button className="btn ghost block" style={{ marginTop: 14 }} onClick={() => { markAllRead(); setBellOpen(false); toast('已全部标为已读'); }}>
          全部标为已读
        </button>
      </Sheet>

      {lit ? <LightUp city={lit} onDone={() => { setLit(null); toast('城市卡已收进地图'); }} /> : null}
    </div>
  );
}
