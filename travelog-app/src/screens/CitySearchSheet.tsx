import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useUiStore } from '../store/uiStore';
import { hotCities, searchCities } from '../lib/citySearch';
import { Icon, type IconName } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Badge } from '../components/ui';
import { useToast } from '../components/Toast';
import type { CitySearchResult } from '../lib/citySearch';

function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

export function CitySearchSheet() {
  const open = useUiStore((s) => s.citySearchOpen);
  const initialQuery = useUiStore((s) => s.citySearchQuery);
  const close = useUiStore((s) => s.closeCitySearch);
  const toast = useToast();

  const cities = useAppStore((s) => s.cities);
  const currentCity = useAppStore((s) => s.currentCity);
  const lit = useAppStore((s) => s.cities);
  const addManualCity = useAppStore((s) => s.addManualCity);
  const setCurrentCity = useAppStore((s) => s.setCurrentCity);

  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<CitySearchResult | null>(null);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setSelected(null);
    }
  }, [open, initialQuery]);

  const results = useMemo(
    () => searchCities(query, cities, currentCity),
    [query, cities, currentCity],
  );
  const litCities = useMemo(
    () => Object.entries(lit).filter(([, c]) => c.lit).map(([name, c]) => ({ name, ...c })),
    [lit],
  );

  const pick = (r: CitySearchResult) => setSelected(r);

  const manual = () => {
    if (!selected) return;
    addManualCity(selected.city.n);
    close();
    toast(`${selected.city.n} 已标记为手动点亮 · 审核中`, 'pin');
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={selected ? `${selected.city.n} · ${selected.lit ? '城市卡' : '未点亮'}` : '搜索城市'}
      sub={selected ? `${selected.city.p}${selected.lit ? ' · 已点亮' : ' · 尚未留下到访记录'}` : '中文 / 拼音 / 省份 · 查看点亮状态'}
      tall
    >
      {!selected ? (
        <>
          <div className="city-search-box">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="城市名 / 拼音 / 省份，如 杭州、hangzhou、云南"
              autoFocus
              spellCheck={false}
              onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) pick(results[0]); }}
            />
            {query ? (
              <button className="cs-clear" onClick={() => setQuery('')} aria-label="清空"><Icon name="close" size={11} /></button>
            ) : null}
          </div>

          {query ? (
            results.length ? (
              <>
                <div className="city-group"><span>搜索结果</span><span>{results.length} 个城市</span></div>
                <div className="city-list">
                  {results.map((r) => (
                    <button className="city-row" key={r.city.n} onClick={() => pick(r)}>
                      <span className={`city-flag${r.lit ? ' on' : ''}`}>{r.city.n.slice(0, 1)}</span>
                      <span className="city-info">
                        <b><Highlight text={r.city.n} query={query} /></b>
                        <span>{r.city.p}{r.lit ? ` · ${r.visits} 次到访 · ${r.days} 天` : ' · 未点亮'}</span>
                      </span>
                      {r.current ? <Badge tone="live" dot>当前</Badge> : r.lit ? <Badge tone="on">已点亮</Badge> : <Badge>未点亮</Badge>}
                      <span className="city-chev"><Icon name="right" size={14} /></span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="city-empty">
                <div className="ic"><Icon name="search" size={22} /></div>
                <b>没有找到「{query}」</b>
                <p>试试城市名、拼音或省份，例如“杭州”“hangzhou”“云南”。</p>
                <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => toast('可回到「我的」使用手动补录')}>手动补录这座城市</button>
              </div>
            )
          ) : (
            <>
              <div className="city-group"><span>已点亮</span><span>{litCities.length} 座</span></div>
              <div className="city-list">
                {litCities.map((c) => (
                  <button className="city-row" key={c.name} onClick={() => { setQuery(c.name); }}>
                    <span className="city-flag on">{c.name.slice(0, 1)}</span>
                    <span className="city-info"><b>{c.name}</b><span>{c.province} · {c.visits} 次到访 · {c.days} 天</span></span>
                    {c.name === currentCity ? <Badge tone="live" dot>当前</Badge> : <Badge tone="on">已点亮</Badge>}
                    <span className="city-chev"><Icon name="right" size={14} /></span>
                  </button>
                ))}
              </div>
              <div className="city-group"><span>热门城市</span><span>点击即可搜索</span></div>
              <div className="chips" style={{ padding: '0 0 10px', flexWrap: 'wrap' }}>
                {hotCities().filter((c) => !lit[c.n]).slice(0, 12).map((c) => (
                  <button className="chip" key={c.n} onClick={() => setQuery(c.n)}>{c.n}</button>
                ))}
              </div>
              <p className="hint" style={{ padding: '2px 2px 0' }}>
                支持城市名、拼音与省份搜索。城市以地级及以上行政区为点亮单位，景区与商圈只是城市内的地点。
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <div className="city-detail-hero">
            <div className="flag">{selected.city.n.slice(0, 1)}</div>
            <div>
              <h2>{selected.city.n}</h2>
              <p>{selected.city.p}{selected.lit ? ` · ${selected.visits} 次到访 · ${selected.days} 天` : ' · 尚未点亮'}</p>
            </div>
            {selected.lit ? <Badge tone="on">已点亮</Badge> : <Badge>未点亮</Badge>}
          </div>

          {selected.lit ? (
            <div className="menu" style={{ margin: '0 0 12px' }}>
              <div className="mrow"><span className="ic"><Icon name="calendar" size={15} /></span><span className="t">首次到访<span>{selected.city.n === '杭州' ? '2023-04-06' : '—'}</span></span></div>
              <div className="mrow"><span className="ic"><Icon name="clock" size={15} /></span><span className="t">最近到访<span>今天</span></span></div>
              <div className="mrow"><span className="ic"><Icon name="layers" size={15} /></span><span className="t">回忆盒<span>可在回忆页查看</span></span></div>
            </div>
          ) : (
            <>
              <div className="menu" style={{ margin: '0 0 12px' }}>
                {([
                  ['clock', '停留 30 分钟', '进入城市边界内累计停留不少于 30 分钟'],
                  ['locate', '2 个有效定位点', '间隔不少于 10 分钟，精度不高于 200 米'],
                  ['calendar', '24 小时一条记录', '再次到达且间隔超过 24 小时，生成新的到访'],
                ] as [IconName, string, string][]).map(([icon, title, desc]) => (
                  <div className="mrow" key={title}>
                    <span className="ic"><Icon name={icon} size={15} /></span>
                    <span className="t">{title}<span>{desc}</span></span>
                  </div>
                ))}
              </div>
              <p className="hint" style={{ margin: '0 3px 12px' }}>
                飞行中转、铁路经停与高速路过不点亮。景区、商圈和街区属于城市内的地点，不作为独立城市。
              </p>
            </>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setSelected(null)}>返回搜索</button>
            {selected.lit ? (
              <button className="btn primary" style={{ flex: 1 }} onClick={() => { setCurrentCity(selected.city.n); close(); toast(`已切换到 ${selected.city.n}`); }}>
                设为当前城市
              </button>
            ) : (
              <button className="btn primary" style={{ flex: 1 }} onClick={manual}><Icon name="pin" size={15} />手动补录</button>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}
