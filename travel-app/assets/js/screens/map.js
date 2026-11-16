/* ============================================================
   地图首页：全国地图 / 本城地图 / 点亮 / 城市卡
   ============================================================ */
(function () {
  const App = (window.App = window.App || {});

  const LABEL_OFFSET = {
    '杭州': [-10, -8, 'end'], '上海': [10, 14], '北京': [9, -2], '成都': [-8, -7, 'end'],
    '大理': [-7, 11, 'end'], '厦门': [8, 4], '苏州': [8, -3], '重庆': [-8, 3, 'end'],
  };

  function chinaMap(state) {
    const geo = window.CHINA_GEO;
    const lit = new Set(Object.entries(state.cities).filter(([, c]) => c.lit).map(([n]) => n));
    const litProvinces = new Set();
    Object.entries(state.cities).forEach(([n, c]) => { if (c.lit && c.province) litProvinces.add(c.province); });

    const paths = geo.provinces.map((p) => {
      const isLit = litProvinces.has(p.n);
      const isDeep = isLit && Object.entries(state.cities).some(([n, c]) => c.lit && c.province === p.n && c.deep);
      return `<path class="prov${isLit ? ' lit' : ''}${isDeep ? ' deep' : ''}" d="${p.d}" data-prov="${UI.esc(p.n)}"></path>`;
    }).join('');

    const dots = geo.cities.filter((c) => lit.has(c.n)).map((c) => {
      const meta = state.cities[c.n];
      const off = LABEL_OFFSET[c.n] || [7, 3];
      const anchor = off[2] ? ` text-anchor="${off[2]}"` : '';
      const isCurrent = c.n === state.currentCity;
      return `${isCurrent ? `<circle class="city-halo" cx="${c.x}" cy="${c.y}" r="6"/>` : ''}
        <circle class="city-dot${meta.deep ? ' deep' : ''}" cx="${c.x}" cy="${c.y}" r="${meta.deep ? 4.2 : 3.4}"/>
        <text class="city-name${meta.deep ? ' deep' : ''}" x="${c.x + off[0]}" y="${c.y + off[1]}"${anchor}>${UI.esc(c.n)}</text>`;
    }).join('');

    const faint = ['西安', '广州', '武汉', '青岛', '昆明', '拉萨'].map((n) => {
      const c = geo.cities.find((x) => x.n === n);
      return c ? `<circle cx="${c.x}" cy="${c.y}" r="1.8" fill="#C3BCAB"/>` : '';
    }).join('');

    return `<svg class="china-map" viewBox="0 0 ${geo.w} ${geo.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="中国城市点亮地图">
      <defs>
        <linearGradient id="litGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#BFD8C8"/><stop offset="100%" stop-color="#9CC4AF"/>
        </linearGradient>
        <linearGradient id="deepGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#A9CBB8"/><stop offset="100%" stop-color="#7FB198"/>
        </linearGradient>
      </defs>
      ${paths}
      ${faint}
      ${dots}
      <g transform="translate(600,455)">
        <rect class="inset-frame" width="92" height="92" rx="7"></rect>
        <path d="M20 24c10 14 8 26 16 38s16 12 22 22" fill="none" stroke="#B9B2A1" stroke-width="1.2" stroke-dasharray="3 5" stroke-linecap="round" opacity=".85"/>
        ${[[30, 22], [36, 42], [33, 62], [46, 70], [58, 54], [62, 78]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#C6BFAE"/>`).join('')}
        <text class="inset-label" x="46" y="86" text-anchor="middle">南海诸岛</text>
      </g>
    </svg>`;
  }

  function cityMap(state) {
    return `<svg viewBox="0 0 360 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="杭州本城地图">
      <rect width="360" height="400" fill="#F2EEE3"/>
      <g fill="#E9E4D6" stroke="#E1DBCB" stroke-width=".5">
        ${[[18,20,54,38],[80,20,46,38],[146,18,58,40],[210,18,52,40],[272,20,70,38],
           [18,66,40,32],[64,64,44,34],[116,64,46,34],[212,64,52,34],[270,64,72,34],
           [16,108,34,30],[252,108,44,30],[300,108,44,30],
           [300,152,44,30],[298,194,46,32],[296,236,48,34],[296,278,46,32],
           [20,300,48,34],[76,300,52,36],[136,302,46,34],[190,300,54,34],[252,300,40,32]]
          .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`).join('')}
      </g>
      <path class="cm-park" d="M206 118c18-8 40-2 50 12s4 34-12 40-38-2-46-18 0-28 8-34Z"/>
      <path class="cm-park" d="M30 330c22-14 54-10 66 8s2 38-20 44-58-4-62-22 6-24 16-30Z" opacity=".8"/>
      <path class="cm-water" d="M44 122c22-14 58-12 76 4 14 12 12 32 0 44-14 14-38 10-52 22-12 10-30 8-38-4-10-14 0-30 6-40 5-9 3-20 8-26Z"/>
      <path class="cm-water" d="M0 318c60-10 96 8 150 10s96-14 150-4 60 2 60 2v74H0Z" opacity=".9"/>
      <g class="cm-road main"><path d="M-10 96c60 22 96-6 150 4s110 34 230 18"/><path d="M192 -10c-6 60 16 96 8 150s-22 96-8 270"/></g>
      <g class="cm-road"><path d="M-10 176c70 6 110-12 160-4s100 24 220 10"/><path d="M-10 252c80-8 120 14 180 10s110-16 200-6"/><path d="M96 -10c10 60-8 100-2 150s18 100 10 270"/><path d="M268 -10c-8 70 6 110 0 170s-6 180 2 250"/></g>
      <g class="cm-road sec" opacity=".85"><path d="M-10 60h380M-10 148h380M-10 214h380M-10 292h380M60 -10v420M148 -10v420M226 -10v420M320 -10v420"/></g>
      <ellipse cx="120" cy="168" rx="66" ry="54" fill="none" stroke="#FBF8F0" stroke-width="4" opacity=".9"/>
      <text class="cm-label" x="66" y="164">西 湖</text>
      <text class="cm-label" x="238" y="350" fill="#8FA9AD">钱 塘 江</text>
      <text class="cm-label" x="210" y="40">武林门</text>
      <text class="cm-label" x="286" y="120">钱江新城</text>

      <g class="cm-pin" data-poi="灵隐寺"><circle class="halo" cx="104" cy="92" r="12"/><circle class="core" cx="104" cy="92" r="5"/><text x="104" y="78" text-anchor="middle">灵隐寺</text></g>
      <g class="cm-pin" data-poi="断桥残雪"><circle class="halo" cx="150" cy="130" r="11"/><circle class="core" cx="150" cy="130" r="4.6"/><text x="172" y="128">断桥</text></g>
      <g class="cm-pin" data-poi="河坊街"><circle class="halo" cx="168" cy="222" r="11"/><circle class="core" cx="168" cy="222" r="4.6"/><text x="186" y="226">河坊街</text></g>
      <g class="cm-pin" data-poi="龙井村"><circle class="halo" cx="82" cy="212" r="11"/><circle class="core" cx="82" cy="212" r="4.6"/><text x="60" y="238" text-anchor="middle">龙井村</text></g>
      <g class="cm-pin" data-poi="中国美院象山校区"><circle class="halo" cx="238" cy="272" r="11"/><circle class="core" cx="238" cy="272" r="4.6"/><text x="238" y="292" text-anchor="middle">中国美院</text></g>
      <circle class="cm-me-halo" cx="182" cy="200" r="15"/>
      <circle class="cm-me" cx="182" cy="200" r="5"/>
    </svg>`;
  }

  const POIS = {
    '断桥残雪': { sub: '西湖景区 · 距你 320m', text: '此刻有 4 条现场信息：人流已散、湖面起风、北山街可停车。' },
    '灵隐寺': { sub: '灵隐景区 · 距你 2.1km', text: '今日 17:00 停止入场；飞来峰正常开放，排队约 25 分钟。' },
    '河坊街': { sub: '清河坊 · 距你 480m', text: '晚市 17:30 开始，当前人流适中。3 家老字号今日营业至 21:00。' },
    '龙井村': { sub: '西湖景区 · 距你 2.8km', text: '茶室炒茶体验下午 3 点最后一锅，人均 80，无需预约。' },
    '中国美院象山校区': { sub: '转塘 · 距你 5.2km', text: '今日有毕业展，免费，现场登记即可进入。' },
  };

  const MapScreen = {
    view: 'china',
    poi: null,

    render() {
      const s = Store.state;
      const cur = Store.current();
      const lit = !!cur.lit;
      const pending = s.pendingArrival;
      const visits = Store.litCount();
      const provPct = Store.provinceProgress();
      const cityRecord = Store.current();
      const meta = cityRecord.province ? cityRecord : { province: '浙江省', visits: 4, days: 11 };

      const panel = lit ? `
        <div class="city-panel" data-action="city-card">
          <div class="city-panel-in">
            <div class="cp-top">
              <div>
                <div class="cp-kicker"><i></i>CURRENT CITY · ${UI.esc(meta.province || '浙江省')}</div>
                <div class="cp-city"><b>${UI.esc(s.currentCity)}</b><span>已点亮 · 第 ${meta.visits || 1} 次到访</span></div>
              </div>
              <div class="cp-arrow">${UI.icon('right', 15)}</div>
            </div>
            <div class="cp-stats">
              <div class="cp-stat"><b>${meta.visits || 1}</b><span>到访次数</span></div>
              <div class="cp-stat"><b>${meta.days || 1}</b><span>累计天数</span></div>
              <div class="cp-stat"><b>${s.boxes.filter((b) => b.city === s.currentCity).length}</b><span>回忆盒</span></div>
            </div>
            <div class="cp-progress">
              ${UI.ring(1, 30, 2.5)}
              <div class="t"><b>本次停留 47 分钟</b><span>定位精度 38m · 已记入第 4 次到访</span></div>
              <button class="go" data-action="city-card">查看城市卡</button>
            </div>
          </div>
        </div>` : `
        <div class="city-panel" data-action="lightup">
          <div class="city-panel-in">
            <div class="cp-top">
              <div>
                <div class="cp-kicker"><i></i>ARRIVING · ${UI.esc(pending ? (window.CITY_META[pending.city] || {}).province || '浙江省' : '浙江省')}</div>
                <div class="cp-city"><b>${UI.esc(s.currentCity)}</b><span>正在记录这次到达</span></div>
              </div>
              <div class="cp-arrow" style="background:rgba(228,201,139,.16);border-color:rgba(228,201,139,.3)">${UI.icon('locate', 15)}</div>
            </div>
            <div class="cp-stats">
              <div class="cp-stat"><b>${pending ? pending.minutes : 32}<small style="font-size:9px;opacity:.6"> 分</small></b><span>本次停留</span></div>
              <div class="cp-stat"><b>${pending ? pending.points : 3}<small style="font-size:9px;opacity:.6"> 个</small></b><span>有效定位点</span></div>
              <div class="cp-stat"><b>${pending ? pending.accuracy : 38}<small style="font-size:9px;opacity:.6"> m</small></b><span>定位精度</span></div>
            </div>
            <div class="cp-progress">
              ${UI.ring(1, 30, 2.5)}
              <div class="t"><b>已满足点亮条件</b><span>30 分钟 + 2 个定位点 · 间隔 ≥ 10 分钟</span></div>
              <button class="go" data-action="lightup">点亮它</button>
            </div>
          </div>
        </div>`;

      return `<div class="map-screen">
        <div class="map-stage">
          <div class="map-top">
            <div class="glass-pill" data-action="city-card">
              ${UI.icon('pin', 15)} ${UI.esc(s.currentCity)}
              <span class="dot"></span>
              <span style="font-weight:500;color:var(--muted);font-size:10.5px">${lit ? '已点亮' : '记录中'}</span>
            </div>
            <div style="display:flex;gap:7px">
              <button class="iconbtn" data-action="city-search" aria-label="搜索城市">${UI.icon('search', 18)}</button>
              <button class="iconbtn" data-action="notifications" aria-label="通知">
                ${UI.icon('bell', 18)}
                ${Store.unread() ? `<i style="position:absolute;top:8px;right:9px;width:6px;height:6px;border-radius:50%;background:var(--clay);box-shadow:0 0 0 2px rgba(244,241,233,.9)"></i>` : ''}
              </button>
              <button class="iconbtn" data-action="map-more" aria-label="更多">${UI.icon('more', 18)}</button>
            </div>
          </div>

          <div class="map-seg" role="tablist">
            <button class="${this.view === 'china' ? 'on' : ''}" data-view="china">全国</button>
            <button class="${this.view === 'city' ? 'on' : ''}" data-view="city">本城</button>
          </div>

          <div class="map-tools">
            <button class="iconbtn" data-action="locate" aria-label="定位">${UI.icon('locate', 18)}</button>
            <button class="iconbtn" data-action="map-layers" aria-label="图层">${UI.icon('layers', 18)}</button>
            <button class="iconbtn" data-action="cheat" aria-label="定位安全">${UI.icon('shield', 18)}</button>
          </div>

          <div class="map-canvas">
            ${this.view === 'china' ? chinaMap(s) : cityMap(s)}
          </div>

          <div class="map-stats">
            <div class="n">${visits}<small>座城市</small></div>
            <div class="l">省级完成度 ${provPct}% · 共 34 个省级行政区</div>
            <div class="bar"><i style="width:${Math.max(4, provPct)}%"></i></div>
          </div>

          ${this.poi ? `<div class="poi-peek">
            <div class="row">${UI.icon('pin', 14)}<h4>${UI.esc(this.poi)}</h4>
              <span class="badge live" style="margin-left:auto"><span class="dot"></span>现场 4</span></div>
            <p>${UI.esc(POIS[this.poi].sub)} · ${UI.esc(POIS[this.poi].text)}</p>
            <div class="acts">
              <button class="btn sm primary" data-action="poi-ai" style="flex:1">${UI.icon('sparkle', 14)}让 AI 安排</button>
              <button class="btn sm ghost" data-action="poi-publish">在这发布</button>
            </div>
          </div>` : ''}

          <button class="fab ai" style="right:14px;bottom:14px;height:42px" data-action="ai" aria-label="AI 助手">
            ${UI.icon('sparkle', 16)}<span style="font-size:11.5px">AI 助手</span>
          </button>
        </div>

        <div class="map-bottom">${panel}</div>
      </div>`;
    },

    mount(root) {
      root.querySelectorAll('[data-view]').forEach((b) => {
        b.onclick = () => { this.view = b.dataset.view; this.poi = null; App.rerender(); };
      });
      root.querySelectorAll('[data-poi]').forEach((g) => {
        g.onclick = () => { this.poi = g.dataset.poi; App.rerender(); };
      });
      root.addEventListener('click', (e) => {
        const node = e.target.closest('[data-action]');
        if (!node || !root.contains(node)) return;
        const a = node.dataset.action;
        if (a === 'lightup') this.doLightUp();
        else if (a === 'city-card') this.openCityCard();
        else if (a === 'city-search') App.openCitySearch();
        else if (a === 'notifications') App.openNotifications();
        else if (a === 'ai' || a === 'poi-ai') App.openAI(this.poi ? `帮我安排 ${this.poi} 附近的 2 小时` : null);
        else if (a === 'poi-publish') App.openPublish({ place: this.poi });
        else if (a === 'locate') {
          UI.toast('已定位：杭州市西湖区 · 精度 38m', 'locate');
        } else if (a === 'map-layers') this.openLayers();
        else if (a === 'map-more') this.openMore();
        else if (a === 'cheat') this.openCheat();
      });
    },

    doLightUp() {
      const s = Store.state;
      if (s.cities[s.currentCity] && s.cities[s.currentCity].lit) {
        UI.toast('该城市已点亮，不会重复点亮'); return;
      }
      Store.lightUp(s.currentCity);
      const rec = Store.state.cities[s.currentCity];
      UI.lightUp({
        city: s.currentCity,
        province: rec.province || '浙江省',
        visits: rec.visits || 1,
        days: rec.days || 1,
        first: '今天',
        onDone: () => { App.rerender(); UI.toast('城市卡已收进你的地图', 'check'); },
      });
    },

    openCityCard(cityName) {
      const s = Store.state;
      const city = cityName || s.currentCity;
      const meta = s.cities[city] || (window.CITY_INDEX || []).find((x) => x.n === city) || {};
      const rec = s.cities[city] || { province: meta.p || '—', visits: 1, days: 1, first: '—', last: '—' };
      const boxes = s.boxes.filter((b) => b.city === city);
      UI.sheet({
        title: `${city} · 城市卡`,
        sub: `${rec.province || '浙江省'} · ${rec.deep ? '深度点亮' : '已点亮'}`,
        body: `<div style="border-radius:18px;overflow:hidden;background:linear-gradient(150deg,#15453A,#0B2A22);color:#F7F2E4;padding:18px;position:relative;margin-bottom:14px">
          <div style="font-size:9px;letter-spacing:.2em;color:#D8B96F">TRAVELOG CITY CARD</div>
          <div style="font-family:var(--serif);font-size:34px;letter-spacing:.12em;margin:8px 0 2px">${UI.esc(city)}</div>
          <div style="font-size:10.5px;color:rgba(247,242,228,.6)">首次到访 ${UI.esc(rec.first || '—')} · 最近 ${UI.esc(rec.last || '—')}</div>
          <div style="display:flex;gap:22px;margin-top:16px">
            <div><b style="font-size:17px">${rec.visits || 1}</b><div style="font-size:9px;color:rgba(247,242,228,.5)">到访次数</div></div>
            <div><b style="font-size:17px">${rec.days || 1}</b><div style="font-size:9px;color:rgba(247,242,228,.5)">累计天数</div></div>
            <div><b style="font-size:17px">${boxes.length}</b><div style="font-size:9px;color:rgba(247,242,228,.5)">回忆盒</div></div>
          </div>
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.12);font-size:10.5px;color:rgba(247,242,228,.65);line-height:1.6">“秋天的西湖，风把桂花吹到了北山街。”</div>
        </div>
        <div class="section-title" style="padding:0;margin:4px 0 8px"><h2>到访记录</h2><span class="hint">仅本人可见</span></div>
        <div style="border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fff">
          ${[['2026.10.18', '本次 · 进行中', '自动点亮'], ['2026.04.12', '停留 2 天 · 已结束', '自动点亮'], ['2025.10.03', '停留 3 天 · 已结束', '自动点亮']].map((r, i) => `
            <div style="display:flex;align-items:center;padding:11px 13px;${i < 2 ? 'border-bottom:1px solid var(--line-2)' : ''}">
              <div><div style="font-size:12px;font-weight:600">${r[0]}</div><div style="font-size:9.5px;color:var(--muted);margin-top:2px">${r[1]}</div></div>
              <span style="margin-left:auto;font-size:9px;color:var(--jade);background:var(--jade-wash);padding:2px 6px;border-radius:5px">${r[2]}</span>
            </div>`).join('')}
        </div>
        <p class="hint" style="margin:10px 2px 0">分享城市卡时不包含精确到访点、同行人和原始轨迹。</p>`,
        footer: `<div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn ghost" style="flex:1" data-share>${UI.icon('share', 16)}分享城市卡</button>
          <button class="btn primary" style="flex:1" data-box>${UI.icon('layers', 16)}进入回忆盒</button>
        </div>`,
        onMount(layer, close) {
          layer.querySelector('[data-share]').onclick = () => {
            UI.toast('已生成分享图 · 精确到访点已隐藏', 'share');
          };
          layer.querySelector('[data-box]').onclick = () => { close(); location.hash = '#/memory'; };
        },
      });
    },

    openLayers() {
      UI.sheet({
        title: '地图图层',
        sub: '演示用的图层开关',
        body: `<div class="menu" style="margin:0">
          ${[['点亮城市', true], ['省份完成度', true], ['此刻现场', true], ['我的轨迹', false]].map(([t, on]) => `
            <label class="mrow"><span class="ic">${UI.icon('layers', 15)}</span><span class="t">${t}</span>
              <span class="r"><span class="switch"><input type="checkbox" ${on ? 'checked' : ''}><i></i></span></span></label>`).join('')}
        </div>
        <p class="hint" style="margin:12px 3px 0">轨迹图层默认关闭：产品不对外展示或售卖用户的历史轨迹与精确位置。</p>`,
      });
    },

    openMore() {
      UI.sheet({
        title: '地图设置',
        body: `<div class="menu" style="margin:0">
          ${[['eye', '地图可见性', '关闭后他人看不到你的点亮地图', 'mapVisible'],
             ['locate', '自动点亮', '进入新城市并满足停留规则时自动点亮', 'autoLight'],
             ['shield', '精确定位', '仅用于停留判定，7 天后降精度', 'precise']]
            .map(([ic, t, d, key]) => `
            <label class="mrow" style="cursor:pointer">
              <span class="ic">${UI.icon(ic, 15)}</span>
              <span class="t">${t}<span>${d}</span></span>
              <span class="r"><span class="switch"><input type="checkbox" data-set="${key}" ${Store.state.settings[key] ? 'checked' : ''}><i></i></span></span>
            </label>`).join('')}
        </div>
        <p class="hint" style="margin:12px 4px 0">原始定位点只用于停留判定，保留 7 天后降精度为城市级。关闭自动点亮后仍可手动补录。</p>`,
        onMount(layer) {
          layer.querySelectorAll('[data-set]').forEach((inp) => {
            inp.onchange = () => { Store.toggle(inp.dataset.set, inp.checked); UI.toast('设置已更新'); };
          });
        },
      });
    },

    openCheat() {
      UI.sheet({
        title: '定位安全检测',
        sub: 'AC-02 · 模拟定位与异常跳跃',
        body: `<div style="display:flex;gap:11px;padding:12px;border-radius:14px;background:var(--jade-wash);margin-bottom:12px">
          ${UI.icon('shield', 20)}
          <div style="font-size:11px;line-height:1.65;color:#2C4A3E">服务端会同时校验模拟定位、越狱 / root 状态和位置跳跃速度。可疑记录不进入公共展示，转入人工复核。</div>
        </div>
        <div class="menu" style="margin:0">
          <div class="mrow"><span class="ic">${UI.icon('check', 15)}</span><span class="t">当前设备环境<span>未检测到越狱 / root · 定位来源为系统</span></span><span class="r" style="color:var(--jade)">正常</span></div>
          <div class="mrow"><span class="ic">${UI.icon('clock', 15)}</span><span class="t">近 7 天异常事件<span>1 次位置跳跃，已自动忽略</span></span><span class="r">查看</span></div>
        </div>
        <p class="hint" style="margin:12px 4px 0">演示：模拟一次异常定位，观察点亮流程如何被拦截。</p>`,
        footer: `<button class="btn ghost block" data-sim style="margin-top:12px">${UI.icon('alert', 16)}模拟异常定位</button>`,
        onMount(layer, close) {
          layer.querySelector('[data-sim]').onclick = () => {
            close();
            Store.cheatAttempt();
            UI.sheet({
              title: '未点亮：定位异常',
              body: `<div style="text-align:center;padding:8px 6px 2px">
                <div style="width:56px;height:56px;border-radius:50%;background:var(--clay-wash);color:var(--clay);display:grid;place-items:center;margin:0 auto 14px">${UI.icon('alert', 26)}</div>
                <div style="font-size:14px;font-weight:650;margin-bottom:6px">检测到模拟定位</div>
                <p style="font-size:11.5px;line-height:1.75;color:var(--muted);margin:0">本次到达不计入点亮。记录已转入人工复核，你可以在「我的 · 到访记录」中查看申诉进度。</p>
              </div>`,
              footer: `<button class="btn primary block" data-ok style="margin-top:16px">知道了</button>`,
              onMount(l, done) { l.querySelector('[data-ok]').onclick = done; },
            });
            App.renderGuide();
          };
        },
      });
    },
  };

  App.screens = App.screens || {};
  App.screens.map = MapScreen;
})();
