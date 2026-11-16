import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useUiStore } from '../store/uiStore';
import { api } from '../api';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { SpotReviewCard } from '../components/SpotReviewCard';
import { Avatar, Badge, Chip, Empty, Switch } from '../components/ui';
import { useToast } from '../components/Toast';
import { formatDuration, postRemaining, relativeTime } from '../lib/time';
import { adcodeForCity, reviewsForCity, type SpotReview } from '../data/scenic';
import type { MemoryBox, Post, PostType } from '../types';

const TABS = [
  { id: 'recommend', name: '推荐' },
  { id: 'avoid', name: '避坑' },
  { id: 'now', name: '此刻' },
  { id: 'today', name: '今日' },
  { id: 'long', name: '经验' },
  { id: 'culture', name: '文化' },
  { id: 'qa', name: '问答' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function PostCard({ post, onVote }: { post: Post; onVote: (kind: 'valid' | 'invalid' | 'like' | 'save') => void }) {
  const left = postRemaining(post.type, post.ago);
  const expired = left <= 0;
  const badge = post.type === 'now'
    ? <Badge tone="live" dot>现场</Badge>
    : post.type === 'today'
      ? <Badge tone="draft">今日</Badge>
      : <Badge tone="on">经验</Badge>;

  return (
    <article className="post" style={expired ? { opacity: 0.72 } : undefined}>
      <div className="post-body">
        <div className="post-top">
          <Avatar initial={post.initial} hue={post.hue} size={30} />
          <div className="who"><b>{post.author}{post.mine ? ' · 我' : ''}</b><span>{relativeTime(post.ago)} · {post.area}</span></div>
          <div className="right">
            {badge}
            <button className="iconbtn plain" style={{ width: 24, height: 24 }} onClick={() => onVote('save')} aria-label="更多">
              <Icon name="more" size={15} />
            </button>
          </div>
        </div>
        <p className="post-text" dangerouslySetInnerHTML={{ __html: post.text }} />
        <div className="post-loc"><Icon name="pin" size={11} />{post.place}{post.dist && post.dist !== '—' ? ` · 距你 ${post.dist}` : ''}</div>
        {post.img ? (
          <div className="post-img">
            <img src={post.img} alt="" />
            <span className="exp"><Icon name="clock" size={10} />{expired ? '已过期' : formatDuration(left).replace('剩余 ', '剩 ')}</span>
          </div>
        ) : null}
        <div className="post-foot">
          <button className={`act${post.votedValid ? ' hot' : ''}`} onClick={() => onVote('valid')}><Icon name="check" size={14} />仍有效 {post.valid}</button>
          <button className={`act${post.votedInvalid ? ' hot' : ''}`} onClick={() => onVote('invalid')}><Icon name="close" size={14} />已失效 {post.invalid}</button>
          <button className={`act${post.liked ? ' hot' : ''}`} onClick={() => onVote('like')}><Icon name="heart" size={14} filled={post.liked} />{post.likes}</button>
          <button className="act" onClick={() => onVote('save')}><Icon name="bookmark" size={14} filled={post.saved} />{post.saved ? '已收藏' : '收藏'}</button>
          <button className="act" style={{ marginLeft: 'auto' }} onClick={() => onVote('valid')}><Icon name="message" size={13} />评论</button>
        </div>
      </div>
    </article>
  );
}

function PublishSheet({ open, onClose, fromBox, onPublished }: {
  open: boolean;
  onClose: () => void;
  fromBox?: MemoryBox;
  onPublished: (type: TabId) => void;
}) {
  const toast = useToast();
  const [type, setType] = useState<'now' | 'today' | 'exp'>('now');
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>(fromBox ? fromBox.photos.slice(0, 3) : ['photos/pic01.jpg', 'photos/pic14.jpg', 'photos/pic10.jpg']);
  const [onSite, setOnSite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    if (!open) return;
    setType('now');
    setOnSite(true);
    setText(fromBox ? `从「${fromBox.title}」里挑了几张照片。断桥的风把桂花吹到了北山街，湖边比想象中安静。` : '');
    setImages(fromBox ? fromBox.photos.slice(0, 3) : ['photos/pic01.jpg', 'photos/pic14.jpg', 'photos/pic10.jpg']);
  }, [open, fromBox]);

  const meta = {
    now: { name: '此刻', desc: '现场情况 · 6 小时', ttl: '6 小时', icon: 'clock' as const },
    today: { name: '今日推荐', desc: '当天可去 · 24 小时', ttl: '24 小时', icon: 'sun' as const },
    exp: { name: '长期经验', desc: '避坑与交通 · 30 天', ttl: '30 天', icon: 'bookmark' as const },
  };

  const submit = async () => {
    if (!text.trim()) { toast('写点什么再发布吧'); return; }
    setBusy(true);
    try {
      await api.posts.publish({
        type: (type === 'exp' ? 'long' : type) as PostType,
        place: '断桥残雪',
        text: text.trim(),
        img: images[0] ?? null,
        onSite,
        fromBox: !!fromBox,
      });
      onClose();
      onPublished(type === 'today' ? 'today' : type === 'exp' ? 'long' : 'now');
      toast('已通过审核 · 公共副本已发布，私密原件未受影响', 'check');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={fromBox ? '发布公共副本' : '发布'}
      sub={fromBox ? '从回忆盒生成公共副本 · 原盒权限不变' : '选择类型与地点 · 发布前预览'}
      tall
      footer={(
        <button className="btn primary block" style={{ marginTop: 14 }} onClick={submit} disabled={busy}>
          <Icon name="send" size={16} />{busy ? '审核中…' : '提交审核'}
        </button>
      )}
    >
      <div className="publish-type">
        {(Object.keys(meta) as Array<keyof typeof meta>).map((key) => {
          const m = meta[key];
          const disabled = key === 'now' && !onSite;
          return (
            <button
              key={key}
              className={`ptype${type === key ? ' on' : ''}${disabled ? ' dis' : ''}`}
              onClick={() => { if (disabled) { toast('不在现场，只能发布「长期经验」', 'alert'); return; } setType(key); }}
            >
              <div className="ic"><Icon name={m.icon} size={15} /></div>
              <b>{m.name}</b><span>{m.desc}</span>
              {disabled ? <span className="lock">不在现场</span> : null}
            </button>
          );
        })}
      </div>

      <div className="compose">
        <textarea
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="现场是什么情况？"
        />
        <div className="counter">{text.length}/500</div>
        <div className="tools">
          {images.map((src, i) => (
            <div className="pic" key={`${src}-${i}`}>
              <img src={src} alt="" />
              <button onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}><Icon name="close" size={9} /></button>
            </div>
          ))}
          <button onClick={() => toast('从相册选择 · 最多 9 张')}><Icon name="camera" size={18} /></button>
        </div>
      </div>

      <div className="form-card">
        <div className="field-row">
          <span className="ic"><Icon name="pin" size={14} /></span>
          <div className="t"><b>断桥残雪</b><span>距发布位置 320m</span></div>
          <span className="ok"><Icon name="check" size={11} />现场校验通过</span>
        </div>
        <div className="field-row">
          <span className="ic"><Icon name="clock" size={14} /></span>
          <div className="t">有效期<span>系统按类型自动设置</span></div>
          <span className="v">{meta[type].ttl}</span>
        </div>
        <div className="field-row">
          <span className="ic"><Icon name="locate" size={14} /></span>
          <div className="t">当前位置<span>{onSite ? '在城市内，距地点 320m' : '不在现场 · 只能发布经验'}</span></div>
          <Switch checked={!onSite} onChange={(v) => {
            setOnSite(!v);
            if (v && type === 'now') { setType('exp'); toast('已切换为「长期经验」· 现场标识不可购买或伪造', 'alert'); }
          }} label="模拟不在现场" />
        </div>
      </div>

      <button className="preview-toggle" onClick={() => setPreview((v) => !v)}>
        <span><Icon name="eye" size={13} />公共副本预览</span>
        <Icon name="down" size={13} style={{ transform: preview ? 'none' : 'rotate(-90deg)' }} />
      </button>
      {preview ? (
        <div className="preview-mini">
          <div className="k">发布后所有人可见</div>
          <div className="line"><span>位置精度</span><b>西湖景区（商圈级）</b></div>
          <div className="line"><span>EXIF 坐标</span><b>已移除</b></div>
          <div className="line"><span>人脸 / 车牌 / 门牌</span><b>{images.length ? '已检测 1 处，将自动模糊' : '无'}</b></div>
          <div className="line"><span>原回忆盒</span><b>权限不变 · 仅本人可见</b></div>
        </div>
      ) : null}
      <p className="hint" style={{ margin: '10px 2px 0' }}>新用户前 3 条内容先审后发；敏感内容进入机器 + 人工审核队列。</p>
    </Sheet>
  );
}

export function DiscoverScreen() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const openAi = useUiStore((s) => s.openAi);
  const openCitySearch = useUiStore((s) => s.openCitySearch);
  const currentCity = useAppStore((s) => s.currentCity);
  const posts = useAppStore((s) => s.posts);
  const qas = useAppStore((s) => s.qas);
  const votePost = useAppStore((s) => s.votePost);

  const initialTab = params.get('tab');
  const initialCity = params.get('city') ?? currentCity;
  const [tab, setTab] = useState<TabId>(
    initialTab && TABS.some((t) => t.id === initialTab) ? (initialTab as TabId) : 'now',
  );
  const [publishOpen, setPublishOpen] = useState(false);
  const [boxId, setBoxId] = useState<string | undefined>();
  const [spotFilter, setSpotFilter] = useState<string | null>(params.get('spot'));
  const [reviewCity, setReviewCity] = useState(initialCity);
  const [reviewAdcode, setReviewAdcode] = useState(params.get('adcode') ?? adcodeForCity(initialCity));
  const box = useAppStore((s) => s.boxes.find((b) => b.id === boxId));

  useEffect(() => {
    if (params.get('publish') === '1') {
      setBoxId(params.get('boxId') ?? undefined);
      setPublishOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    const t = params.get('tab');
    if (t && TABS.some((x) => x.id === t)) setTab(t as TabId);
    setSpotFilter(params.get('spot'));
    const c = params.get('city');
    if (c) {
      setReviewCity(c);
      setReviewAdcode(params.get('adcode') ?? adcodeForCity(c));
    }
  }, [params]);

  useEffect(() => {
    if (!params.get('city')) {
      setReviewCity(currentCity);
      setReviewAdcode(adcodeForCity(currentCity));
    }
  }, [currentCity, params]);

  const spotReviews = useMemo(
    () => reviewsForCity(reviewAdcode, reviewCity),
    [reviewAdcode, reviewCity],
  );

  const counts = useMemo(() => ({
    recommend: spotReviews.filter((r) => r.kind === 'RECOMMEND').length,
    avoid: spotReviews.filter((r) => r.kind === 'AVOID').length,
    now: posts.filter((p) => p.type === 'now' && postRemaining(p.type, p.ago) > 0).length,
    today: posts.filter((p) => p.type === 'today').length,
    long: posts.filter((p) => p.type === 'long').length,
    culture: 2,
    qa: qas.length,
  }), [posts, qas, spotReviews]);

  const nowPosts = posts.filter((p) => p.type === 'now' && postRemaining(p.type, p.ago) > 0);
  const folded = posts.filter((p) => p.type === 'now' && postRemaining(p.type, p.ago) <= 0);
  const todayPosts = posts.filter((p) => p.type === 'today');
  const longPosts = posts.filter((p) => p.type === 'long');

  const list: Post[] = tab === 'now' ? nowPosts : tab === 'today' ? todayPosts : tab === 'long' ? longPosts : [];
  const isReviewTab = tab === 'recommend' || tab === 'avoid';
  const headerCity = isReviewTab ? reviewCity : currentCity;
  const tabReviews = spotReviews.filter((r) => r.kind === (tab === 'avoid' ? 'AVOID' : 'RECOMMEND'));
  const shownReviews = spotFilter ? tabReviews.filter((r) => r.spotName === spotFilter) : tabReviews;

  const goSpot = (r: SpotReview) => {
    const q = new URLSearchParams({
      name: r.city,
      province: r.province,
      p: `${r.adcode.slice(0, 2)}0000`,
    });
    navigate(`/recommend/${r.adcode}?${q.toString()}`);
  };

  const clearSpot = () => {
    setSpotFilter(null);
    const next = new URLSearchParams(params);
    next.delete('spot');
    setParams(next, { replace: true });
  };

  const onVote = (post: Post) => (kind: 'valid' | 'invalid' | 'like' | 'save') => {
    if ((kind === 'valid' || kind === 'invalid') && post.mine) { toast('不能给自己的内容投票'); return; }
    votePost(post.id, kind);
    if (kind === 'valid' || kind === 'invalid') {
      toast(kind === 'valid' ? '谢谢反馈 · 该内容保持排序' : '已标记失效 · 多次反馈会降低排序', kind === 'valid' ? 'check' : 'alert');
    }
  };

  return (
    <div className="screen">
      <div className="discover-head">
        <div className="dh-row">
          <button className="city-pick" onClick={() => openCitySearch()}>{headerCity} <Icon name="down" size={15} /></button>
          <Badge tone="live" dot>现场 {counts.now}</Badge>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
            <button className="iconbtn" onClick={() => openCitySearch()} aria-label="搜索城市"><Icon name="search" size={17} /></button>
            <button className="iconbtn" onClick={() => toast('消息中心')} aria-label="通知"><Icon name="bell" size={17} /></button>
          </div>
        </div>
        <div className="dh-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`dh-tab${tab === t.id ? ' on' : ''}`}
              onClick={() => {
                setTab(t.id);
                if (t.id !== 'recommend' && t.id !== 'avoid') setSpotFilter(null);
              }}
            >
              {t.name}<span className="n">{counts[t.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 12 }}>
        {tab === 'now' || tab === 'today' || tab === 'long' ? (
          <>
            <div className="feed-sort">
              <span>{tab === 'now' ? '按时效 · 现场可信度排序' : tab === 'today' ? '今日可去的路线、展览与餐厅' : '避坑、交通与拍摄点 · 可被 AI 引用'}</span>
              <span>{tab === 'now' ? '6 小时后自动折叠' : tab === 'today' ? '24 小时有效' : '30 天有效'}</span>
            </div>
            {list.map((post) => <PostCard key={post.id} post={post} onVote={onVote(post)} />)}
            {tab === 'now' && folded.length ? (
              <button className="recycle-row" style={{ width: 'calc(100% - 40px)' }} onClick={() => toast(`已折叠 ${folded.length} 条过期「此刻」`)}>
                <Icon name="clock" size={14} /><span>已折叠 {folded.length} 条过期「此刻」</span><span className="r">查看 <Icon name="right" size={12} /></span>
              </button>
            ) : null}
            {tab === 'today' ? (
              <div className="ai-cta">
                <span><Icon name="sparkle" size={16} /></span>
                <div><b>让 AI 按今天剩余时间排一条</b><p>结合天气、营业时间与现场信息</p></div>
                <button className="btn sm primary" onClick={() => openAi('按今天剩下的时间，排一条半日路线')}>安排</button>
              </div>
            ) : null}
          </>
        ) : null}

        {isReviewTab ? (
          <>
            <div className={`review-banner${tab === 'avoid' ? ' avoid' : ''}`}>
              <div>
                <span className="k">{tab === 'avoid' ? 'AVOID NOTES' : 'RECOMMENDED'}</span>
                <b>{reviewCity}{spotFilter ? ` · ${spotFilter}` : ''}</b>
                <p>
                  {spotFilter
                    ? `正在看 ${spotFilter} 的${tab === 'avoid' ? '避坑' : '推荐'}评论`
                    : `${reviewCity}的景区${tab === 'avoid' ? '避坑' : '推荐'}，来自刚回来的旅行者`}
                </p>
              </div>
              {spotFilter ? (
                <button className="rbb" onClick={clearSpot}>看全部</button>
              ) : (
                <button className="rbb" onClick={() => navigate('/map')}>去地图</button>
              )}
            </div>

            <div className="review-summary">
              <span>
                {spotFilter
                  ? `${spotFilter} · 推荐 ${tabReviews.filter((r) => r.spotName === spotFilter).length} · 避坑 ${spotReviews.filter((r) => r.spotName === spotFilter && r.kind === 'AVOID').length}`
                  : `推荐 ${counts.recommend} · 避坑 ${counts.avoid}`}
              </span>
              <span>按有用数排序</span>
            </div>

            {shownReviews.length ? (
              shownReviews.map((r) => (
                <SpotReviewCard key={r.id} review={r} onSpot={() => goSpot(r)} />
              ))
            ) : (
              <Empty
                icon="compass"
                title="这个景区还没有评论"
                text="换个景区，或回推荐页看看系统推荐"
              />
            )}

            <button className="review-map-link" onClick={() => navigate('/map')}>
              <Icon name="map" size={13} />去地图看更多城市
            </button>
          </>
        ) : null}

        {tab === 'culture' ? (
          <>
            <div className="culture">
              <div className="k">文化卡 · 官方</div>
              <h3>西湖十景，为什么是这十个</h3>
              <p>南宋画师从 800 年前的湖山取景，选出十个最佳观看位置。今天你仍然可以按图索骥，只是季节和人流改变了「最佳」。</p>
              <div className="src"><Icon name="shield" size={9} />杭州市文旅局 · 认证创作者 · 2026.09 修订</div>
            </div>
            {[
              ['西湖绸伞：一把伞的 18 道工序', '城市文化 · 非遗', '从选竹到穿线，杭州人把雨天做成了手艺。'],
              ['「小伢儿」和杭州话的 7 个声调', '方言 · 街区', '在老城巷子里，听懂一句本地话。'],
            ].map(([title, kicker, desc]) => (
              <div className="culture-row" key={title}>
                <div className="ph"><img src="photos/pic14.jpg" alt="" /></div>
                <div><span>{kicker}</span><b>{title}</b><p>{desc}</p></div>
              </div>
            ))}
            <div className="footer-note">文化卡由官方或认证创作者发布，字段结构化，可被 AI 引用</div>
          </>
        ) : null}

        {tab === 'qa' ? (
          <>
            <div className="qa-head">
              <span>向本地用户或 AI 提问 · 7 天有效</span>
              <button className="btn sm ghost" onClick={() => toast('提问已发布 · 7 天后自动折叠')}><Icon name="message" size={13} />提问</button>
            </div>
            {qas.map((q) => (
              <div className="qa" key={q.id}>
                <div className="q">{q.q}</div>
                {q.answers.map((a) => (
                  <div className="a" key={a.by}>
                    <Avatar initial={a.ai ? 'AI' : a.initial} hue={a.ai ? 'a1' : a.hue} size={24} />
                    <div style={{ flex: 1 }}>
                      <p>{a.text}</p>
                      <div className="by">{a.by} · {relativeTime(a.ago)}{a.verified ? <span style={{ color: 'var(--jade)' }}><Icon name="shield" size={10} />已认证</span> : null}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        ) : null}
      </div>

      {tab === 'now' || tab === 'today' ? (
        <button className="fab" onClick={() => setPublishOpen(true)} aria-label="发布"><Icon name="plus" size={17} />发布</button>
      ) : null}

      <PublishSheet
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        fromBox={box}
        onPublished={(t) => setTab(t)}
      />
    </div>
  );
}
