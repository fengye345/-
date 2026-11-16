/* ============================================================
   回忆：列表 / 编辑器 / 模板 / 分享 / 回收站
   ============================================================ */
(function () {
  const App = (window.App = window.App || {});

  const TPL = [
    { id: 'magazine', name: '杂志', desc: '大标题 · 留白' },
    { id: 'film', name: '胶片', desc: '颗粒 · 时间码' },
    { id: 'minimal', name: '极简', desc: '单图 · 窄边距' },
  ];

  const Memory = {
    filter: 'all',
    tab: 'story',
    day: 0,

    render(params) {
      if (params && params.id) return this.renderDetail(Store.box(params.id));
      return this.renderList();
    },

    mount(root, params) {
      if (params && params.id) return this.mountDetail(root, Store.box(params.id));
      this.mountList(root);
    },

    /* ---------------- list ---------------- */
    renderList() {
      const s = Store.state;
      const boxes = s.boxes;
      let list = boxes;
      if (this.filter === 'draft') list = boxes.filter((b) => b.status === 'draft');
      if (this.filter === 'done') list = boxes.filter((b) => b.status === 'done');

      const feature = list.find((b) => b.status === 'draft') || list[0];
      const rest = list.filter((b) => b !== feature);
      const totalPhotos = boxes.reduce((n, b) => n + (b.count || 0), 0);

      return `<div class="screen">
        <div class="apphead">
          <div>
            <h1>回忆</h1>
            <div class="sub">${boxes.length} 个盒子 · ${totalPhotos} 张照片 · 自动成团</div>
          </div>
          <div class="apphead-actions">
            <button class="iconbtn" data-act="search" aria-label="搜索">${UI.icon('search', 18)}</button>
            <button class="iconbtn" data-act="new" aria-label="新建">${UI.icon('plus', 18)}</button>
          </div>
        </div>

        <div class="chips" style="padding-top:0">
          ${[['all', '全部'], ['draft', '草稿'], ['done', '已完成'], ['recycle', '回收站']].map(([k, n]) => `
            <button class="chip ${this.filter === k ? 'on' : ''}" data-filter="${k}">${n}${k === 'recycle' ? ` ${s.recycle.length}` : ''}</button>`).join('')}
        </div>

        ${feature ? `
        <div class="mem-hero">
          <div class="mem-feature" data-act="open" data-id="${feature.id}">
            <img src="${feature.cover}" alt="${UI.esc(feature.title)}">
            <div class="veil"></div>
            <div class="top">
              <span class="badge glass">${feature.status === 'draft' ? '草稿 · 自动保存' : '已完成'}</span>
              <span class="badge glass">${feature.count} 张</span>
            </div>
            <div class="bottom">
              <div class="kicker">${UI.esc(feature.kicker || '')}</div>
              <h2>${UI.esc(feature.title)}</h2>
              <div class="meta"><span>${UI.esc(feature.range)}</span><i></i><span>${UI.esc(feature.city)}</span><i></i><span>${feature.count} 张素材</span></div>
            </div>
            <div class="open">${UI.icon('right', 16)}</div>
          </div>
        </div>` : `<div class="empty"><div class="ic">${UI.icon('layers', 24)}</div><b>还没有回忆盒</b><p>到达新城市后，系统会按时间和地点自动成团</p></div>`}

        ${rest.length ? `<div class="section-title"><h2>更多旅程</h2><span class="more">按最近编辑排序</span></div>
        <div class="mem-grid">
          ${rest.map((b) => `
            <button class="mem-card" data-act="open" data-id="${b.id}">
              <div class="ph">
                <img src="${b.cover}" alt="">
                <div class="veil"></div>
                <div class="tag">${b.status === 'draft' ? '<span class="badge draft">草稿</span>' : `<span class="badge glass">${b.template === 'film' ? '胶片' : b.template === 'minimal' ? '极简' : '杂志'}</span>`}</div>
                <div class="count">${UI.icon('image', 11)} ${b.count}</div>
              </div>
              <div class="body">
                <h3>${UI.esc(b.title)}</h3>
                <div class="meta"><span>${UI.esc(b.range)}</span></div>
              </div>
            </button>`).join('')}
        </div>` : ''}

        ${this.filter === 'recycle' ? `
          <div class="section-title"><h2>回收站</h2><span class="more">30 天后自动删除</span></div>
          ${s.recycle.length ? s.recycle.map((r) => `
            <div class="recycle-row">
              ${UI.icon('trash', 14)}
              <span>${UI.esc(r.title)} · ${r.deleted}</span>
              <span class="r">剩 ${r.left} 天 ${UI.icon('right', 12)}</span>
            </div>`).join('') : `<p class="hint" style="padding:0 20px">回收站是空的</p>`}
        ` : ''}

        <div class="footer-note">回忆盒默认仅本人可见 · 分享会生成带有效期的链接<br>原盒权限不变，撤销链接后已下载的文件无法追回</div>
      </div>`;
    },

    mountList(root) {
      root.querySelectorAll('[data-filter]').forEach((b) => {
        b.onclick = () => {
          if (b.dataset.filter === 'recycle') { this.filter = 'recycle'; App.rerender(); return; }
          this.filter = b.dataset.filter;
          App.rerender();
        };
      });
      root.querySelectorAll('[data-act="open"]').forEach((b) => {
        b.onclick = () => { location.hash = '#/memory/' + b.dataset.id; };
      });
      root.querySelector('[data-act="new"]').onclick = () => this.openCreate();
      root.querySelector('[data-act="search"]').onclick = () => UI.toast('搜索：按城市、日期或文字查找回忆');
    },

    openCreate() {
      UI.sheet({
        title: '生成新的回忆盒',
        sub: '自动识别 · 无需手动建相册',
        body: `<div class="create-steps">
          ${[
            ['image', '读取相册授权范围', '仅读取你允许的照片', 'done'],
            ['route', '按时间与地点聚类', '识别为一次旅行（离开常住城市 50km）', 'done'],
            ['sparkle', '去重与智能筛选', '过滤截图、模糊和重复照片', 'running'],
          ].map(([ic, t, d, st]) => `
            <div class="cstep ${st === 'running' ? 'running' : ''}">
              <div class="ico">${UI.icon(ic, 16)}</div>
              <div class="t"><b>${t}</b><span>${d}</span></div>
              <div class="st">${st === 'done' ? `${UI.icon('check', 12)}完成` : '<span class="spin"></span>进行中'}</div>
            </div>`).join('')}
        </div>
        <div class="preview-mini">
          <div class="k">识别结果</div>
          <div class="line"><span>旅行</span><b>杭州 · 2 天 1 夜</b></div>
          <div class="line"><span>可用素材</span><b>18 张照片 · 2 段视频</b></div>
          <div class="line"><span>已过滤</span><b>6 张截图 / 3 张模糊</b></div>
        </div>
        <p class="hint" style="margin:12px 2px 0">生成后可随时增删素材、调整顺序、更换模板。草稿会自动保存到云端。</p>`,
        footer: `<button class="btn primary block" data-go style="margin-top:14px">${UI.icon('sparkle', 16)}开始生成</button>`,
        onMount(layer, close) {
          layer.querySelector('[data-go]').onclick = () => {
            const btn = layer.querySelector('[data-go]');
            btn.textContent = '正在生成…';
            btn.disabled = true;
            setTimeout(() => {
              Store.createBox();
              close();
              const box = Store.state.boxes[0];
              location.hash = '#/memory/' + box.id;
              UI.toast('回忆盒已生成 · 默认仅本人可见');
            }, 1400);
          };
        },
      });
    },

    /* ---------------- detail ---------------- */
    renderDetail(box) {
      if (!box) return `<div class="screen"><div class="empty"><b>回忆盒不存在</b></div></div>`;
      const tpl = TPL.find((t) => t.id === box.template) || TPL[0];
      const day = box.days ? box.days[Math.min(this.day, box.days.length - 1)] : null;
      const photos = box.days ? box.days.flatMap((d) => d.photos) : box.photos;

      let body = '';
      if (this.tab === 'story') {
        body = `${box.days ? `<div class="mem-days">
            ${box.days.map((d, i) => `<button class="mem-day ${i === this.day ? 'on' : ''}" data-day="${i}"><b>${d.label}</b><span>${d.date}</span></button>`).join('')}
          </div>` : ''}
          <div class="day-note">${UI.icon('map', 13)}${day ? UI.esc(day.note) + ' · ' + day.photos.length + ' 张素材' : '本次旅程素材'}</div>
          <div class="photo-grid">
            ${(day ? day.photos : photos).map((src) => `<div class="photo"><img src="${src}" alt=""><span class="loc">西湖</span></div>`).join('')}
            <button class="photo add" data-act="add">${UI.icon('plus', 18)}</button>
          </div>
          <div class="tpl-row" style="grid-template-columns:1fr;padding-top:14px">
            <div style="display:flex;align-items:center;gap:10px;padding:11px 13px;border:1px dashed #D6CFBE;border-radius:12px">
              ${UI.icon('edit', 15)}<span style="font-size:11px;color:var(--ink-2)">给这一天写一句话</span>
              <span style="margin-left:auto;font-size:9.5px;color:var(--muted)">可选</span>
            </div>
          </div>`;
      } else if (this.tab === 'materials') {
        body = `<div class="chips" style="padding-top:4px"><span class="chip on">全部 ${box.count}</span><span class="chip">照片</span><span class="chip">视频</span><span class="chip">已过滤 6</span></div>
          <div class="photo-grid">
            ${photos.concat(box.photos).slice(0, 9).map((src) => `<div class="photo"><img src="${src}" alt=""></div>`).join('')}
            <button class="photo add" data-act="add">${UI.icon('plus', 18)}</button>
          </div>
          <p class="hint" style="padding:12px 20px 0">系统自动去重并过滤截图、模糊照片。被过滤的素材可以恢复。</p>`;
      } else {
        body = `<div class="tpl-row" style="grid-template-columns:1fr;padding-top:4px">
            ${[['template', '当前模板', tpl.name], ['music', '背景音乐', box.music || '未选择'], ['lock', '可见范围', '仅本人可见']].map(([ic, k, v]) => `
              <div style="display:flex;align-items:center;gap:10px;padding:12px 13px;border-bottom:1px solid var(--line-2)">
                ${UI.icon(ic, 16)}<span style="font-size:12px">${k}</span>
                <span style="margin-left:auto;font-size:11px;color:var(--muted);display:flex;gap:4px;align-items:center">${UI.esc(v)}${UI.icon('right', 12)}</span>
              </div>`).join('')}
          </div>
          <div class="tpl-row">
            ${TPL.map((t) => `
              <button class="tpl ${box.template === t.id ? 'on' : ''}" data-tpl="${t.id}">
                <div class="mini">
                  <div class="m-img" style="background-image:url('${box.cover}')"></div>
                  <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55),transparent 60%)"></div>
                  <div class="m-t" style="${t.id === 'film' ? 'font-family:var(--mono);font-size:7px;letter-spacing:.1em' : ''}">${box.title.split(' · ')[0]}</div>
                  <div class="m-line" style="bottom:20px"></div>
                  <div class="m-line" style="bottom:15px;width:40%;left:6px;right:auto"></div>
                </div>
                <div class="nm">${t.name}${UI.icon('check', 12)}</div>
              </button>`).join('')}
          </div>
          <p class="hint" style="padding:2px 20px 0">切换模板会保留已选素材与文字，只改变排版和字体。</p>`;
      }

      return `<div class="screen" style="padding-bottom:0">
        <div class="mem-cover">
          <img src="${box.cover}" alt="">
          <div class="scrim"></div>
          <div class="bar">
            <button class="iconbtn dark" data-act="back" aria-label="返回">${UI.icon('left', 18)}</button>
            <div style="display:flex;gap:7px">
              <button class="iconbtn dark" data-act="share" aria-label="分享">${UI.icon('share', 17)}</button>
              <button class="iconbtn dark" data-act="more" aria-label="更多">${UI.icon('more', 17)}</button>
            </div>
          </div>
          <div class="titles">
            <div class="kicker">${UI.esc(box.kicker || (box.status === 'draft' ? '草稿 · 自动保存' : '已完成'))}</div>
            <h1>${UI.esc(box.title)}</h1>
            <div class="meta"><span>${UI.esc(box.range)}</span><i></i><span>${box.count} 张</span><i></i><span>${box.status === 'draft' ? '编辑中' : '已归档'}</span></div>
          </div>
        </div>

        <div class="mem-tabs">
          ${[['story', '预览'], ['materials', '素材'], ['template', '模板']].map(([k, n]) => `
            <button class="mem-tab ${this.tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}
        </div>
        ${body}

        <div class="mem-toolbar">
          <button class="mem-tool" data-act="template">${UI.icon('grid', 19)}模板</button>
          <button class="mem-tool" data-act="music">${UI.icon('music', 19)}音乐</button>
          <button class="mem-tool" data-act="export">${UI.icon('export', 19)}导出</button>
          <button class="mem-tool primary" data-act="share">${UI.icon('share', 19)}分享</button>
        </div>
      </div>`;
    },

    mountDetail(root, box) {
      if (!box) return;
      root.querySelector('[data-act="back"]').onclick = () => { location.hash = '#/memory'; };
      root.querySelectorAll('[data-tab]').forEach((b) => {
        b.onclick = () => { this.tab = b.dataset.tab; App.rerender(); };
      });
      root.querySelectorAll('[data-day]').forEach((b) => {
        b.onclick = () => { this.day = +b.dataset.day; App.rerender(); };
      });
      root.querySelectorAll('[data-tpl]').forEach((b) => {
        b.onclick = () => { Store.updateBox(box.id, { template: b.dataset.tpl }); UI.toast('已切换为「' + (TPL.find((t) => t.id === b.dataset.tpl) || {}).name + '」模板'); };
      });
      root.querySelector('[data-act="template"]').onclick = () => { this.tab = 'template'; App.rerender(); };
      root.querySelector('[data-act="music"]').onclick = () => UI.toast('音乐库：轻音乐 / 城市民谣 / 环境声');
      root.querySelector('[data-act="export"]').onclick = () => UI.toast('正在导出视频 · 预计 12 秒');
      root.querySelector('[data-act="share"]').onclick = () => this.openShare(box);
      root.querySelector('[data-act="more"]').onclick = () => this.openMore(box);
      root.querySelectorAll('[data-act="add"]').forEach((b) => { b.onclick = () => UI.toast('已打开素材抽屉 · 可批量选择'); });
    },

    openShare(box) {
      const close = UI.sheet({
        title: '分享回忆盒',
        sub: '链接可设置有效期与水印',
        body: `<div style="display:flex;gap:11px;align-items:center;padding:11px;border-radius:14px;background:#fff;border:1px solid var(--line);margin-bottom:14px">
            <img src="${box.cover}" style="width:54px;height:54px;border-radius:10px;object-fit:cover" alt="">
            <div style="min-width:0">
              <div style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${UI.esc(box.title)}</div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px">${box.count} 张照片 · ${UI.esc(box.range)}</div>
            </div>
            <span class="badge live" style="margin-left:auto"><span class="dot"></span>仅链接可见</span>
          </div>

          <div style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin:0 2px 7px">链接有效期</div>
          <div class="chips" style="padding:0 0 12px">
            ${[1, 7, 30].map((d) => `<button class="chip ${(box.shareDays || 7) === d ? 'on' : ''}" data-days="${d}">${d} 天</button>`).join('')}
          </div>

          <div class="menu" style="margin:0 0 12px">
            <label class="mrow"><span class="ic">${UI.icon('lock', 15)}</span><span class="t">密码保护<span>访问时需要输入 4 位口令</span></span>
              <span class="r"><span class="switch"><input type="checkbox" data-pw><i></i></span></span></label>
            <label class="mrow"><span class="ic">${UI.icon('shield', 15)}</span><span class="t">添加水印<span>导出图片带昵称与日期</span></span>
              <span class="r"><span class="switch"><input type="checkbox" checked data-wm><i></i></span></span></label>
          </div>

          ${box.shared ? `
            <div class="preview-mini" style="margin:0 0 6px">
              <div class="k">分享链接 · ${box.shareDays || 7} 天有效</div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                <span class="mono" style="font-size:11px;color:var(--jade)">${box.shareUrl || 'https://trip.app/s/••••'}</span>
                <button class="btn sm soft" style="margin-left:auto" data-copy>复制</button>
              </div>
            </div>
            <p class="hint" style="margin:8px 2px 0">撤销后链接立即失效，但已下载的文件无法追回。</p>
          ` : `<p class="hint" style="margin:2px 2px 0">分享不会改变原回忆盒权限。链接到期后自动失效，可随时撤销。</p>`}
        `,
        footer: box.shared
          ? `<div style="display:flex;gap:8px;margin-top:14px">
              <button class="btn ghost" style="flex:1" data-revoke>撤销链接</button>
              <button class="btn primary" style="flex:1" data-done>完成</button>
            </div>`
          : `<button class="btn primary block" data-gen style="margin-top:16px">${UI.icon('link', 16)}生成分享链接</button>`,
        onMount(layer, done) {
          layer.querySelectorAll('[data-days]').forEach((b) => {
            b.onclick = () => {
              layer.querySelectorAll('[data-days]').forEach((x) => x.classList.remove('on'));
              b.classList.add('on');
              Store.updateBox(box.id, { shareDays: +b.dataset.days });
            };
          });
          const gen = layer.querySelector('[data-gen]');
          if (gen) gen.onclick = () => {
            Store.shareBox(box.id);
            UI.toast('链接已生成 · 7 天内有效', 'link');
            done();
            setTimeout(() => Memory.openShare(Store.box(box.id)), 120);
          };
          const copy = layer.querySelector('[data-copy]');
          if (copy) copy.onclick = () => {
            try { navigator.clipboard.writeText(box.shareUrl || ''); } catch (e) {}
            UI.toast('链接已复制');
          };
          const revoke = layer.querySelector('[data-revoke]');
          if (revoke) revoke.onclick = () => {
            Store.revokeBoxShare(box.id);
            UI.toast('链接已撤销 · 原回忆盒权限不变');
            done();
          };
          const dn = layer.querySelector('[data-done]');
          if (dn) dn.onclick = done;
        },
      });
      void close;
    },

    openMore(box) {
      UI.sheet({
        title: '更多操作',
        body: `<div class="menu" style="margin:0">
          <button class="mrow" data-a="pub"><span class="ic">${UI.icon('compass', 15)}</span><span class="t">发布到公共区域<span>生成公共副本 · 位置模糊到商圈</span></span><span class="r">${UI.icon('right', 13)}</span></button>
          <button class="mrow" data-a="cover"><span class="ic">${UI.icon('image', 15)}</span><span class="t">更换封面</span><span class="r">${UI.icon('right', 13)}</span></button>
          <button class="mrow" data-a="export"><span class="ic">${UI.icon('download', 15)}</span><span class="t">导出为视频</span><span class="r">1080P · 约 24MB</span></button>
          <button class="mrow danger" data-a="del"><span class="ic">${UI.icon('trash', 15)}</span><span class="t">删除回忆盒</span><span class="r">进入 30 天回收站</span></button>
        </div>
        <p class="hint" style="margin:12px 4px 0">发布公共副本后，公共内容与私密原件使用独立的删除逻辑。</p>`,
        onMount(layer, close) {
          layer.querySelector('[data-a="pub"]').onclick = () => {
            close();
            App.openPublish({ fromBox: box });
          };
          layer.querySelector('[data-a="cover"]').onclick = () => { close(); UI.toast('已打开封面推荐 · 3 个候选'); };
          layer.querySelector('[data-a="export"]').onclick = () => { close(); UI.toast('开始导出 · 可在后台继续编辑'); };
          layer.querySelector('[data-a="del"]').onclick = async () => {
            close();
            const ok = await UI.confirm({ title: '删除这个回忆盒？', text: '删除后进入 30 天回收站，所有已生成的分享链接会立即失效。', ok: '删除', danger: true });
            if (!ok) return;
            Store.deleteBox(box.id);
            location.hash = '#/memory';
            UI.toast('已移入回收站 · 30 天内可恢复', 'trash');
          };
        },
      });
    },
  };

  App.screens = App.screens || {};
  App.screens.memory = Memory;
})();
