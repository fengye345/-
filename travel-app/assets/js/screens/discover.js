/* ============================================================
   发现：此刻 / 今日 / 文化 / 问答 + 发布
   ============================================================ */
(function () {
  const App = (window.App = window.App || {});

  const TABS = [
    { id: 'now', name: '此刻', ttl: 6 * 60 },
    { id: 'today', name: '今日', ttl: 24 * 60 },
    { id: 'long', name: '经验', ttl: 30 * 24 * 60 },
    { id: 'culture', name: '文化', ttl: 0 },
    { id: 'qa', name: '问答', ttl: 0 },
  ];

  const Discover = {
    tab: 'now',

    render() {
      const s = Store.state;
      const nowPosts = s.posts.filter((p) => p.type === 'now');
      const todayPosts = s.posts.filter((p) => p.type === 'today');
      const longPosts = s.posts.filter((p) => p.type === 'long');
      const liveNow = nowPosts.filter((p) => !Store.isExpired(p));
      const folded = nowPosts.filter((p) => Store.isExpired(p));

      return `<div class="screen">
        <div class="discover-head">
          <div class="dh-row">
            <div class="city-pick" data-act="city">${UI.esc(s.currentCity)} ${UI.icon('down', 15)}</div>
            <span class="badge live" style="margin-left:2px"><span class="dot"></span>现场 ${liveNow.length}</span>
            <div style="margin-left:auto;display:flex;gap:7px">
              <button class="iconbtn" data-act="search" aria-label="搜索">${UI.icon('search', 17)}</button>
              <button class="iconbtn" data-act="bell" aria-label="通知">${UI.icon('bell', 17)}</button>
            </div>
          </div>
          <div class="dh-tabs">
            ${TABS.map((t) => {
              const n = t.id === 'now' ? liveNow.length : t.id === 'today' ? todayPosts.length : t.id === 'long' ? longPosts.length : t.id === 'qa' ? s.qas.length : 2;
              return `<button class="dh-tab ${this.tab === t.id ? 'on' : ''}" data-tab="${t.id}">${t.name}<span class="n">${n}</span></button>`;
            }).join('')}
          </div>
        </div>

        <div style="padding-top:12px">
          ${this.tab === 'now' ? this.renderNow(liveNow, folded) : ''}
          ${this.tab === 'today' ? this.renderToday(todayPosts) : ''}
          ${this.tab === 'long' ? this.renderLong(longPosts) : ''}
          ${this.tab === 'culture' ? this.renderCulture() : ''}
          ${this.tab === 'qa' ? this.renderQA() : ''}
        </div>

        ${this.tab === 'now' || this.tab === 'today' ? `
          <button class="fab" data-act="publish" aria-label="发布">${UI.icon('plus', 17)}发布</button>` : ''}
      </div>`;
    },

    renderNow(posts, folded) {
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px 9px">
          <span style="font-size:10.5px;color:var(--muted)">按时效 · 现场可信度排序</span>
          <span style="font-size:10px;color:var(--muted-2);display:flex;gap:3px;align-items:center">${UI.icon('clock', 11)}6 小时后自动折叠</span>
        </div>
        ${posts.map((p) => this.renderPost(p)).join('')}
        ${folded.length ? `<div class="recycle-row" style="margin-top:6px" data-act="folded">
          ${UI.icon('clock', 14)}<span>已折叠 ${folded.length} 条过期「此刻」</span><span class="r">查看 ${UI.icon('right', 12)}</span></div>` : ''}`;
    },

    renderToday(posts) {
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px 9px">
          <span style="font-size:10.5px;color:var(--muted)">今日可去的路线、展览与餐厅</span>
          <span style="font-size:10px;color:var(--muted-2)">24 小时有效</span>
        </div>
        ${posts.map((p) => this.renderPost(p)).join('')}
        <div class="post" style="background:linear-gradient(120deg,#F6F1E5,#FBF8F1)">
          <div class="post-body">
            <div style="display:flex;gap:9px;align-items:center">
              <span style="width:30px;height:30px;border-radius:9px;background:var(--jade);color:#F6F1E5;display:grid;place-items:center">${UI.icon('sparkle', 16)}</span>
              <div><b style="font-size:12px">让 AI 按今天剩余时间排一条</b><div style="font-size:10px;color:var(--muted)">结合天气、营业时间与现场信息</div></div>
              <button class="btn sm primary" style="margin-left:auto" data-act="ai">安排</button>
            </div>
          </div>
        </div>`;
    },

    renderLong(posts) {
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px 9px">
          <span style="font-size:10.5px;color:var(--muted)">避坑、交通与拍摄点 · 可被 AI 引用</span>
          <span style="font-size:10px;color:var(--muted-2)">30 天有效</span>
        </div>
        ${posts.map((p) => this.renderPost(p)).join('')}`;
    },

    renderPost(p) {
      const left = Store.postRemaining(p);
      const expired = left <= 0;
      const typeLabel = p.type === 'now' ? '此刻' : p.type === 'today' ? '今日' : '经验';
      const typeBadge = p.type === 'now'
        ? `<span class="badge live"><span class="dot"></span>现场</span>`
        : p.type === 'today'
          ? `<span class="badge draft">今日</span>`
          : `<span class="badge" style="background:var(--jade-wash);color:var(--jade)">经验</span>`;
      return `<article class="post ${expired ? 'expired' : ''}" style="${expired ? 'opacity:.72' : ''}">
        <div class="post-body">
          <div class="post-top">
            <span class="avatar ${p.hue}">${p.initial}</span>
            <div class="who"><b>${UI.esc(p.author)}${p.mine ? ' · 我' : ''}</b><span>${Store.util.relTime(p.ago)} · ${UI.esc(p.area || '杭州')}</span></div>
            <div class="right">
              ${typeBadge}
              <button class="iconbtn plain" style="width:24px;height:24px" data-act="post-more" data-id="${p.id}">${UI.icon('more', 15)}</button>
            </div>
          </div>
          <p class="post-text">${p.text}</p>
          <div class="post-loc">${UI.icon('pin', 11)}${UI.esc(p.place)}${p.dist && p.dist !== '—' ? ` · 距你 ${p.dist}` : ''}</div>
          ${p.img ? `<div class="post-img"><img src="${p.img}" alt=""><span class="exp">${UI.icon('clock', 10)}${expired ? '已过期' : Store.util.dur(left).replace('剩余 ', '剩 ')}</span></div>` : ''}
          <div class="post-foot">
            <button class="act ${p.votedValid ? 'hot' : ''}" data-vote="valid" data-id="${p.id}">${UI.icon('check', 14)}仍有效 ${p.valid}</button>
            <button class="act ${p.votedInvalid ? 'hot' : ''}" data-vote="invalid" data-id="${p.id}">${UI.icon('close', 14)}已失效 ${p.invalid}</button>
            <button class="act ${p.liked ? 'hot' : ''}" data-vote="like" data-id="${p.id}">${p.liked ? UI.iconFilled('heart', 14) : UI.icon('heart', 14)}${p.likes}</button>
            <button class="act" data-vote="save" data-id="${p.id}">${p.saved ? UI.iconFilled('bookmark', 14) : UI.icon('bookmark', 14)}${p.saved ? '已收藏' : '收藏'}</button>
            <button class="act" data-vote="comment" data-id="${p.id}" style="margin-left:auto">${UI.icon('message', 13)}评论</button>
          </div>
        </div>
      </article>`;
    },

    renderCulture() {
      return `<div class="culture" data-act="culture">
          <div class="k">文化卡 · 官方</div>
          <h3>西湖十景，为什么是这十个</h3>
          <p>南宋画师从 800 年前的湖山取景，选出十个最佳观看位置。今天你仍然可以按图索骥，只是季节和人流改变了「最佳」。 </p>
          <div class="src">${UI.icon('shield', 9)}杭州市文旅局 · 认证创作者 · 2026.09 修订</div>
        </div>
        <div class="post" style="padding:0;overflow:hidden">
          <div style="display:flex;gap:11px;padding:13px">
            <div style="width:74px;height:74px;border-radius:12px;overflow:hidden;flex:none"><img src="assets/img/pic14.jpg" alt="" style="width:100%;height:100%;object-fit:cover"></div>
            <div style="min-width:0">
              <div style="font-size:9px;letter-spacing:.12em;color:var(--muted)">城市文化 · 非遗</div>
              <div style="font-size:13px;font-weight:650;margin:4px 0 4px">西湖绸伞：一把伞的 18 道工序</div>
              <div style="font-size:10px;color:var(--muted);line-height:1.5">从选竹到穿线，杭州人把雨天做成了手艺。</div>
            </div>
          </div>
        </div>
        <div class="post" style="padding:0;overflow:hidden">
          <div style="display:flex;gap:11px;padding:13px">
            <div style="width:74px;height:74px;border-radius:12px;overflow:hidden;flex:none"><img src="assets/img/pic16.jpg" alt="" style="width:100%;height:100%;object-fit:cover"></div>
            <div style="min-width:0">
              <div style="font-size:9px;letter-spacing:.12em;color:var(--muted)">方言 · 街区</div>
              <div style="font-size:13px;font-weight:650;margin:4px 0 4px">「小伢儿」和杭州话的 7 个声调</div>
              <div style="font-size:10px;color:var(--muted);line-height:1.5">在老城巷子里，听懂一句本地话。</div>
            </div>
          </div>
        </div>
        <div class="footer-note">文化卡由官方或认证创作者发布，字段结构化，可被 AI 引用</div>`;
    },

    renderQA() {
      const s = Store.state;
      return `<div style="padding:0 20px 8px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:10.5px;color:var(--muted)">向本地用户或 AI 提问 · 7 天有效</span>
          <button class="btn sm ghost" data-act="ask">${UI.icon('message', 13)}提问</button>
        </div>
        ${s.qas.map((q) => `<div class="qa">
          <div class="q">${UI.esc(q.q)}</div>
          ${q.answers.map((a) => `
            <div class="a">
              <span class="avatar ${a.hue}" style="${a.ai ? 'background:linear-gradient(150deg,#2F8A70,#0C342A);font-size:8px' : ''}">${a.ai ? 'AI' : a.initial}</span>
              <div style="flex:1">
                <p>${UI.esc(a.text)}</p>
                <div class="by">${a.by} · ${Store.util.relTime(a.ago)}${a.verified ? `<span style="color:var(--jade);display:inline-flex;align-items:center;gap:2px">${UI.icon('shield', 10)}已认证</span>` : ''}</div>
              </div>
            </div>`).join('')}
        </div>`).join('')}
        <div class="footer-note">回答会标注身份或来源 · 不做陌生人私信</div>`;
    },

    mount(root) {
      root.querySelectorAll('[data-tab]').forEach((b) => {
        b.onclick = () => { this.tab = b.dataset.tab; App.rerender(); };
      });
      root.querySelectorAll('[data-vote]').forEach((b) => {
        b.onclick = (e) => {
          e.stopPropagation();
          const id = b.dataset.id;
          const kind = b.dataset.vote;
          const p = Store.state.posts.find((x) => x.id === id);
          if (kind === 'valid' || kind === 'invalid') {
            if (p.mine) { UI.toast('不能给自己的内容投票'); return; }
            if (p['voted' + (kind === 'valid' ? 'Valid' : 'Invalid')]) { UI.toast('你已经反馈过了'); return; }
            Store.votePost(id, kind);
            UI.toast(kind === 'valid' ? '谢谢反馈 · 该内容保持排序' : '已标记失效 · 多次反馈会降低排序', kind === 'valid' ? 'check' : 'alert');
          } else {
            Store.votePost(id, kind);
            App.rerender();
          }
        };
      });
      const pub = root.querySelector('[data-act="publish"]');
      if (pub) pub.onclick = () => this.openPublish({});
      const fold = root.querySelector('[data-act="folded"]');
      if (fold) fold.onclick = () => this.showFolded();
      const ai = root.querySelector('[data-act="ai"]');
      if (ai) ai.onclick = () => App.openAI('按今天剩下的时间，排一条半日路线');
      const city = root.querySelector('[data-act="city"]');
      if (city) city.onclick = () => this.openCityPicker();
      const search = root.querySelector('[data-act="search"]');
      if (search) search.onclick = () => UI.toast('搜索：此刻 / 推荐 / 文化 / 问答');
      const bell = root.querySelector('[data-act="bell"]');
      if (bell) bell.onclick = () => App.openNotifications();
      root.querySelectorAll('[data-act="ask"]').forEach((b) => { b.onclick = () => UI.toast('提问已发布 · 7 天后自动折叠'); });
      root.querySelectorAll('[data-act="post-more"]').forEach((b) => {
        b.onclick = (e) => {
          e.stopPropagation();
          UI.sheet({
            title: '内容操作',
            body: `<div class="menu" style="margin:0">
              <button class="mrow"><span class="ic">${UI.icon('bookmark', 15)}</span><span class="t">收藏</span></button>
              <button class="mrow"><span class="ic">${UI.icon('flag', 15)}</span><span class="t">举报</span><span class="r">24 小时内响应</span></button>
              <button class="mrow"><span class="ic">${UI.icon('eye', 15)}</span><span class="t">不感兴趣</span></button>
            </div>`,
          });
        };
      });
      const c = root.querySelector('[data-act="culture"]');
      if (c) c.onclick = () => UI.toast('文化卡详情：西湖十景 · 可被 AI 引用');
    },

    showFolded() {
      const folded = Store.state.posts.filter((p) => Store.isExpired(p));
      UI.sheet({
        title: '已折叠的过期内容',
        sub: '过期后降权或折叠，作者可续期一次',
        body: folded.map((p) => `<div style="padding:12px;border:1px solid var(--line);border-radius:12px;background:#fff;margin-bottom:8px;opacity:.8">
          <div style="display:flex;align-items:center;gap:7px;font-size:10px;color:var(--muted)">
            <span class="avatar ${p.hue}" style="width:20px;height:20px;font-size:8px">${p.initial}</span>${UI.esc(p.author)} · ${UI.esc(p.place)}
            <span class="badge draft" style="margin-left:auto">已过期</span>
          </div>
          <p style="font-size:12px;line-height:1.6;margin:7px 0 9px">${p.text}</p>
          ${p.mine ? `<button class="btn sm soft" data-renew>续期一次（6 小时）</button>` : ''}
        </div>`).join(''),
        onMount(layer, close) {
          const r = layer.querySelector('[data-renew]');
          if (r) r.onclick = () => {
            Store.commit((s) => { const p = s.posts.find((x) => x.mine && Store.isExpired(x)); if (p) p.ago = 0; });
            close(); App.rerender(); UI.toast('已续期 · 6 小时后再次折叠');
          };
        },
      });
    },

    openCityPicker() {
      const s = Store.state;
      const cities = Store.litCities();
      UI.sheet({
        title: '切换城市',
        sub: '公共区域按城市组织 · 已点亮城市',
        body: `<button class="city-search-entry" data-search>
            ${UI.icon('search', 16)}<span>搜索城市、拼音或省份</span>${UI.icon('right', 14)}
          </button>
          <div class="chips" style="padding:12px 0 10px;flex-wrap:wrap">
            ${cities.map((c) => `<button class="chip ${c.name === s.currentCity ? 'on' : ''}" data-city="${c.name}">${c.name}${c.name === s.currentCity ? ' · 当前' : ''}</button>`).join('')}
          </div>
          <div class="menu" style="margin:0">
            <button class="mrow" data-manual><span class="ic">${UI.icon('pin', 15)}</span><span class="t">手动补录城市<span>上传带 EXIF 的照片或票据 · 每月 5 次</span></span><span class="r">${UI.icon('right', 13)}</span></button>
            <button class="mrow" data-browse><span class="ic">${UI.icon('compass', 15)}</span><span class="t">浏览全部城市<span>按省份与拼音查找 · 可看点亮状态</span></span><span class="r">${UI.icon('right', 13)}</span></button>
          </div>
          <p class="hint" style="margin:12px 3px 0">当前演示内容集中在杭州，切换城市后内容会相应减少。</p>`,
        onMount(layer, close) {
          layer.querySelectorAll('[data-city]').forEach((b) => {
            b.onclick = () => {
              if (b.dataset.city !== '杭州') { UI.toast('演示内容主要集中在杭州'); return; }
              Store.setCity(b.dataset.city); close(); App.rerender();
            };
          });
          const openSearch = () => { close(); setTimeout(() => App.openCitySearch(), 90); };
          layer.querySelector('[data-search]').onclick = openSearch;
          layer.querySelector('[data-browse]').onclick = openSearch;
          layer.querySelector('[data-manual]').onclick = () => { close(); setTimeout(() => App.screens.me.openManual(), 90); };
        },
      });
    },

    /* ---------------- publish ---------------- */
    openPublish(opts) {
      const s = Store.state;
      const fromBox = opts.fromBox;
      const place = opts.place || '断桥残雪';
      let onSite = true;
      let type = 'now';
      let text = fromBox ? `从「${fromBox.title}」里挑了几张照片。${place}的风把桂花吹到了北山街，湖边比想象中安静。` : '';
      let images = fromBox ? fromBox.photos.slice(0, 3) : ['assets/img/pic01.jpg', 'assets/img/pic14.jpg', 'assets/img/pic10.jpg'];
      let pw = false;

      const typeMeta = {
        now: { name: '此刻', desc: '现场情况 · 6 小时', ttl: '6 小时', ic: 'clock' },
        today: { name: '今日推荐', desc: '当天可去 · 24 小时', ttl: '24 小时', ic: 'sun' },
        exp: { name: '长期经验', desc: '避坑与交通 · 30 天', ttl: '30 天', ic: 'bookmark' },
      };

      const bodyHTML = () => `
        <div class="publish-type">
          ${Object.entries(typeMeta).map(([k, m]) => `
            <button class="ptype ${type === k ? 'on' : ''} ${k === 'now' && !onSite ? 'dis' : ''}" data-type="${k}">
              <div class="ic">${UI.icon(m.ic, 15)}</div>
              <b>${m.name}</b><span>${m.desc}</span>
              ${k === 'now' && !onSite ? '<span class="lock">不在现场</span>' : ''}
            </button>`).join('')}
        </div>

        <div class="compose">
          <textarea maxlength="500" data-text placeholder="现场是什么情况？">${UI.esc(text)}</textarea>
          <div class="counter"><span data-count>${text.length}</span>/500</div>
          <div class="tools">
            ${images.map((src, i) => `<div class="pic"><img src="${src}" alt=""><button data-rm="${i}">${UI.icon('close', 9)}</button></div>`).join('')}
            <button data-add>${UI.icon('camera', 18)}</button>
          </div>
        </div>

        <div style="margin-top:12px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:0 13px">
          <div class="field-row">
            <span class="ic">${UI.icon('pin', 14)}</span>
            <div class="t"><b>${place}</b><span>距发布位置 320m</span></div>
            <span class="ok">${UI.icon('check', 11)}现场校验通过</span>
          </div>
          <div class="field-row">
            <span class="ic">${UI.icon('clock', 14)}</span>
            <div class="t">有效期<span>系统按类型自动设置</span></div>
            <span class="v">${typeMeta[type].ttl}</span>
          </div>
          <div class="field-row" style="cursor:pointer" data-toggle-site>
            <span class="ic">${UI.icon('locate', 14)}</span>
            <div class="t">当前位置<span>${onSite ? '在城市内，距地点 320m' : '不在现场 · 只能发布经验'}</span></div>
            <span class="switch" style="transform:scale(.8);margin-left:auto"><input type="checkbox" ${onSite ? '' : 'checked'} data-site><i></i></span>
          </div>
        </div>

        <div class="preview-mini">
          <div class="k">公共副本预览 · 发布后所有人可见</div>
          <div class="line"><span>位置精度</span><b>西湖景区（商圈级）</b></div>
          <div class="line"><span>EXIF 坐标</span><b>已移除</b></div>
          <div class="line"><span>人脸 / 车牌 / 门牌</span><b>${images.length ? '已检测 1 处，将自动模糊' : '无'}</b></div>
          <div class="line"><span>原回忆盒</span><b>权限不变 · 仅本人可见</b></div>
        </div>
        <p class="hint" style="margin:10px 2px 0">新用户前 3 条内容先审后发；敏感内容进入机器 + 人工审核队列。</p>
      `;

      UI.sheet({
        title: fromBox ? '发布公共副本' : '发布',
        sub: fromBox ? '从回忆盒生成公共副本 · 原盒权限不变' : '选择类型与地点 · 发布前预览',
        tall: true,
        body: bodyHTML(),
        footer: `<button class="btn primary block" data-submit style="margin-top:14px">${UI.icon('send', 16)}提交审核</button>`,
        onMount(layer, close) {
          const renderBody = () => {
            layer.querySelector('.sheet').innerHTML = `<div class="sheet-grab"></div>
              <div class="sheet-head"><div><h3>${fromBox ? '发布公共副本' : '发布'}</h3><div class="sub">${fromBox ? '从回忆盒生成公共副本 · 原盒权限不变' : '选择类型与地点 · 发布前预览'}</div></div>
              <button class="sheet-close">${UI.icon('close', 15)}</button></div>
              <div class="sheet-body">${bodyHTML()}</div>
              <button class="btn primary block" data-submit style="margin-top:14px">${UI.icon('send', 16)}提交审核</button>`;
            layer.querySelector('.sheet-close').onclick = close;
            bind();
          };

          const bind = () => {
            const ta = layer.querySelector('[data-text]');
            ta.oninput = () => {
              text = ta.value;
              layer.querySelector('[data-count]').textContent = text.length;
            };
            layer.querySelectorAll('[data-type]').forEach((b) => {
              b.onclick = () => {
                const k = b.dataset.type;
                if (k === 'now' && !onSite) { UI.toast('不在现场，只能发布「长期经验」', 'alert'); return; }
                type = k; renderBody();
              };
            });
            layer.querySelectorAll('[data-rm]').forEach((b) => {
              b.onclick = () => { images.splice(+b.dataset.rm, 1); renderBody(); };
            });
            layer.querySelector('[data-add]').onclick = () => { UI.toast('从相册选择 · 最多 9 张'); };
            const site = layer.querySelector('[data-site]');
            if (site) site.onchange = () => {
              onSite = !site.checked;
              if (!onSite && type === 'now') { type = 'exp'; UI.toast('已切换为「长期经验」· 现场标识不可购买或伪造', 'alert'); }
              renderBody();
            };
            layer.querySelector('[data-submit]').onclick = () => {
              if (!text.trim()) { UI.toast('写点什么再发布吧'); return; }
              if (text.length > 500) { UI.toast('文字不超过 500 字'); return; }
              const btn = layer.querySelector('[data-submit]');
              btn.disabled = true;
              btn.innerHTML = `<span class="spin" style="border-top-color:#fff;border-color:rgba(255,255,255,.3);border-top-color:#fff"></span> 审核中…`;
              setTimeout(() => {
                Store.addPost({
                  type: type === 'exp' ? 'long' : type,
                  author: s.user.name, initial: s.user.initial, hue: s.user.hue, verified: true,
                  place, dist: onSite ? '320m' : '—', area: '西湖景区',
                  text: text.replace(/\n/g, '<br>'), img: images[0] || null,
                  expired: false, onSite,
                });
                if (fromBox) Store.markPublicCopy();
                close();
                Discover.tab = type === 'today' ? 'today' : type === 'exp' ? 'long' : 'now';
                App.rerender();
                UI.toast('已通过审核 · 公共副本已发布，私密原件未受影响', 'check');
              }, 1500);
            };
          };
          bind();
        },
      });
    },
  };

  App.screens = App.screens || {};
  App.screens.discover = Discover;
  App.openPublish = (opts) => Discover.openPublish(opts);
})();
