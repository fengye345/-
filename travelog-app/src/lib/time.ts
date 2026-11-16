export const TTL_MINUTES: Record<string, number> = {
  now: 6 * 60,
  today: 24 * 60,
  long: 30 * 24 * 60,
};

export function postRemaining(type: string, ago: number): number {
  const ttl = TTL_MINUTES[type] ?? TTL_MINUTES.now;
  return ttl - ago;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '已过期';
  if (minutes < 60) return `${Math.round(minutes)} 分钟后过期`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `剩余 ${h} 小时${m ? ` ${m} 分` : ''}`;
}

export function relativeTime(minutes: number): string {
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${Math.round(minutes)} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  return `${Math.floor(minutes / 1440)} 天前`;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '已结束';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
