/* ============================================================
   通用 UI：图标、弹层、Toast、点亮动画
   ============================================================ */
(function () {
  const ICONS = {
    map: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z"/><path d="M9 4v13M15 6.5v13"/>',
    layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.6-3.4 2.8-5 5.5-5s4.9 1.6 5.5 5"/><path d="M16 5.6a3 3 0 0 1 0 5.8M17.4 15.6c2 .5 3.2 2 3.6 4.4"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c1-4 4-5.6 7.5-5.6s6.5 1.6 7.5 5.6"/>',
    sparkle: '<path d="M12 3.2 13.7 8 18.5 9.7 13.7 11.5 12 16.3 10.3 11.5 5.5 9.7 10.3 8 12 3.2Z"/><path d="M18.5 16.2 19.2 18l1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.2 1.5 5.2h-15S6 13 6 9Z"/><path d="M10 18a2 2 0 0 0 4 0"/>',
    locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    down: '<path d="m5 9 7 7 7-7"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-9.5A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 3.5C19.5 15.4 12 20 12 20Z"/>',
    message: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L4 20l1.2-4.4A8.4 8.4 0 1 1 21 11.5Z"/>',
    bookmark: '<path d="M6 4h12v16l-6-4-6 4V4Z"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z"/><circle cx="12" cy="13" r="3.2"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 16 5-4 4 3 3-2 4 3"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2.4"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="m9 12 2 2 4-4"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h10l-1.5 3L15 10H5"/>',
    send: '<path d="m4 12 16-8-5 16-3-6-8-2Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z"/><circle cx="12" cy="11" r="2.2"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2.4"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    cloud: '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.2A3.4 3.4 0 0 1 17 18H7Z"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    export: '<path d="M12 15V4M8 8l4-4 4 4M5 14v5h14v-5"/>',
    link: '<path d="m9.5 14.5 5-5"/><path d="M7 17a4 4 0 0 1 0-5.7l2-2M17 7a4 4 0 0 1 0 5.7l-2 2"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/>',
    eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    star: '<path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8L12 3Z"/>',
    phone: '<path d="M6 3h4l1.5 4.2-2 1.5a12 12 0 0 0 6 6l1.5-2L21 14v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z"/>',
    settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16v4Z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4M5 13v6h14v-6"/>',
    alert: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.2v.2"/>',
    route: '<circle cx="6" cy="16" r="2.6"/><circle cx="18" cy="8" r="2.6"/><path d="M6 13.4V9a3 3 0 0 1 3-3h3.5M18 10.6V15a3 3 0 0 1-3 3h-3.5"/>',
    walk: '<circle cx="13" cy="4.6" r="1.8"/><path d="m10 21 2.2-5.2L10 13l1.7-4.6 3 2.2 3 1.2M12.2 15.8 15 18l.6 3"/>',
    wifi: '<path d="M2.5 8.5a14 14 0 0 1 19 0M5.5 12a9.6 9.6 0 0 1 13 0M9 15.5a4.6 4.6 0 0 1 6 0"/><circle cx="12" cy="19" r="1"/>',
    expand: '<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>',
    download: '<path d="M12 4v11M8 11l4 4 4-4M5 20h14"/>',
    undo: '<path d="M9 7 4 12l5 5"/><path d="M4 12h9a6 6 0 0 1 0 12"/>',
    qr: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h3v3h-3zM20 14v6h-6"/>',
    wechat: '<path d="M9 4a6.5 6.5 0 0 0-6.5 6.4c0 2 1 3.7 2.6 4.9l-.7 2.5 2.8-1.3c.6.2 1.2.3 1.8.3"/><path d="M21 13.2a5.6 5.6 0 0 0-9.4-3.9 5.6 5.6 0 0 0 1 8.6L12 20.5l2.4-1.1c.5.1 1 .2 1.6.2a5.6 5.6 0 0 0 5-6.4Z"/>',
    apple: '<path d="M15.5 3.5c-1 .1-2.2.8-2.9 1.7-.6.8-1.1 2-1 3.1 1.1.1 2.3-.6 3-1.5.7-.9 1-2 1-3.3Z"/><path d="M18.6 12.5c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.1-1.7-1.3-.1-2.4.7-3 .7-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.9-3.4 2.2-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7 1.1 0 1.9-1 2.6-2 .8-1.2 1.1-2.4 1.1-2.5-.1 0-2.4-.9-2.4-2.8Z"/>',
  };

  const UI = {
    icon(name, size = 18, extra = '') {
      const p = ICONS[name] || ICONS.sparkle;
      return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
    },
    iconFilled(name, size = 18) {
      return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
    },
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    el(html) {
      const t = document.createElement('template');
      t.innerHTML = html.trim();
      return t.content.firstElementChild;
    },
    toast(msg, icon = 'check') {
      const layer = document.getElementById('toasts');
      if (!layer) return;
      const node = this.el(`<div class="toast">${this.icon(icon, 15)}<span>${msg}</span></div>`);
      layer.appendChild(node);
      setTimeout(() => {
        node.classList.add('out');
        setTimeout(() => node.remove(), 260);
      }, 2300);
    },
    vibrate(ms) { if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } },

    closeSheet() {
      const layer = document.querySelector('.sheet-layer, .match-screen');
      if (layer) layer.remove();
    },

    sheet(opts) {
      this.closeSheet();
      const { title = '', sub = '', body = '', footer = '', tall = false, onMount = null, dismissible = true, className = '' } = opts;
      const layer = this.el(`<div class="sheet-layer">
        <div class="sheet-backdrop"></div>
        <section class="sheet ${tall ? 'tall' : ''} ${className}" role="dialog" aria-modal="true">
          <div class="sheet-grab"></div>
          <div class="sheet-head">
            <div><h3>${title}</h3>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
            <button class="sheet-close" aria-label="关闭">${this.icon('close', 15)}</button>
          </div>
          <div class="sheet-body">${body}</div>
          ${footer ? `<div class="sheet-foot">${footer}</div>` : ''}
        </section>
      </div>`);
      const backdrop = layer.querySelector('.sheet-backdrop');
      const close = () => { layer.remove(); document.removeEventListener('keydown', onKey); };
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      backdrop.addEventListener('click', () => { if (dismissible) close(); });
      layer.querySelector('.sheet-close').addEventListener('click', close);
      document.addEventListener('keydown', onKey);
      document.getElementById('overlays').appendChild(layer);
      if (onMount) onMount(layer, close);
      return close;
    },

    confirm({ title, text, ok = '确认', cancel = '取消', danger = false }) {
      return new Promise((resolve) => {
        const close = this.sheet({
          title,
          body: `<p style="font-size:12.5px;line-height:1.75;color:var(--ink-2);margin:4px 2px 6px">${text}</p>`,
          footer: `<div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn ghost" data-c style="flex:1">${cancel}</button>
            <button class="btn ${danger ? 'clay' : 'primary'}" data-ok style="flex:1">${ok}</button>
          </div>`,
          onMount(layer, done) {
            layer.querySelector('[data-c]').onclick = () => { done(); resolve(false); };
            layer.querySelector('[data-ok]').onclick = () => { done(); resolve(true); };
          },
        });
        void close;
      });
    },

    lightUp({ city, province, visits, days, first, onDone }) {
      const sparks = Array.from({ length: 14 }).map((_, i) => {
        const ang = (i / 14) * Math.PI * 2;
        const dist = 90 + Math.random() * 90;
        const dx = Math.cos(ang) * dist;
        const dy = Math.sin(ang) * dist;
        return `<i class="spark" style="left:50%;top:50%;width:${2 + Math.random() * 4}px;height:${2 + Math.random() * 4}px;--dx:${dx}px;--dy:${dy}px;animation-delay:${Math.random() * 2.4}s"></i>`;
      }).join('');
      const node = this.el(`<div class="lightup">
        <div class="rings"><i></i><i></i><i></i><i></i></div>
        <div class="halo"></div>
        ${sparks}
        <div class="lu-content">
          <div class="lu-kicker">TRAVELOG · 城市点亮</div>
          <h2 class="lu-city">${this.esc(city)}</h2>
          <div class="lu-sub">${this.esc(province)} · 第 ${visits} 次到访</div>
          <div class="lu-stats">
            <div><b>${visits}</b><span>到访次数</span></div>
            <div><b>${days}</b><span>累计天数</span></div>
            <div><b>${first || '今天'}</b><span>首次点亮</span></div>
          </div>
          <button class="lu-btn" data-ok>收下这张城市卡</button>
        </div>
      </div>`);
      node.querySelector('[data-ok]').onclick = () => {
        node.style.transition = 'opacity .35s';
        node.style.opacity = '0';
        setTimeout(() => { node.remove(); onDone && onDone(); }, 320);
      };
      document.getElementById('overlays').appendChild(node);
      this.vibrate(30);
    },

    ring(pct, size = 34, stroke = 3) {
      const r = (size - stroke) / 2;
      const c = 2 * Math.PI * r;
      const off = c * (1 - Math.min(1, Math.max(0, pct)));
      return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
        <circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"
          stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      </svg>`;
    },
  };

  window.UI = UI;
})();
