import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useUiStore } from '../store/uiStore';
import { api, ApiError } from '../api';
import { Icon } from '../components/Icon';
import { Portal } from '../components/Portal';
import { useToast } from '../components/Toast';

type Msg =
  | { role: 'user'; text: string }
  | { role: 'ai'; text: string };

const QUICK = ['今天适合去哪里', '帮我看看天气', '附近有什么吃的', '怎么安排半天'];

export function AiSheet() {
  const open = useUiStore((s) => s.aiOpen);
  const prefill = useUiStore((s) => s.aiPrefill);
  const closeAi = useUiStore((s) => s.closeAi);
  const toast = useToast();
  const currentCity = useAppStore((s) => s.currentCity);
  const cities = useAppStore((s) => s.cities);
  const quota = useAppStore((s) => s.ai.quota);
  const used = useAppStore((s) => s.ai.used);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const askedRef = useRef<string | null>(null);
  const litCount = Object.values(cities).filter((c) => c.lit).length;

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setTyping(true);
    try {
      const answer = await api.ai.ask(text);
      setMessages((prev) => [...prev, { role: 'ai', text: answer.text }]);
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
          <div className="n">
            <b>AI 旅行助手</b>
            <span><i />{currentCity || '未选择城市'} · 未接入实时数据</span>
          </div>
          <div className="ai-quota"><b>{Math.max(0, quota - used)}</b> / {quota} 次<br /><span style={{ fontSize: 8.5 }}>今日剩余</span></div>
        </div>

        <div className="ai-body" ref={bodyRef}>
          {messages.length === 0 ? (
            <>
              <div className="ai-intro">
                <div className="k">TRAVELOG AI · 当前为原型</div>
                <h2>想问点什么？</h2>
                <p>AI 还没有接入实时天气、客流和营业数据。为了避免用假数据演示，它不会生成虚构路线，也不会编造餐厅和现场情况。</p>
              </div>
              <div className="ai-ctx">
                <span className="ctx"><Icon name="pin" size={11} />{currentCity || '未选择城市'}</span>
                <span className="ctx"><Icon name="map" size={11} />已点亮 {litCount} 城</span>
                <span className="ctx"><Icon name="alert" size={11} />实时数据未接入</span>
              </div>
            </>
          ) : null}

          {messages.map((m, i) => m.role === 'user' ? (
            <div className="bubble-user" key={i}>{m.text}</div>
          ) : (
            <div className="ai-card" key={i}>
              <div className="hd"><b><Icon name="sparkle" size={14} />AI 旅行助手</b><span className="when">原型回答</span></div>
              <p style={{ fontSize: 12, lineHeight: 1.75, color: 'var(--ink-2)', margin: 0 }}>{m.text}</p>
              <div className="unknown"><Icon name="alert" size={12} />没有实时天气、客流或营业数据，因此不提供具体地点与时间建议。</div>
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
            placeholder="问一个关于这次旅行的问题"
          />
          <button className="go" onClick={() => { ask(input); setInput(''); }} aria-label="发送"><Icon name="send" size={18} /></button>
        </div>
      </div>
    </Portal>
  );
}
