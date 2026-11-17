import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/appStore';
import { cityForAdcode, reviewsForCity, spotsForCity, type ScenicSpot, type SpotKind } from '../data/scenic';

export function RecommendScreen() {
  const { adcode = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const queryCity = params.get('name') ?? '';
  const province = params.get('province') ?? '';
  const provinceAdcode = params.get('p') ?? `${adcode.slice(0, 2)}0000`;
  const name = queryCity || cityForAdcode(adcode) || '这座城';

  const record = useAppStore((s) => s.cities[name]);
  const addManualCity = useAppStore((s) => s.addManualCity);
  const setCurrentCity = useAppStore((s) => s.setCurrentCity);
  const lit = !!record?.lit;

  const spots = useMemo(() => spotsForCity(adcode, name, province), [adcode, name, province]);
  const reviews = useMemo(() => reviewsForCity(adcode, name, province), [adcode, name, province]);
  const [filter, setFilter] = useState('全部');
  const heroImage = spots[0]?.image ?? '';
  const cityName = spots[0]?.city ?? name;
  const categories = useMemo(() => ['全部', ...Array.from(new Set(spots.map((s) => s.category)))], [spots]);
  const filtered = filter === '全部' ? spots : spots.filter((s) => s.category === filter);

  const recommendCount = reviews.filter((r) => r.kind === 'RECOMMEND').length;
  const avoidCount = reviews.length - recommendCount;

  const countFor = (spot: ScenicSpot, kind: SpotKind) =>
    reviews.filter((r) => r.spotId === spot.id && r.kind === kind).length;

  const goDiscover = (tab: 'recommend' | 'avoid', spot?: ScenicSpot) => {
    const q = new URLSearchParams({ tab, city: cityName, adcode });
    if (spot) q.set('spot', spot.name);
    navigate(`/discover?${q.toString()}`);
  };

  const backToMap = () => navigate(`/map?province=${provinceAdcode}`);

  const lightCity = () => {
    addManualCity(name, province, adcode);
    toast(`${name} 已手动点亮`, 'pin');
  };

  return (
    <div className="screen rec-screen">
      <div className={`rec-hero${heroImage ? '' : ' no-cover'}`}>
        {heroImage ? <img src={heroImage} alt="" /> : <div className="rec-empty-cover"><Icon name="compass" size={30} /></div>}
        <div className="rec-scrim" />
        <div className="rec-nav">
          <button className="iconbtn dark" onClick={backToMap} aria-label="返回地图">
            <Icon name="left" size={18} />
          </button>
          <button className="iconbtn dark" onClick={() => toast('分享图导出尚未接入')} aria-label="分享">
            <Icon name="share" size={17} />
          </button>
        </div>
        <div className="rec-hero-text">
          <div className="k">SYSTEM GUIDE · {province || '城市推荐'}</div>
          <h1>{cityName}</h1>
          <p>{spots.length ? `${spots.length} 个系统推荐` : '系统暂无推荐'} · {reviews.length} 条评论</p>
        </div>
      </div>

      <div className="rec-body">
        <div className={`rec-lit${lit ? ' on' : ''}`}>
          <span className="dot" />
          <div>
            <b>{lit ? '已点亮这座城市' : '这座城市还没有点亮'}</b>
            <span>{lit ? '系统推荐不受到访记录影响' : '推荐基于公开资料；点亮后可记录到访与回忆'}</span>
          </div>
          {lit ? (
            <button
              className="rec-lit-btn"
              onClick={() => { setCurrentCity(name); toast(`已切换到 ${name}`, 'pin'); navigate('/map'); }}
            >
              设为当前
            </button>
          ) : (
            <button className="rec-lit-btn" onClick={lightCity}>手动点亮</button>
          )}
        </div>

        {spots.length === 0 ? (
          <div className="rec-no-spots">
            <div className="ic"><Icon name="compass" size={28} /></div>
            <h2>系统暂无推荐</h2>
            <p>这座城市还没有经过核验的景区目录。等真实旅行者的推荐积累起来后，我们再把它纳入系统推荐。</p>
            <button className="btn ghost" onClick={() => navigate(`/discover?tab=recommend&city=${encodeURIComponent(name)}&adcode=${adcode}`)}>
              <Icon name="message" size={14} />去发现页看看用户推荐
            </button>
          </div>
        ) : (
          <>
        <div className="chips rec-chips">
          {categories.map((c) => (
            <button key={c} className={`chip${filter === c ? ' on' : ''}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>

        <div className="rec-quick">
          <button onClick={() => goDiscover('recommend')}>
            <Icon name="message" size={14} />看推荐评论<span>{recommendCount}</span>
          </button>
          <button className="avoid" onClick={() => goDiscover('avoid')}>
            <Icon name="alert" size={14} />避坑指南<span>{avoidCount}</span>
          </button>
        </div>

        <div className="section-title">
          <h2>系统推荐</h2>
          <span className="more">系统策展 · 无用户评论时按目录排序</span>
        </div>

        <div className="spot-list">
          {filtered.map((spot) => (
            <article className="spot-card" key={spot.id}>
              <div className="spot-img">
                {spot.image ? <img src={spot.image} alt={spot.name} /> : (
                  <div className="spot-img-empty">
                    <b>{spot.name}</b>
                    <span>{spot.city} · 系统目录</span>
                  </div>
                )}
                <div className="spot-veil" />
                <span className="spot-badge">系统推荐</span>
              </div>
              <div className="spot-body">
                <div className="spot-title">
                  <h3>{spot.name}</h3>
                  <span className="spot-cat">{spot.category}</span>
                </div>
                <p className="spot-reason">{spot.reason}</p>
                <div className="spot-meta">
                  <span><Icon name="clock" size={11} />{spot.duration}</span>
                  <span><Icon name="bookmark" size={11} />{spot.ticket}</span>
                  <span><Icon name="pin" size={11} />{spot.distance}</span>
                </div>
                <div className="spot-tags">
                  {spot.tags.map((t) => <span key={t}>{t}</span>)}
                </div>
                <div className="spot-tip"><Icon name="alert" size={11} />{spot.tip}</div>
                <div className="spot-acts">
                  <button className="spot-act" onClick={() => goDiscover('recommend', spot)}>
                    <Icon name="check" size={13} />推荐 {countFor(spot, 'RECOMMEND')}
                  </button>
                  <button className="spot-act avoid" onClick={() => goDiscover('avoid', spot)}>
                    <Icon name="close" size={13} />避坑 {countFor(spot, 'AVOID')}
                  </button>
                  <button className="spot-act go" onClick={() => goDiscover('recommend', spot)}>
                    看评论<Icon name="right" size={12} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="rec-review-block">
          <div className="rec-review-head">
            <div>
              <h2>评论补充</h2>
              <span>{reviews.length ? '系统推荐之外，看看刚回来的人怎么说' : '还没有评论，去发现页写下第一条'}</span>
            </div>
            <button onClick={() => goDiscover('recommend')}>去发现<Icon name="right" size={12} /></button>
          </div>
          {reviews.length === 0 ? (
            <div className="rec-empty">
              <Icon name="message" size={17} />
              <b>还没有人留下评论</b>
              <p>系统只展示推荐，不生成假评论。你可以去发现页发布真实体验。</p>
            </div>
          ) : reviews.slice(0, 2).map((r) => (
            <button
              className="rec-review-row"
              key={r.id}
              onClick={() => goDiscover(r.kind === 'AVOID' ? 'avoid' : 'recommend', spots.find((s) => s.id === r.spotId))}
            >
              <span className={`rv-mark ${r.kind === 'AVOID' ? 'avoid' : ''}`}>
                {r.kind === 'AVOID' ? '避' : '荐'}
              </span>
              <span className="rv-body">
                <b>{r.spotName} · {r.author}</b>
                <span>{r.text}</span>
              </span>
              <Icon name="right" size={13} />
            </button>
          ))}
        </div>

        <p className="rec-note">
          系统推荐综合公开资料整理；评论只在你或他人真实发布后出现。营业时间、票价可能调整，出发前请再确认。
        </p>
          </>
        )}
      </div>

      {spots.length > 0 ? (
        <div className="rec-sticky">
          <button className="rec-cta" onClick={() => goDiscover('recommend')}>
            <span>推荐与评论</span><b>{recommendCount}</b>
          </button>
          <button className="rec-cta avoid" onClick={() => goDiscover('avoid')}>
            <span>避坑指南</span><b>{avoidCount}</b>
          </button>
        </div>
      ) : null}
    </div>
  );
}
