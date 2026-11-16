import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { api, ApiError } from '../api';
import { Icon, type IconName } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Portal } from '../components/Portal';
import { Avatar, Badge, Chip, Empty } from '../components/ui';
import { useToast } from '../components/Toast';
import { formatCountdown } from '../lib/time';
import type { HallUser } from '../types';

function MatchOverlay({ user, onTeam, onLater }: { user: HallUser; onTeam: () => void; onLater: () => void }) {
  const me = useAppStore((s) => s.user);
  return (
    <Portal id="overlays">
      <div className="match-screen">
        <div className="match-avatars">
          <Avatar initial={me.initial || '我'} hue={me.hue} size={84} />
          <span className="heart"><Icon name="heart" size={16} filled /></span>
          <Avatar initial={user.initial} hue={user.hue} size={84} style={{ marginLeft: -16 }} />
        </div>
        <h2>你们互相喜欢</h2>
        <p>{user.name} 也喜欢了你的名片。平台不会在你确认前展示对方的任何联系方式。</p>
        <div className="match-why">
          <b>匹配理由</b><br />
          <span dangerouslySetInnerHTML={{ __html: user.why }} />
        </div>
        <div className="match-actions">
          <button className="btn" style={{ background: '#D8B96F', color: '#14251F' }} onClick={onTeam}>
            <Icon name="users" size={16} />和 {user.name} 组队
          </button>
          <button className="btn" style={{ background: 'rgba(255,255,255,.08)', color: '#F7F2E4', border: '1px solid rgba(255,255,255,.16)' }} onClick={onLater}>
            继续看看
          </button>
        </div>
      </div>
    </Portal>
  );
}

