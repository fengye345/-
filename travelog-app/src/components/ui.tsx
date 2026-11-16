import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function Avatar({
  initial,
  hue = 'a1',
  size = 40,
  radius,
  style,
}: {
  initial: string;
  hue?: string;
  size?: number;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`avatar ${hue}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.36)),
        borderRadius: radius ?? size / 2,
        ...style,
      }}
    >
      {initial}
    </span>
  );
}

export function Badge({
  children,
  tone = '',
  dot = false,
}: {
  children: ReactNode;
  tone?: 'live' | 'draft' | 'solid' | 'clay' | 'glass' | 'on' | '';
  dot?: boolean;
}) {
  return (
    <span className={`badge ${tone}`}>
      {dot ? <span className="dot" /> : null}
      {children}
    </span>
  );
}

export function Chip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={`chip${active ? ' on' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <span className="switch">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <i />
    </span>
  );
}

export function SectionTitle({ title, extra }: { title: string; extra?: ReactNode }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {extra ? <span className="more">{extra}</span> : null}
    </div>
  );
}

export function Empty({
  icon = 'layers',
  title,
  text,
}: {
  icon?: IconName;
  title: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <div className="ic">
        <Icon name={icon} size={24} />
      </div>
      <b>{title}</b>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

export function Ring({
  value,
  size = 30,
  stroke = 2.5,
  color = '#E4C98B',
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, value)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
      <circle
        className="ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c.toFixed(1)}
        strokeDashoffset={offset.toFixed(1)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
