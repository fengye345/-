import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useUiStore } from '../store/uiStore';
import { api, ApiError } from '../api';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Portal } from '../components/Portal';
import { useToast } from '../components/Toast';
import type { AiAnswer } from '../types';

type Msg =
  | { role: 'user'; text: string }
  | { role: 'ai'; kind: AiAnswer['kind']; text: string };

const QUICK = ['今天下午去哪', '西湖现在人多吗', '附近吃什么', '明天天气如何', '帮我排半天路线'];

export function AiSheet() {
  const open = useUiStore((s) => s.aiOpen);
  const prefill = useUiStore((s) => s.aiPrefill);
  const closeAi = useUiStore((s) => s.closeAi);
  const toast = useToast();
  const route = useAppStore((s) => s.ai.route);
  const quota = useAppStore((s) => s.ai.quota);
  const used = useAppStore((s) => s.ai.used);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [sourceOpen, setSourceOpen] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const askedRef = useRef<string | null>(null);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setTyping(true);
    try {
      const answer = await api.ai.ask(text);
      setMessages((prev) => [...prev, { role: 'ai', kind: answer.kind, text: answer.text }]);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'AI 服务暂不可用', 'alert');
    } finally {
      setTyping(false);
    }
  };

  useEffect(() => {
    if (!open || !prefill || askedRef.current === prefill) return;
    askedRef.current = prefill;
    useUiStore.setState({ aiPrefill: null });
    const timer = window.setTimeout(() => ask(prefill), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  if (!open) return null;

  return (
    <Portal id="overlays">
      <div className="ai-page">
        <div className="ai-head">
          <button className="iconbtn plain" onClick={closeAi} aria-label="返回"><Icon name="left" size={19} /></button>
          <div className="ai-orb"><Icon name="sparkle" size={17} /></div>
          <div className="n"><b>AI 旅行助手</b><span><i />杭州 · 已读取现场信息</span></div>
          <div className="ai-quota"><b>{Math.max(0, quota - used)}</b> / {quota} 次<br /><span style={{ fontSize: 8.5 }}>今日剩余</span></div>
        </div>

        <div className="ai-body" ref={bodyRef}>
          {messages.length === 0 ? (
            <>
              <div className="ai-intro">
                <div className="k">SAT 14:20 · 杭州 · 多云 22°</div>
                <h2>今天下午还有 3 个半小时，走一条不绕路的线？</h2>
                <p>我会读取你的位置、天气和城市里的现场信息，给出可以直接执行的建议，并标注每一条的来源与更新时间。</p>
              </div>
              <div className="ai-ctx">
                <span className="ctx"><Icon name="pin" size={11} />西湖 · 湖滨</span>
                <span className="ctx"><Icon name="sun" size={11} />22° 多云转晴</span>
                <span className="ctx"><Icon name="clock" size={11} />剩余 3h 20m</span>
                <span className="ctx"><Icon name="map" size={11} />已点亮 6 城</span>
              </div>
              <div className="ai-card" style={{ background: 'linear-gradient(140deg,#F6F3E9,#FBFAF4)' }}>
                <div className="hd"><b><Icon name="sparkle" size={14} />今日一条</b><span className="when">刚刚更新</span></div>
                <p style={{ fontSize: 12, lineHeight: 1.7, margin: '0 0 8px', color: 'var(--ink-2)' }}>
                  断桥这会儿人已经散了，但 17:00 之后湖边会起风。<b>建议先去中国美院看展，再回长桥看日落</b>，全程公交 + 步行 6.8 公里。
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="src-chip" onClick={() => setSourceOpen('杭州气象')}><Icon name="shield" size={9} />杭州气象 · 06:00</button>
                  <button className="src-chip" onClick={() => setSourceOpen('公共区域')}><Icon name="pin" size={9} />公共区域 · 陈默 12 分钟前</button>
                </div>
              </div>
            </>
          ) : null}

          {messages.map((m, i) => m.role === 'user' ? (
            <div className="bubble-user" key={i}>{m.text}</div>
          ) : (
            <div className="ai-card" key={i}>
              {m.kind === 'route' ? (
                <>
                  <div className="hd"><b><Icon name="sparkle" size={14} />{route.title}</b><span className="when">{route.total}</span></div>
                  <div className="weather">
                    <Icon name="sun" size={20} />
                    <div><b>{route.weather.desc}</b><br /><span>{route.weather.temp} · 日落 17:32 · 适合步行</span></div>
                  </div>
                  <div className="route">
                    {route.stops.map((st, idx) => (
                      <div className="stop" key={st.name}>
                        <div className="rail"><div className="num">{idx + 1}</div>{idx < route.stops.length - 1 ? <div className="line" /> : null}</div>
                        <div className="c">
                          <div className="t"><b>{st.name}</b><span>{st.time}</span></div>
                          <p>{st.desc}</p>
                          <div className="meta">
                            <span className="walk"><Icon name="route" size={10} />{st.walk}</span>
                            <button className="src-chip" onClick={() => setSourceOpen(st.name)}><Icon name="shield" size={9} />{st.src}</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="unknown"><Icon name="alert" size={12} />{route.unknown}</div>
                </>
              ) : m.kind === 'crowd' ? (
                <>
                  <div className="hd"><b><Icon name="sparkle" size={14} />现在值得去吗</b><span className="when">刚刚更新</span></div>
                  <div className="weather" style={{ background: 'linear-gradient(120deg,#EAF1EF,#F6F2E7)' }}>
                    <Icon name="users" size={19} />
                    <div><b>值得去，但建议 30 分钟内到</b><br /><span>当前在园人数约为周末均值的 38%</span></div>
                  </div>
                  <p style={{ fontSize: 11.5, lineHeight: 1.75, color: 'var(--ink-2)' }}>
                    断桥此刻人流已明显回落；湖滨银泰停车仍满，建议地铁 1 号线到龙翔桥。日落 17:32，长桥公园比雷峰塔更适合看。
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    <button className="src-chip" onClick={() => setSourceOpen('现场反馈')}><Icon name="pin" size={9} />现场反馈 · 12 分钟前</button>
                    <button className="src-chip" onClick={() => setSourceOpen('景区客流')}><Icon name="users" size={9} />景区客流 · 14:00</button>
                  </div>
                  <div className="unknown"><Icon name="alert" size={12} />未能确认：今晚湖滨音乐喷泉是否开放。建议出发前查看景区公告。</div>
                </>
              ) : (
                <>
                  <div className="hd"><b><Icon name="sparkle" size={14} />附近 3 个选择</b><span className="when">步行 15 分钟内</span></div>
                  {[
                    ['弄堂里（湖滨店）', '杭帮菜 · 人均 68', '420m · 步行 6 分钟', '现场等位 12 桌，可线上取号'],
                    ['Cycle & Cycle', '面包咖啡 · 人均 35', '260m · 步行 4 分钟', '现在有位，靠窗可看街景'],
                    ['新白鹿（西湖店）', '杭帮菜 · 人均 55', '850m · 步行 12 分钟', '排队约 25 分钟，建议 17:00 前到'],
                  ].map(([name, tag, dist, note]) => (
                    <div className="food-row" key={name}>
                      <div><b>{name}</b><span>{tag}</span></div>
                      <p>{dist} · {note}</p>
                    </div>
                  ))}
                  <div className="unknown"><Icon name="alert" size={12} />价格来自公开信息，可能已调整；营业时间未能逐一确认。</div>
                </>
              )}
              <div className="ai-actions">
                <button onClick={() => toast('已收藏到「想去」')}><Icon name="bookmark" size={12} />收藏</button>
                <button onClick={() => toast('已加入当天行程 · 可在城市页查看', 'check')}><Icon name="calendar" size={12} />加入行程</button>
                <button onClick={() => toast('已写入今天的回忆盒草稿', 'layers')}><Icon name="layers" size={12} />写进回忆盒</button>
              </div>
              <div className="ai-feedback">
                <span>这个回答有用吗</span>
                <button onClick={() => toast('谢谢，已记录')}>有用</button>
                <button onClick={() => toast('已反馈给质量评估')}>无用</button>
              </div>
            </div>
          ))}

          {typing ? <div className="ai-card" style={{ padding: 0 }}><div className="typing"><i /><i /><i /></div></div> : null}
        </div>

        <div className="quick">
          {QUICK.map((q) => <button key={q} onClick={() => ask(q)}>{q}</button>)}
        </div>

        <div className="ai-input">
          <input
            className="f"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { ask(input); setInput(''); } }}
            placeholder="问点什么，比如「现在去断桥还来得及吗」"
          />
          <button className="go" onClick={() => { ask(input); setInput(''); }} aria-label="发送"><Icon name="send" size={18} /></button>
        </div>

        <Sheet open={!!sourceOpen} onClose={() => setSourceOpen(null)} title="来源与更新时间" sub={sourceOpen ?? ''}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['杭州市气象台', '官方气象数据 · 今日 06:00 更新', '晴转多云，日落 17:32，东南风 2 级'],
              ['西湖景区客流', '景区公开数据 · 14:00 更新', '当前在园 1.8 万人，约为周末均值 38%'],
              ['公共区域 · 陈默', '现场发布 · 12 分钟前 · 现场标识', '断桥这会儿人已经散了，湖边风大'],
            ].map(([title, meta, desc]) => (
              <div className="source-card" key={title}>
                <div><b>{title}</b><span>已核验</span></div>
                <small>{meta}</small>
                <p>{desc}</p>
              </div>
            ))}
          </div>
          <p className="hint" style={{ margin: '12px 3px 0' }}>AI 只汇总来源明确的信息；无法确认时会明确提示，不编造营业时间与价格。</p>
        </Sheet>
      </div>
    </Portal>
  );
}
