/* ============================================================
   应用装配：路由 / 桌面导览 / 首次使用 / 通知
   ============================================================ */
(function () {
  const App = (window.App = window.App || {});

  const ROUTES = {
    map: 'map',
    memory: 'memory',
    share: 'share',
    discover: 'discover',
    me: 'me',
  };

  function parseHash() {
    const raw = (location.hash || '#/map').replace(/^#\/?/, '');
    const [path, query] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const name = parts[0] || 'map';
    const params = {};
    if (parts[1]) params.id = parts[1];
    if (name === 'share' && parts[1] === 'team') { params.view = 'team'; params.id = null; }
    if (query) new URLSearchParams(query).forEach((v, k) => { params[k] = v; });
    return { name: ROUTES[name] ? name : 'map', params };
  }

  App.go = (hash) => { if (location.hash === hash) App.rerender(); else location.hash = hash; };

  App.rerender = (opts) => {
    const view = document.getElementById('view');
    const old = view.querySelector('.screen');
    const { name, params } = parseHash();
    const routeKey = name + '/' + (params.id || '') + '/' + (params.view || '');
    const sameRoute = App._routeKey === routeKey;
    const top = old && sameRoute ? old.scrollTop : 0;
    const screen = App.screens[name];
    if (!screen) return;
    view.innerHTML = screen.render(params);
    screen.mount && screen.mount(view, params);
    const fresh = view.querySelector('.screen');
    if (fresh && !(opts && opts.top)) fresh.scrollTop = top;
    App._routeKey = routeKey;
    setActiveTab(name, params);
    App.renderGuide();
  };

  function setActiveTab(name, params) {
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === name);
    });
    const detail = (name === 'memory' && params && params.id) || (name === 'share' && params && params.view === 'team');
    document.getElementById('tabbar').style.display = detail ? 'none' : 'grid';
  }

  /* ---------------- guide ---------------- */
  const SCENARIOS = [
    { n: '01', t: '到达 → 点亮城市', d: '30 分钟 · 2 个定位点 · 全屏动画', run() {
      App.go('#/map');
      setTimeout(() => {
        if (Store.state.cities['杭州'] && Store.state.cities['杭州'].lit) {
          UI.lightUp({ city: '杭州', province: '浙江省', visits: 4, days: 11, first: '2023.04.06', onDone: () => App.rerender() });
        } else {
          App.screens.map.doLightUp();
        }
      }, 260);
    } },
    { n: '02', t: '照片 → 回忆盒', d: '自动成团 · 三套模板 · 分享有效期', run() {
      App.go('#/memory');
      setTimeout(() => App.screens.memory.openCreate(), 300);
    } },
    { n: '03', t: '同城 → 匹配组队', d: '双方喜欢 · 模糊距离 · 队伍房', run() {
      App.go('#/share');
      setTimeout(() => {
        if (Store.state.share.active) UI.toast('共享已开启 · 在大厅选择一个匹配');
        else App.screens.share.openCard();
      }, 300);
    } },
    { n: '04', t: '发布一条「此刻」', d: '现场校验 · 6 小时 · 公共副本', run() {
      App.go('#/discover');
      setTimeout(() => App.openPublish({}), 320);
    } },
    { n: '05', t: 'AI 规划半天', d: '任务卡 · 来源 · 未能确认提示', run() {
      App.openAI('帮我排半天路线，轻松一点');
    } },
    { n: '06', t: '搜索一座城市', d: '中文 / 拼音 / 省份 · 直达城市卡', run() {
      App.openCitySearch();
    } },
  ];

  App.renderGuide = function () {
    const el = document.getElementById('guide');
    if (!el) return;
    const ac = Store.aclist();
    const done = ac.filter((x) => x.done).length;
    el.innerHTML = `<div class="g-brand">
        <div class="g-mark">${UI.icon('map', 17)}</div>
        <div><b>旅迹 TRAVELOG</b><span>PRODUCT PROTOTYPE</span></div>
      </div>
      <p class="g-kicker">PRD V1.0 · 高保真交互原型</p>
      <h1 class="g-title">把到达，<br>变成<em>风景</em>。</h1>
      <p class="g-sub">依据《旅游记录 App 产品需求文档》实现：城市点亮、回忆盒、共享组队、在地实时信息与 AI 助手。五大模块共享同一套城市与到访数据，<b>可直接点击走查主流程</b>。</p>

      <div class="g-sec"><h3>演示脚本</h3><span>点击执行</span></div>
      <div class="scenarios">
        ${SCENARIOS.map((s, i) => `<button class="scenario" data-sc="${i}">
          <span class="num">${s.n}</span>
          <span class="txt"><b>${s.t}</b><span>${s.d}</span></span>
        </button>`).join('')}
      </div>

      <div class="g-sec"><h3>验收标准</h3><span>${done}/9 已覆盖</span></div>
      <div class="ac-list">
        ${ac.map((x) => `<div class="ac ${x.done ? 'done' : ''}">
          <span class="box">${UI.icon('check', 9)}</span>${x.label}<span class="code">${x.code}</span>
        </div>`).join('')}
      </div>

      <div class="g-foot"><b>演示数据</b> 全部保存在本机浏览器，可随时在「我的」中重置。<br><b>说明</b> 视觉与文案为原型演示，不作为最终设计稿。</div>`;

    el.querySelectorAll('[data-sc]').forEach((b) => {
      b.onclick = () => SCENARIOS[+b.dataset.sc].run();
    });
  };

  /* ---------------- notifications ---------------- */
  App.openNotifications = function () {
    const s = Store.state;
    UI.sheet({
      title: '消息中心',
      sub: `${Store.unread()} 条未读 · 系统 / 互动 / 队伍`,
      body: `<div style="display:flex;flex-direction:column;gap:8px">
        ${s.notifications.map((n) => `<div style="display:flex;gap:10px;padding:12px;border-radius:14px;background:${n.unread ? '#fff' : 'rgba(255,255,255,.5)'};border:1px solid var(--line-2)">
          <span style="width:32px;height:32px;border-radius:10px;background:${n.type === 'team' ? 'var(--jade-wash)' : n.type === 'like' ? 'var(--clay-wash)' : 'var(--paper-2)'};color:${n.type === 'team' ? 'var(--jade)' : n.type === 'like' ? 'var(--clay)' : 'var(--ink-2)'};display:grid;place-items:center;flex:none">
            ${UI.icon(n.type === 'team' ? 'users' : n.type === 'like' ? 'heart' : 'bell', 15)}
          </span>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px"><b style="font-size:12px">${UI.esc(n.title)}</b>
              ${n.unread ? '<i style="width:5px;height:5px;border-radius:50%;background:var(--clay)"></i>' : ''}
              <span style="margin-left:auto;font-size:9px;color:var(--muted-2)">${Store.util.relTime(n.ago)}</span></div>
            <div style="font-size:10.5px;color:var(--muted);margin-top:3px;line-height:1.5">${UI.esc(n.body)}</div>
          </div>
        </div>`).join('')}
      </div>`,
      footer: `<button class="btn ghost block" data-read style="margin-top:14px">全部标为已读</button>`,
      onMount(layer, close) {
        layer.querySelector('[data-read]').onclick = () => {
          Store.markAllRead(); close(); UI.toast('已全部标为已读'); App.rerender();
        };
      },
    });
  };

  /* ---------------- city search ---------------- */
  App.openCitySearch = function (opts) {
    const lit = {};
    Object.entries(Store.state.cities).forEach(([n, c]) => { if (c.lit) lit[n] = c; });
    const all = window.CITY_INDEX || [];
    const norm = (s) => String(s || '').toLowerCase().replace(/[\s'’·-]/g, '');
    let query = (opts && opts.q) || '';

    const hl = (text, q) => {
      const raw = String(text);
      if (!q) return UI.esc(raw);
      const i = raw.toLowerCase().indexOf(String(q).toLowerCase());
      if (i < 0) return UI.esc(raw);
      return UI.esc(raw.slice(0, i)) + '<mark>' + UI.esc(raw.slice(i, i + q.length)) + '</mark>' + UI.esc(raw.slice(i + q.length));
    };

    const row = (c) => {
      const rec = lit[c.n];
      const isCur = c.n === Store.state.currentCity;
      return `<button class="city-row" data-pick="${UI.esc(c.n)}">
        <span class="city-flag${rec ? ' on' : ''}">${UI.esc(c.n.slice(0, 1))}</span>
        <span class="city-info"><b>${hl(c.n, query)}</b>
          <span>${UI.esc(c.p)}${rec ? ` · ${rec.visits} 次到访 · ${rec.days} 天` : ' · 未点亮'}</span></span>
        ${isCur ? '<span class="badge live"><span class="dot"></span>当前</span>'
          : rec ? '<span class="badge on">已点亮</span>' : '<span class="badge">未点亮</span>'}
        <span class="city-chev">${UI.icon('right', 14)}</span>
      </button>`;
    };

    const resultsHTML = () => {
      const q = query.trim();
      if (!q) {
        const litRows = Store.litCities().map((c) => all.find((x) => x.n === c.name)).filter(Boolean).map(row).join('');
        const hot = all.filter((c) => c.hot && !lit[c.n]).slice(0, 10);
        return `<div class="city-group"><span>已点亮</span><span>${Object.keys(lit).length} 座</span></div>
          <div class="city-list">${litRows || '<p class="hint">还没有点亮城市，到达后会自动记录</p>'}</div>
          <div class="city-group"><span>热门城市</span><span>点击即可搜索</span></div>
          <div class="chips" style="padding:0 0 10px;flex-wrap:wrap">
            ${hot.map((c) => `<button class="chip" data-q="${c.n}">${c.n}</button>`).join('')}
          </div>
          <p class="hint" style="padding:2px 2px 0">支持城市名、拼音与省份搜索。城市以地级及以上行政区为点亮单位，景区与商圈只是城市内的地点。</p>`;
      }
      const nq = norm(q);
      const matched = all.filter((c) => norm(c.n).includes(nq) || c.py.startsWith(nq) || norm(c.p).includes(nq))
        .sort((a, b) => {
          const sa = norm(a.n).startsWith(nq) ? 0 : 1;
          const sb = norm(b.n).startsWith(nq) ? 0 : 1;
          if (sa !== sb) return sa - sb;
          if (!!lit[b.n] !== !!lit[a.n]) return lit[b.n] ? 1 : -1;
          return (b.hot ? 1 : 0) - (a.hot ? 1 : 0);
        });
      if (!matched.length) {
        return `<div class="city-empty">
          <div class="ic">${UI.icon('search', 22)}</div>
          <b>没有找到「${UI.esc(q)}」</b>
          <p>试试城市名、拼音或省份，例如“杭州”“hangzhou”“云南”。</p>
          <button class="btn sm ghost" data-manual style="margin-top:10px">手动补录这座城市</button>
        </div>`;
      }
      return `<div class="city-group"><span>搜索结果</span><span>${matched.length} 个城市</span></div>
        <div class="city-list">${matched.map(row).join('')}</div>`;
    };

    UI.sheet({
      title: '搜索城市',
      sub: '查看点亮状态与到访记录',
      tall: true,
      body: `<div class="city-search-box">
          ${UI.icon('search', 17)}
          <input data-cs placeholder="城市名 / 拼音 / 省份，如 杭州、hangzhou、云南" value="${UI.esc(query)}" autocomplete="off" autocapitalize="off" spellcheck="false">
          <button class="cs-clear" data-clear aria-label="清空" style="display:${query ? 'grid' : 'none'}">${UI.icon('close', 13)}</button>
        </div>
        <div data-cs-results>${resultsHTML()}</div>`,
      onMount(layer, close) {
        const input = layer.querySelector('[data-cs]');
        const box = layer.querySelector('[data-cs-results]');
        const clear = layer.querySelector('[data-clear]');

        const bind = () => {
          box.querySelectorAll('[data-pick]').forEach((b) => {
            b.onclick = () => {
              const name = b.dataset.pick;
              close();
              setTimeout(() => {
                if (lit[name]) App.screens.map.openCityCard(name);
                else App.openUnlitCity(name, () => App.openCitySearch());
              }, 120);
            };
          });
          box.querySelectorAll('[data-q]').forEach((b) => {
            b.onclick = () => {
              query = b.dataset.q;
              input.value = query;
              clear.style.display = 'grid';
              refresh();
              input.focus();
            };
          });
          const manual = box.querySelector('[data-manual]');
          if (manual) manual.onclick = () => { close(); App.screens.me.openManual(query.trim()); };
        };

        const refresh = () => {
          box.innerHTML = resultsHTML();
          clear.style.display = query ? 'grid' : 'none';
          bind();
        };

        input.oninput = () => { query = input.value; refresh(); };
        input.onkeydown = (e) => {
          if (e.key === 'Escape') { e.preventDefault(); close(); }
          if (e.key === 'Enter') {
            const first = box.querySelector('[data-pick]') || box.querySelector('[data-q]');
            if (first) first.click();
          }
        };
        clear.onclick = () => { query = ''; input.value = ''; refresh(); input.focus(); };
        bind();
        setTimeout(() => input.focus(), 160);
      },
    });
  };

  App.openUnlitCity = function (name, onBack) {
    const meta = (window.CITY_INDEX || []).find((c) => c.n === name) || { p: '—' };
    UI.sheet({
      title: `${name} · 未点亮`,
      sub: `${meta.p} · 到达并停留 30 分钟后自动点亮`,
      body: `<div style="padding:18px;border-radius:18px;background:linear-gradient(150deg,#EEF3EC,#F8F5EB);border:1px solid #DFE7DB;margin-bottom:14px">
          <div style="font-family:var(--serif);font-size:32px;letter-spacing:.1em;color:#24453A">${UI.esc(name)}</div>
          <div style="font-size:10.5px;color:var(--muted);margin-top:3px">${UI.esc(meta.p)} · 尚未留下到访记录</div>
        </div>
        <div class="menu" style="margin:0">
          ${[
            ['clock', '停留 30 分钟', '进入城市边界内累计停留不少于 30 分钟'],
            ['locate', '2 个有效定位点', '间隔不少于 10 分钟，精度不高于 200 米'],
            ['calendar', '24 小时一条记录', '再次到达且间隔超过 24 小时，生成新的到访'],
          ].map(([ic, t, d]) => `<div class="mrow">
            <span class="ic">${UI.icon(ic, 15)}</span>
            <span class="t">${t}<span>${d}</span></span>
          </div>`).join('')}
        </div>
        <p class="hint" style="margin:12px 3px 0">飞行中转、铁路经停与高速路过不点亮。景区、商圈和街区属于城市内的地点，不作为独立城市。</p>`,
      footer: `<div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn ghost" style="flex:1" data-back>返回搜索</button>
          <button class="btn primary" style="flex:1" data-manual>${UI.icon('pin', 15)}手动补录</button>
        </div>`,
      onMount(layer, close) {
        layer.querySelector('[data-back]').onclick = () => { close(); if (onBack) setTimeout(onBack, 90); };
        layer.querySelector('[data-manual]').onclick = () => { close(); App.screens.me.openManual(name); };
      },
    });
  };

  /* ---------------- onboarding ---------------- */
  let obStep = 0;

  App.showOnboarding = function (force) {
    if (!force && Store.state.onboarded) return;
    obStep = 0;
    const node = UI.el(`<div class="onboard" id="onboard"></div>`);
    document.getElementById('overlays').appendChild(node);
    renderStep(node);
  };

  function obFrame(art, copy, panel) {
    return `<div class="onboard-art">
        <div class="ob-brand">
          <div class="b"><div class="g-mark" style="width:30px;height:30px">${UI.icon('map', 15)}</div><b style="font-family:var(--serif);font-size:16px;letter-spacing:.16em">旅迹</b></div>
          <button class="ob-skip" data-skip>跳过演示</button>
        </div>
        ${art}
        ${copy}
      </div>
      <div class="ob-panel">
        <div class="ob-dots">${[0, 1, 2].map((i) => `<i class="${i === obStep ? 'on' : ''}"></i>`).join('')}</div>
        ${panel}
      </div>`;
  }

  function renderStep(node) {
    const s = Store.state;
    if (obStep === 0) {
      const art = `<div style="position:absolute;top:64px;left:-40px;right:-60px;height:300px;opacity:.5;mask-image:linear-gradient(to bottom,#000 30%,transparent)">
          ${chinaSketch()}
        </div>`;
      node.innerHTML = obFrame(art, `<div class="ob-copy">
          <div class="k">TRAVELOG · 从到达开始</div>
          <h1>把每一次到达，<br>变成看得见的记忆</h1>
          <p>不用先写游记。城市会在地图上亮起，照片会自己聚成一次旅行。</p>
        </div>`, `
        <div class="ob-actions">
          <button class="ob-login" data-login>${UI.icon('phone', 18)}<span>手机号快捷登录</span><span class="arr">${UI.icon('right', 16)}</span></button>
          <div style="display:flex;gap:8px">
            <button class="ob-login" style="justify-content:center;flex:1" data-wx>${UI.icon('wechat', 18)}微信</button>
            <button class="ob-login" style="justify-content:center;flex:1" data-apple>${UI.icon('apple', 18)}Apple</button>
          </div>
        </div>
        <div class="ob-note">演示环境：不会发送真实验证码，也不会读取你的相册或位置</div>`);
      node.querySelectorAll('[data-login],[data-wx],[data-apple]').forEach((b) => {
        b.onclick = () => {
          b.style.borderColor = 'var(--jade)';
          b.style.background = 'var(--jade-wash)';
          setTimeout(() => { obStep = 1; renderStep(node); }, 240);
        };
      });
      node.querySelector('[data-skip]').onclick = skip;
    } else if (obStep === 1) {
      const art = `<div class="radar">
          <div class="r"></div><div class="r"></div><div class="r"></div>
          <div class="wave"></div><div class="sweep"></div>
          <div class="dot"></div>
          <div class="poi" style="left:30%;top:34%"></div>
          <div class="poi" style="left:68%;top:42%"></div>
          <div class="poi" style="left:44%;top:68%"></div>
          <div class="poi" style="left:73%;top:72%;background:#C99A4B"></div>
        </div>`;
      node.innerHTML = obFrame(art, `<div class="ob-copy" style="bottom:14px">
          <div class="k">LOCATION · 仅用于记录</div>
          <h1>开启定位，<br>让城市替你记住</h1>
          <p>停留判定需要 30 分钟与 2 个定位点。原始位置保留 7 天后降精度为城市级，你可以随时关闭。</p>
        </div>`, `
        <div class="ob-actions">
          <button class="btn primary lg" data-allow style="width:100%">始终允许</button>
          <button class="btn ghost" data-allow style="width:100%;height:42px">使用 App 期间</button>
          <button class="btn ghost" data-manual style="width:100%;height:42px;border:0;color:var(--muted);font-size:12px">暂不开启，稍后手动补录</button>
        </div>
        <div class="ob-note">定位、相册、相机与通知分别申请，拒绝后提供手动路径</div>`);
      node.querySelectorAll('[data-allow]').forEach((b) => { b.onclick = () => { obStep = 2; renderStep(node); }; });
      node.querySelector('[data-manual]').onclick = () => { obStep = 2; renderStep(node); };
      node.querySelector('[data-skip]').onclick = skip;
    } else {
      const art = `<div class="arrival-card">
          <div class="arrival-ring">
            ${UI.ring(1, 150, 6).replace('class="ring"', 'class="ring" style="width:150px;height:150px"')}
            <div class="val">30<small>分钟</small></div>
          </div>
          <h2>你已到达杭州</h2>
          <p>浙江省 · 西湖区 · 3 个有效定位点，间隔 12 分钟。满足点亮条件。</p>
          <div class="arrival-facts">
            <div><b>3 个</b><span>定位点</span></div>
            <div><b>38m</b><span>定位精度</span></div>
            <div><b>47 分</b><span>本次停留</span></div>
          </div>
        </div>`;
      node.innerHTML = obFrame(art, '', `
        <div class="ob-actions">
          <button class="btn primary lg" data-light style="width:100%">${UI.icon('locate', 17)}点亮杭州</button>
        </div>
        <div class="ob-note">点亮只发生一次；同一城市 24 小时内只生成一条到访记录</div>`);
      node.querySelector('[data-light]').onclick = () => {
        Store.lightUp('杭州');
        node.remove();
        const rec = Store.state.cities['杭州'];
        setTimeout(() => {
          UI.lightUp({
            city: '杭州', province: '浙江省', visits: rec.visits || 4, days: rec.days || 11, first: '2023.04.06',
            onDone: () => { App.rerender(); UI.toast('城市卡已收进地图'); },
          });
        }, 120);
      };
      node.querySelector('[data-skip]').onclick = skip;
    }

    function skip() {
      const s2 = Store.state;
      if (!s2.cities['杭州'] || !s2.cities['杭州'].lit) Store.lightUp('杭州');
      Store.commit((st) => { st.onboarded = true; });
      node.remove();
      App.rerender();
      UI.toast('已进入演示 · 可在左侧脚本依次走查');
    }
  }

  function chinaSketch() {
    const geo = window.CHINA_GEO;
    const paths = geo.provinces.map((p, i) => `<path d="${p.d}" fill="${i % 3 === 0 ? '#CFDCCB' : '#DAD5C6'}" stroke="#F4F1E9" stroke-width="1"/>`).join('');
    return `<svg viewBox="0 0 ${geo.w} ${geo.h}" style="width:100%;height:100%">${paths}</svg>`;
  }

  /* ---------------- boot ---------------- */
  function boot() {
    const params = new URLSearchParams(location.search);
    if (params.get('reset') === '1') { Store.reset(); }
    if (params.get('qa') === '1') document.body.classList.add('qa');
    document.querySelectorAll('.tab-ico').forEach((el) => { el.innerHTML = UI.icon(el.dataset.icon, 23); });
    const time = new Date();
    const sb = document.getElementById('sbTime');
    if (sb) sb.textContent = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;

    // demo deep-links（便于截图与评审快速进入状态）
    const needLit = params.get('lit') === '1' || params.get('onboard') === '0';
    if (needLit && (!Store.state.cities['杭州'] || !Store.state.cities['杭州'].lit)) {
      Store.commit((s) => {
        s.cities['杭州'] = { province: '浙江省', first: '2023-04-06', visits: 4, days: 11, deep: true, coord: [120.155, 30.274], lit: true, last: '今天' };
        s.metrics.lit = true;
        s.pendingArrival = null;
        s.onboarded = true;
      });
    }
    if (params.get('share') === '1' && !Store.state.share.active) Store.startShare();
    if (params.get('view') === 'city') App.screens.map.view = 'city';

    if (params.get('ob')) {
      App.showOnboarding(true);
      setTimeout(() => { obStep = Math.min(2, +params.get('ob')); renderStep(document.getElementById('onboard')); }, 60);
    } else if (params.get('onboard') !== '0' && !Store.state.onboarded) {
      App.showOnboarding();
    } else if (!Store.state.onboarded) {
      Store.commit((s) => { s.onboarded = true; });
    }

    window.addEventListener('hashchange', () => { App.rerender(); });
    App.rerender();
    App.renderGuide();

    if (params.get('open')) {
      setTimeout(() => {
        const o = params.get('open');
        try {
          if (o === 'ai') App.openAI('帮我排半天路线，轻松一点');
          if (o === 'publish') App.openPublish({});
          if (o === 'create') App.screens.memory.openCreate();
          if (o === 'sharecard') App.screens.share.openCard();
          if (o === 'lightup') UI.lightUp({ city: '杭州', province: '浙江省', visits: 4, days: 11, first: '2023.04.06', onDone: () => {} });
          if (o === 'citycard') App.screens.map.openCityCard();
          if (o === 'citysearch') App.openCitySearch({ q: params.get('q') || '' });
          if (o === 'boxshare') {
            const id = (location.hash.split('/')[2] || '');
            const b = Store.box(id);
            if (b) App.screens.memory.openShare(b);
          }
        } catch (err) {
          UI.sheet({ title: '演示弹层打开失败', body: `<pre style="white-space:pre-wrap;font:11px/1.6 monospace;color:#b00">${UI.esc(err.message + '\n' + (err.stack || ''))}</pre>` });
        }
      }, 450);
    }

    Store.subscribe(() => App.renderGuide());

    if (params.get('debug') === '1') {
      setTimeout(() => {
        const sels = ['.map-screen', '.map-stage', '.map-top', '.map-canvas', '.china-map', '.city-panel', '.cp-progress', '.cp-progress .t', '.fab.ai'];
        const lines = sels.map((s) => {
          const e = document.querySelector(s);
          if (!e) return s + ': none';
          const r = e.getBoundingClientRect();
          return `${s}: x=${Math.round(r.x)} y=${Math.round(r.y)} w=${Math.round(r.width)} h=${Math.round(r.height)} sw=${e.scrollWidth} cw=${e.clientWidth}`;
        });
        const pre = document.createElement('pre');
        pre.id = 'DBG';
        pre.textContent = lines.join('\n');
        document.body.appendChild(pre);
      }, 700);
    }

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  App.rerender();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