export function ShareScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const share = useAppStore((s) => s.share);
  const hall = useAppStore((s) => s.hall);
  const currentCity = useAppStore((s) => s.currentCity);
  const user = useAppStore((s) => s.user);
  const auth = useAppStore((s) => s.auth);
  const cities = useAppStore((s) => s.cities);
  const startShare = useAppStore((s) => s.startShare);
  const stopShare = useAppStore((s) => s.stopShare);
  const [cardOpen, setCardOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [filter, setFilter] = useState('全部');
  const [liked, setLiked] = useState<string[]>([]);
  const [matched, setMatched] = useState<HallUser | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const left = share.expiresAt ? Math.max(0, share.expiresAt - now) : 0;
  const filtered = useMemo(
    () => (filter === '全部' ? hall : hall.filter((u) => u.tags.includes(filter))),
    [filter, hall],
  );
  const record = cities[currentCity];
  const canShare = !!record?.lit && user.verified && user.adult;
  const checks = [
    {
      ok: !!record?.lit,
      title: '当前城市已点亮',
      desc: record ? `${currentCity} · ${record.province || '已点亮'}` : `${currentCity} 还没有点亮`,
    },
    {
      ok: user.verified && !!auth?.phone,
      title: '手机号与成年人确认',
      desc: auth?.phone ? `${auth.phone} · 仅用于合规与风控` : '还没有完成注册',
    },
    {
      ok: user.adult,
      title: '年满 18 周岁',
      desc: '陌生人匹配仅对成年人开放',
    },
  ];

  const openShare = async () => {
    if (!canShare) {
      toast(record?.lit ? '请先完善注册信息' : `请先点亮 ${currentCity}`, 'alert');
      return;
    }
    setBusy(true);
    try {
      await api.share.start();
      setCardOpen(false);
      toast('共享已开启 · 24 小时后自动结束', 'check');
    } finally {
      setBusy(false);
    }
  };

  const like = async (user: HallUser) => {
    try {
      const res = await api.share.like(user.id);
      setLiked((prev) => [...prev, user.id]);
      if (res.mutual) setMatched(user);
      else toast(`已向 ${user.name} 表达喜欢 · 双方同意后才会匹配`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '操作失败');
    }
  };

  if (!share.active) {
    return (
      <div className="screen">
        <div className="apphead">
          <div><h1>共享</h1><div className="sub">同城 · 双方确认 · 城市级</div></div>
          <button className="iconbtn" onClick={() => setSafetyOpen(true)} aria-label="安全中心"><Icon name="shield" size={18} /></button>
        </div>

        <div className="share-hero">
          <div className="kicker">SHARE MODE · 24H</div>
          <h2>此刻，和同城的人<br />一起走一段</h2>
          <p>只有已点亮当前城市时才能开启。首版只按城市级共享，不展示距离、坐标或精确位置，默认 24 小时有效。</p>
          <button
            className="btn"
            style={{ background: '#D8B96F', color: '#14251F', opacity: canShare ? 1 : .55 }}
            onClick={() => {
              if (canShare) setCardOpen(true);
              else if (!record?.lit) navigate('/map');
              else toast('请先完善注册信息', 'alert');
            }}
          >
            <Icon name="users" size={16} />{canShare ? '开启共享' : record?.lit ? '完善信息后开启' : '先点亮城市'}
          </button>
        </div>

        <div className="section-title"><h2>开启条件</h2><span className="more">{checks.filter((c) => c.ok).length} / {checks.length}</span></div>
        <div className="share-check">
          {checks.map((c) => (
            <div className="row" key={c.title}>
              <span className={c.ok ? 'ok' : 'miss'} style={c.ok ? undefined : { color: 'var(--clay)' }}>
                <Icon name={c.ok ? 'check' : 'close'} size={12} />
              </span>
              <div className="t">{c.title}<span>{c.desc}</span></div>
              <span className="st">{c.ok ? '已满足' : '未满足'}</span>
            </div>
          ))}
        </div>

        <div className="section-title"><h2>安全边界</h2><span className="more">设计取舍</span></div>
        <div className="safety-list">
          {([
            ['eye', '距离不展示', '首版只按城市级共享，不显示距离、坐标或精确位置'],
            ['message', '匹配前不能私信', '双方表达喜欢后才建立匹配与聊天'],
            ['pin', '不共享实时位置', '集合点选在公共场所，聊天内不发送坐标'],
          ] as [IconName, string, string][]).map(([icon, title, desc]) => (
            <div className="safety-item" key={title}>
              <span><Icon name={icon} size={15} /></span>
              <div><b>{title}</b><p>{desc}</p></div>
            </div>
          ))}
        </div>
        <div className="footer-note">首版只在已点亮城市开放 · 不跨城市推荐<br />离开城市超过 5 公里，共享状态自动暂停</div>

        <Sheet
          open={cardOpen}
          onClose={() => setCardOpen(false)}
          title="共享名片"
          sub="发布前预览 · 可随时关闭"
          footer={(
            <button className="btn primary block" style={{ marginTop: 14 }} onClick={openShare} disabled={busy}>
              <Icon name="users" size={16} />{busy ? '发布中…' : '发布名片并进入大厅'}
            </button>
          )}
        >
          <div className="share-card">
            <div className="share-card-top">
              <Avatar initial={user.initial || '我'} hue={user.hue} size={54} radius={18} />
              <div><b>{user.name || '未命名'}</b><span>{user.age || '—'} 岁 · 未填写性别</span><em><Icon name="shield" size={11} />{user.verified ? '已注册' : '资料未完成'}</em></div>
              <Badge tone="clay">预览</Badge>
            </div>
            <div className="share-card-tags">
              {user.tags.length ? user.tags.map((t) => <span key={t}>{t}</span>) : <span>还没有填写旅行偏好</span>}
            </div>
            <div className="share-card-grid">
              <div><span>点亮日期</span><b>{record?.first || '今天'}</b></div>
              <div><span>想找的同伴</span><b>{user.tags[0] || '未填写'}</b></div>
              <div><span>距离显示</span><b>仅同城</b></div>
              <div><span>语言</span><b>未填写</b></div>
            </div>
            <div className="share-card-note">名片不展示手机号、社交账号和精确位置。你随时可以关闭共享。</div>
          </div>
          <div className="block-label">可见时长</div>
          <div className="chips" style={{ padding: '0 0 4px' }}>
            <span className="chip on">24 小时</span><span className="chip">8 小时</span><span className="chip">本次停留</span>
          </div>
          <p className="hint" style={{ margin: '10px 2px 0' }}>同城当前有 {hall.length} 位旅行者开启了共享。大厅为空时不会用演示用户填充。</p>
        </Sheet>

        <Sheet open={safetyOpen} onClose={() => setSafetyOpen(false)} title="安全中心" sub="队伍内任何成员都能随时使用">
          <div className="menu" style={{ margin: 0 }}>
            <button className="mrow" onClick={() => toast('举报已提交 · 我们将在 24 小时内处理', 'flag')}>
              <span className="ic"><Icon name="flag" size={15} /></span><span className="t">举报用户或内容<span>24 小时内首次响应</span></span>
            </button>
            <button className="mrow" onClick={() => toast('已拉黑 · 双方互不可见', 'shield')}>
              <span className="ic"><Icon name="shield" size={15} /></span><span className="t">拉黑<span>屏蔽后互不可见</span></span>
            </button>
            <button className="mrow" onClick={() => toast('已向紧急联系人发送集合点位置', 'phone')}>
              <span className="ic"><Icon name="phone" size={15} /></span><span className="t" style={{ color: 'var(--clay)' }}>一键求助<span>发送定位给紧急联系人并拨打 110</span></span>
            </button>
          </div>
          <p className="hint" style={{ margin: '12px 3px 0' }}>建议在公共场所集合；不要向陌生人转账或透露住宿门牌；遇到危险优先离开现场并报警。</p>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="apphead">
        <div><h1>共享</h1><div className="sub">{currentCity} · 同城大厅</div></div>
        <div className="apphead-actions">
          <button className="iconbtn" onClick={() => setSafetyOpen(true)} aria-label="安全中心"><Icon name="shield" size={18} /></button>
          <button className="iconbtn" onClick={() => setMoreOpen(true)} aria-label="更多"><Icon name="more" size={18} /></button>
        </div>
      </div>

      <div className="hall-head" style={{ paddingTop: 0 }}>
        <div className="hall-status"><span className="live" /><b>共享中</b><span>· 已发布名片</span></div>
        <span className="countdown">{formatCountdown(left)}</span>
      </div>

      <div className="hall-sum">
        <div className="hall-stat"><b>{hall.length}</b><span>同城可匹配</span></div>
        <div className="hall-stat"><b>{liked.length}</b><span>我表达的喜欢</span></div>
        <div className="hall-stat"><b>0</b><span>等待你回应</span></div>
      </div>

      <div className="chips" style={{ paddingTop: 2 }}>
        {['全部', '摄影', '徒步', '夜游', '咖啡'].map((t) => (
          <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>{t}</Chip>
        ))}
      </div>

      {filtered.length ? filtered.map((u) => {
        const isLiked = liked.includes(u.id);
        return (
          <div className="person" key={u.id}>
            <div className="person-top">
              <Avatar initial={u.initial} hue={u.hue} size={52} radius={17} />
              <div className="id">
                <div className="nm"><b>{u.name}</b><span className="age">{u.age}</span>{u.verified ? <span className="v"><Icon name="shield" size={13} /></span> : null}</div>
                <div className="tags">{u.tags.map((t) => <span key={t}>{t}</span>)}</div>
              </div>
              <div className="dist"><Icon name="pin" size={11} />{u.dist}</div>
            </div>
            <div className="why"><Icon name="sparkle" size={13} /><div dangerouslySetInnerHTML={{ __html: u.why }} /></div>
            <div className="acts">
              <span className="hint" style={{ marginRight: 'auto' }}>{u.note}</span>
              <button className="skip" onClick={() => toast('已跳过 · 不会通知对方')}>跳过</button>
              <button className={`btn sm ${isLiked ? 'clay' : 'primary'} like`} onClick={() => like(u)} disabled={isLiked}>
                <Icon name="heart" size={14} filled={isLiked} />{isLiked ? '已喜欢' : '喜欢'}
              </button>
            </div>
          </div>
        );
      }) : (
        <Empty
          icon="users"
          title="大厅里还没有人"
          text="不会被演示用户填充；等第一位同城旅行者开启共享后才会出现"
        />
      )}

      <div className="footer-note">所有匹配都需要双方确认 · 关闭共享后立即从大厅移除<br />被举报的用户在复核期间不再进入大厅</div>

      <Sheet open={safetyOpen} onClose={() => setSafetyOpen(false)} title="安全中心">
        <p className="hint">举报、拉黑与一键求助始终可见。建议在公共场所集合。</p>
      </Sheet>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="共享设置">
        <div className="menu" style={{ margin: 0 }}>
          <button className="mrow" onClick={() => { stopShare(); setMoreOpen(false); toast('共享已关闭'); }}>
            <span className="ic"><Icon name="close" size={15} /></span><span className="t">关闭共享<span>立即从大厅移除</span></span>
          </button>
          <button className="mrow" onClick={() => { stopShare(); setMoreOpen(false); toast(`已离开${currentCity} 5 公里 · 共享已自动暂停`, 'pin'); }}>
            <span className="ic"><Icon name="pin" size={15} /></span><span className="t">模拟离开城市 5 公里<span>验证自动暂停规则</span></span>
          </button>
        </div>
      </Sheet>

      {matched ? (
        <MatchOverlay
          user={matched}
          onTeam={() => {
            setMatched(null);
            navigate('/share/team');
            toast('已加入队伍 · 记得在公共场所集合', 'users');
          }}
          onLater={() => setMatched(null)}
        />
      ) : null}
    </div>
  );
}
