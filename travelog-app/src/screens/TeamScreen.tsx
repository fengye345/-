import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Avatar, Empty } from '../components/ui';
import { useToast } from '../components/Toast';

export function TeamScreen() {
  const team = useAppStore((s) => s.team);
  const send = useAppStore((s) => s.sendMessage);
  const navigate = useNavigate();
  const toast = useToast();
  const [text, setText] = useState('');
  const [safetyOpen, setSafetyOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [team.messages.length]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    send(value);
    setText('');
  };

  if (!team.id) {
    return (
      <div className="screen">
        <div className="apphead"><div><h1>队伍</h1><div className="sub">还没有加入任何队伍</div></div></div>
        <Empty
          icon="users"
          title="还没有队伍"
          text="只有双方互相喜欢并确认后，才会创建队伍和聊天"
        />
        <div style={{ padding: '0 20px' }}>
          <button className="btn ghost block" onClick={() => navigate('/share')}>去共享大厅看看</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen team-screen" style={{ paddingBottom: 0 }}>
      <div className="team-head">
        <button className="iconbtn plain" onClick={() => navigate('/share')} aria-label="返回"><Icon name="left" size={19} /></button>
        <div className="team-title"><b>{team.name}</b><span>{team.members.length}/{team.cap} 人 · {team.city}</span></div>
        <button className="iconbtn plain" style={{ color: 'var(--clay)' }} onClick={() => setSafetyOpen(true)} aria-label="安全中心">
          <Icon name="shield" size={19} />
        </button>
      </div>

      <div className="team-cover">
        <div className="team-meet">
          <span className="ic"><Icon name="pin" size={17} /></span>
          <div><b>{team.meeting.place}</b><span>{team.meeting.time} · {team.meeting.note}</span></div>
          <span className="map" onClick={() => toast('集合点：九溪公交站 C 口 · 公共场所')}><Icon name="map" size={12} />地图</span>
        </div>
      </div>

      <div className="members">
        {team.members.map((m) => (
          <div className={`member${m.leader ? ' leader' : ''}`} key={m.name}>
            <Avatar initial={m.initial} hue={m.hue} size={40} style={m.me ? { boxShadow: '0 0 0 2px var(--jade)' } : undefined} />
            <span>{m.name}</span>
          </div>
        ))}
        <div className="member">
          <span className="avatar add" onClick={() => toast('邀请链接已复制')}><Icon name="plus" size={14} /></span>
          <span>邀请</span>
        </div>
      </div>

      <div className="chat">
        {team.messages.map((m, i) => {
          if (m.sys) return <div className="chat-sys" key={i}>{m.sys}</div>;
          return (
            <div className={`msg${m.me ? ' me' : ''}`} key={i}>
              {!m.me ? <Avatar initial={m.initial ?? ''} hue={m.hue ?? 'a1'} size={26} /> : null}
              <div>
                <div className="bubble">{m.text}</div>
                <div className="tm" style={{ margin: m.me ? '3px 0 0 2px' : '3px 0 0 2px' }}>
                  {m.me ? m.time : `${m.who} · ${m.time}`}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-note">
        <Icon name="shield" size={14} />
        队伍聊天不共享实时位置；敏感内容会进入审核。解散后记录保留 30 天，仅用于投诉与安全处理。
      </div>

      <div className="chat-input">
        <button className="iconbtn plain" onClick={() => toast('可发送：图片 / 集合点 / 行程卡')} aria-label="更多"><Icon name="plus" size={18} /></button>
        <input
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="说点什么…"
          aria-label="输入消息"
        />
        <button className="send" onClick={submit} aria-label="发送"><Icon name="send" size={17} /></button>
      </div>

      <Sheet open={safetyOpen} onClose={() => setSafetyOpen(false)} title="安全中心" sub="队伍内任何成员都能随时使用">
        <div className="menu" style={{ margin: 0 }}>
          <button className="mrow" onClick={() => toast('举报已提交 · 24 小时内处理', 'flag')}>
            <span className="ic"><Icon name="flag" size={15} /></span><span className="t">举报该用户<span>复核期间移出大厅</span></span>
          </button>
          <button className="mrow" onClick={() => toast('已拉黑 · 双方互不可见', 'shield')}>
            <span className="ic"><Icon name="shield" size={15} /></span><span className="t">拉黑</span>
          </button>
          <button className="mrow" onClick={() => toast('已向紧急联系人发送集合点位置', 'phone')}>
            <span className="ic"><Icon name="phone" size={15} /></span><span className="t" style={{ color: 'var(--clay)' }}>一键求助</span>
          </button>
        </div>
      </Sheet>
    </div>
  );
}
