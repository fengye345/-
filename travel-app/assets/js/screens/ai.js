/* ============================================================
   AI 助手：任务卡 / 来源标注 / 不确定提示 / 额度
   ============================================================ */
(function () {
  const App = (window.App = window.App || {});
  let page = null;

  const QUICK = ['今天下午去哪', '西湖现在人多吗', '附近吃什么', '明天天气如何', '帮我排半天路线'];

  const AI = {
    messages: [],
    busy: false,

    open(prefill) {
      if (page) { if (prefill) this.ask(prefill); return; }
      page = UI.el(`<div class="ai-page">
        <div class="ai-head">
          <button class="iconbtn plain" data-close aria-label="返回">${UI.icon('left', 19)}</button>
          <div class="ai-orb">${UI.icon('sparkle', 17)}</div>
          <div class="n"><b>AI 旅行助手</b><span><i></i>杭州 · 已读取现场信息</span></div>
          <div class="ai-quota"><b data-quota>7</b> / 10 次<br><span style="font-size:8.5px">今日剩余</span></div>
        </div>
        <div class="ai-body" data-body></div>
        <div class="quick" data-quick></div>
        <div class="ai-input">
          <div class="f" contenteditable="true" data-input aria-label="输入问题">问点什么，比如「现在去断桥还来得及吗」</div>
          <button class="go" data-send aria-label="发送">${UI.icon('send', 18)}</button>
        </div>
      </div>`);
      document.getElementById('overlays').appendChild(page);
      this.syncQuota();

      page.querySelector('[data-close]').onclick = () => this.close();
      page.querySelector('[data-send]').onclick = () => this.send();
      const input = page.querySelector('[data-input]');
      input.addEventListener('focus', () => { if (input.textContent.includes('问点什么')) input.textContent = ''; });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); } });
      page.querySelector('[data-quick]').innerHTML = QUICK.map((q) => `<button data-q="${q}">${q}</button>`).join('');
      page.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => this.ask(b.dataset.q); });

      this.renderAll();
      if (prefill) setTimeout(() => this.ask(prefill), 340);
      else setTimeout(() => input.focus(), 300);
    },

    close() {
      if (page) { page.remove(); page = null; this.messages = []; this.busy = false; }
    },

    syncQuota() {
      const s = Store.state.ai;
      if (page) {
        const q = page.querySelector('[data-quota]');
        if (q) q.textContent = Math.max(0, s.quota - s.used);
      }
    },

    send() {
      const input = page.querySelector('[data-input]');
      const text = (input.textContent || '').trim();
      if (!text || text.includes('问点什么')) return;
      input.textContent = '';
      this.ask(text);
    },

    renderAll() {
      this.renderIntro();
      this.renderQuick();
      this.renderMessages();
    },

    renderIntro() {
      const body = page.querySelector('[data-body]');
      if (this.messages.length) return;
      body.innerHTML = `<div class="ai-intro">
          <div class="k">SAT 14:20 · 杭州 · 多云 22°</div>
          <h2>今天下午还有 3 个半小时，走一条不绕路的线？</h2>
          <p>我会读取你的位置、天气和城市里的现场信息，给出可以直接执行的建议，并标注每一条的来源与更新时间。</p>
        </div>
        <div class="ai-ctx">
          <span class="ctx">${UI.icon('pin', 11)}西湖 · 湖滨</span>
          <span class="ctx">${UI.icon('sun', 11)}22° 多云转晴</span>
          <span class="ctx">${UI.icon('clock', 11)}剩余 3h 20m</span>
          <span class="ctx">${UI.icon('map', 11)}已点亮 6 城</span>
        </div>
        <div class="ai-card" style="background:linear-gradient(140deg,#F6F3E9,#FBFAF4)">
          <div class="hd"><b>${UI.icon('sparkle', 14)}今日一条</b><span class="when">刚刚更新</span></div>
          <p style="font-size:12px;line-height:1.7;margin:0 0 8px;color:var(--ink-2)">断桥这会儿人已经散了，但 17:00 之后湖边会起风。<b>建议先去中国美院看展，再回长桥看日落</b>，全程公交 + 步行 6.8 公里。</p>
          <div class="meta" style="display:flex;gap:6px;align-items:center">
            <span class="src-chip">${UI.icon('shield', 9)}杭州气象 · 06:00</span>
            <span class="src-chip">${UI.icon('pin', 9)}公共区域 · 陈默 12 分钟前</span>
          </div>
        </div>`;
    },

    renderQuick() {
      const quick = page.querySelector('[data-quick]');
      if (!quick) return;
      quick.innerHTML = QUICK.map((q) => `<button data-q="${q}">${q}</button>`).join('');
      quick.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => this.ask(b.dataset.q); });
    },

    renderMessages() {
      const body = page.querySelector('[data-body]');
      if (!body) return;
      if (!this.messages.length) { this.renderIntro(); return; }

      body.innerHTML = this.messages.map((m) => {
        if (m.role === 'user') return `<div class="bubble-user">${UI.esc(m.text)}</div>`;
        return this.cardHTML(m.kind, m.text);
      }).join('') + (this.busy ? `<div class="ai-card" style="padding:0"><div class="typing"><i></i><i></i><i></i></div></div>` : '');

      body.querySelectorAll('[data-src]').forEach((b) => {
        b.onclick = () => this.openSource(b.dataset.src);
      });
      body.querySelectorAll('[data-fav]').forEach((b) => {
        b.onclick = () => { b.classList.toggle('on'); UI.toast('已收藏到「想去」'); };
      });
      body.querySelectorAll('[data-plan]').forEach((b) => {
        b.onclick = () => UI.toast('已加入当天行程 · 可在城市页查看', 'check');
      });
      body.querySelectorAll('[data-mem]').forEach((b) => {
        b.onclick = () => UI.toast('已写入今天的回忆盒草稿', 'layers');
      });
      body.querySelectorAll('[data-fb]').forEach((b) => {
        b.onclick = () => UI.toast(b.dataset.fb === 'ok' ? '谢谢，已记录' : '已反馈给质量评估');
      });
      body.scrollTop = body.scrollHeight;
    },

    cardHTML(kind, text) {
      const s = Store.state.ai;
      const route = s.route;
      if (kind === 'crowd') {
        return `<div class="ai-card">
          <div class="hd"><b>${UI.icon('sparkle', 14)}现在值得去吗</b><span class="when">14:21 更新</span></div>
          <div class="weather" style="background:linear-gradient(120deg,#EAF1EF,#F6F2E7)">
            ${UI.icon('users', 19)}
            <div><b>值得去，但建议 30 分钟内到</b><br><span>当前在园人数约为周末均值的 38%</span></div>
          </div>
          <div style="font-size:11.5px;line-height:1.75;color:var(--ink-2)">
            断桥此刻人流已明显回落；湖滨银泰停车仍满，建议地铁 1 号线到龙翔桥。日落 17:32，长桥公园比雷峰塔更适合看。
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
            <span class="src-chip" data-src="现场反馈">${UI.icon('pin', 9)}现场反馈 · 12 分钟前</span>
            <span class="src-chip" data-src="景区客流">${UI.icon('users', 9)}景区客流 · 14:00</span>
            <span class="src-chip" data-src="杭州气象">${UI.icon('sun', 9)}杭州气象 · 06:00</span>
          </div>
          <div class="unknown">${UI.icon('alert', 12)}未能确认：今晚湖滨音乐喷泉是否开放。该信息未在官方渠道发布，建议出发前查看景区公告。</div>
          <div class="ai-actions">
            <button data-plan>${UI.icon('calendar', 12)}加入行程</button>
            <button data-fav>${UI.icon('bookmark', 12)}收藏</button>
          </div>
          <div class="ai-feedback"><span>这个回答有用吗</span>
            <button data-fb="ok">${UI.icon('check', 12)}有用</button>
            <button data-fb="no">${UI.icon('close', 12)}无用</button>
          </div>
        </div>`;
      }
      if (kind === 'food') {
        return `<div class="ai-card">
          <div class="hd"><b>${UI.icon('sparkle', 14)}附近 3 个选择</b><span class="when">步行 15 分钟内</span></div>
          ${[
            ['弄堂里（湖滨店）', '杭帮菜 · 人均 68', '420m · 步行 6 分钟', '现场等位 12 桌，可线上取号', '公共区域 · 9 分钟前'],
            ['Cycle & Cycle', '面包咖啡 · 人均 35', '260m · 步行 4 分钟', '现在有位，靠窗可看街景', '商家主页 · 今日 10:00'],
            ['新白鹿（西湖店）', '杭帮菜 · 人均 55', '850m · 步行 12 分钟', '排队约 25 分钟，建议 17:00 前到', '现场反馈 · 6 分钟前'],
          ].map(([n, t, d, note, src]) => `
            <div style="padding:10px 0;border-bottom:1px solid var(--line-2)">
              <div style="display:flex;align-items:baseline;gap:6px"><b style="font-size:12px">${n}</b><span style="font-size:9.5px;color:var(--muted)">${t}</span></div>
              <div style="font-size:9.5px;color:var(--muted);margin-top:2px">${d} · ${note}</div>
              <span class="src-chip" style="margin-top:5px" data-src="${n}">${UI.icon('shield', 9)}${src}</span>
            </div>`).join('')}
          <div class="unknown">${UI.icon('alert', 12)}价格来自公开信息，可能已调整；营业时间未能逐一确认。</div>
          <div class="ai-actions">
            <button data-plan>${UI.icon('calendar', 12)}加入行程</button>
            <button data-fav>${UI.icon('bookmark', 12)}收藏</button>
          </div>
        </div>`;
      }
      return `<div class="ai-card">
        <div class="hd"><b>${UI.icon('sparkle', 14)}${UI.esc(route.title)}</b><span class="when">${UI.esc(route.total)}</span></div>
        <div class="weather">
          ${UI.icon('sun', 20)}
          <div><b>${route.weather.desc}</b><br><span>${route.weather.temp} · 日落 17:32 · 适合步行</span></div>
        </div>
        <div class="route">
          ${route.stops.map((st, i) => `
            <div class="stop">
              <div class="rail"><div class="num">${i + 1}</div>${i < route.stops.length - 1 ? '<div class="line"></div>' : ''}</div>
              <div class="c">
                <div class="t"><b>${UI.esc(st.name)}</b><span>${st.time}</span></div>
                <p>${UI.esc(st.desc)}</p>
                <div class="meta">
                  <span class="walk">${UI.icon('route', 10)}${UI.esc(st.walk)}</span>
                  <span class="src-chip" data-src="${UI.esc(st.name)}">${UI.icon('shield', 9)}${UI.esc(st.src)}</span>
                </div>
              </div>
            </div>`).join('')}
        </div>
        <div class="unknown">${UI.icon('alert', 12)}${UI.esc(route.unknown)}</div>
        <div class="ai-actions">
          <button data-fav>${UI.icon('bookmark', 12)}收藏</button>
          <button data-plan>${UI.icon('calendar', 12)}加入行程</button>
          <button data-mem>${UI.icon('layers', 12)}写进回忆盒</button>
        </div>
        <div class="ai-feedback"><span>来源可展开核对</span>
          <button data-fb="ok">${UI.icon('check', 12)}有用</button>
          <button data-fb="no">${UI.icon('close', 12)}无用</button>
        </div>
      </div>`;
    },

    ask(text) {
      if (this.busy) return;
      const s = Store.state.ai;
      if (s.used >= s.quota) { UI.toast('今日 AI 额度已用完 · 明天 00:00 恢复'); return; }
      this.messages.push({ role: 'user', text });
      this.busy = true;
      this.renderMessages();
      setTimeout(() => {
        this.busy = false;
        Store.markAiUsed();
        this.syncQuota();
        let kind = 'route';
        if (/人多|值得|排队|开放|开门|态度/.test(text)) kind = 'crowd';
        else if (/吃|餐厅|美食|咖啡/.test(text)) kind = 'food';
        this.messages.push({ role: 'ai', kind, text });
        this.renderMessages();
      }, 1250);
    },

    openSource(name) {
      UI.sheet({
        title: '来源与更新时间',
        sub: name,
        body: `<div style="display:flex;flex-direction:column;gap:8px">
          ${[
            ['杭州市气象台', '官方气象数据 · 今日 06:00 更新', '晴转多云，日落 17:32，东南风 2 级'],
            ['西湖景区客流', '景区公开数据 · 14:00 更新', '当前在园 1.8 万人，约为周末均值 38%'],
            ['公共区域 · 陈默', '现场发布 · 12 分钟前 · 现场标识', '断桥这会儿人已经散了，湖边风大'],
          ].map(([t, m, d]) => `<div style="padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:#fff">
            <div style="display:flex;align-items:center;gap:6px"><b style="font-size:11.5px">${t}</b><span style="margin-left:auto;font-size:8.5px;color:var(--jade)">已核验</span></div>
            <div style="font-size:9px;color:var(--muted);margin-top:3px">${m}</div>
            <div style="font-size:10px;color:var(--ink-2);margin-top:5px;line-height:1.55">${d}</div>
          </div>`).join('')}
        </div>
        <p class="hint" style="margin:12px 3px 0">AI 只汇总来源明确的信息；无法确认时会明确提示，不编造营业时间与价格。</p>`,
      });
    },
  };

  App.openAI = (prefill) => AI.open(prefill);
  App.screens = App.screens || {};
  App.screens.ai = AI;
})();
