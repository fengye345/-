/* ============================================================
   我的：资料 / 隐私 / 数据 / 注销 / 关于
   ============================================================ */
(function () {
  const App = (window.App = window.App || {});

  const Me = {
    render() {
      const s = Store.state;
      const cities = Store.litCities();
      const visits = cities.reduce((n, c) => n + (c.visits || 0), 0);
      const photos = s.boxes.reduce((n, b) => n + (b.count || 0), 0);

      return `<div class="screen">
        <div class="apphead">
          <div><h1>我的</h1><div class="sub">${s.user.joined} 加入 · 已实名</div></div>
          <button class="iconbtn" data-act="settings" aria-label="设置">${UI.icon('settings', 18)}</button>
        </div>

        <div class="profile">
          <div class="profile-card">
            <span class="avatar ${s.user.hue}" style="width:62px;height:62px;font-size:22px;border-radius:20px">${s.user.initial}</span>
            <div style="min-width:0">
              <h2>${UI.esc(s.user.name)}</h2>
              <div class="meta">26 岁 · 杭州 <span class="v">${UI.icon('shield', 10)}实名已核验</span></div>
              <div class="meta" style="margin-top:3px">${UI.esc(s.user.bio)}</div>
            </div>
            <button class="iconbtn plain edit" data-act="edit" aria-label="编辑资料">${UI.icon('edit', 17)}</button>
          </div>
        </div>

        <div class="stats">
          <div class="stat"><b>${cities.length}</b><span>点亮城市</span></div>
          <div class="stat"><b>${s.boxes.length}</b><span>回忆盒</span></div>
          <div class="stat"><b>${visits}</b><span>累计到访</span></div>
        </div>

        <div class="city-strip">
          ${cities.map((c) => `<button class="city-tile" data-city="${c.name}">
            <b>${c.name}</b><span>${c.visits} 次 · ${c.days} 天</span></button>`).join('')}
          <button class="city-tile add" data-act="manual">${UI.icon('plus', 17)}</button>
        </div>

        <div class="section-title"><h2>隐私与安全</h2><span class="more">最小必要</span></div>
        <div class="menu">
          <label class="mrow"><span class="ic">${UI.icon('eye', 15)}</span><span class="t">地图可见性<span>关闭后他人看不到你的点亮地图</span></span>
            <span class="r"><span class="switch"><input type="checkbox" data-set="mapVisible" ${s.settings.mapVisible ? 'checked' : ''}><i></i></span></span></label>
          <label class="mrow"><span class="ic">${UI.icon('locate', 15)}</span><span class="t">自动点亮<span>满足 30 分钟 + 2 个定位点时自动点亮</span></span>
            <span class="r"><span class="switch"><input type="checkbox" data-set="autoLight" ${s.settings.autoLight ? 'checked' : ''}><i></i></span></span></label>
          <label class="mrow"><span class="ic">${UI.icon('image', 15)}</span><span class="t">相册自动同步<span>仅读取你授权的范围</span></span>
            <span class="r"><span class="switch"><input type="checkbox" data-set="albumSync" ${s.settings.albumSync ? 'checked' : ''}><i></i></span></span></label>
          <label class="mrow"><span class="ic">${UI.icon('users', 15)}</span><span class="t">共享状态可见<span>关闭后立即从同城大厅移除</span></span>
            <span class="r"><span class="switch"><input type="checkbox" data-set="shareVisible" ${s.settings.shareVisible ? 'checked' : ''}><i></i></span></span></label>
          <button class="mrow" data-act="blacklist"><span class="ic">${UI.icon('shield', 15)}</span><span class="t">黑名单<span>屏蔽后互不可见</span></span><span class="r">2 人 ${UI.icon('right', 13)}</span></button>
          <button class="mrow" data-act="privacy-detail"><span class="ic">${UI.icon('lock', 15)}</span><span class="t">权限与数据说明<span>定位 7 天后降精度为城市级</span></span><span class="r">${UI.icon('right', 13)}</span></button>
        </div>

        <div class="section-title"><h2>数据与存储</h2><span class="more">${photos} 张素材</span></div>
        <div class="menu">
          <button class="mrow" data-act="export"><span class="ic">${UI.icon('download', 15)}</span><span class="t">导出我的数据<span>城市清单、到访记录与回忆盒链接</span></span><span class="r">${UI.icon('right', 13)}</span></button>
          <button class="mrow" data-act="recycle"><span class="ic">${UI.icon('trash', 15)}</span><span class="t">回收站<span>${s.recycle.length} 个回忆盒 · 30 天内可恢复</span></span><span class="r">${UI.icon('right', 13)}</span></button>
          <button class="mrow" data-act="clear-loc"><span class="ic">${UI.icon('locate', 15)}</span><span class="t">删除定位历史<span>删除后无法恢复，城市点亮状态保留</span></span><span class="r">${UI.icon('right', 13)}</span></button>
          <button class="mrow" data-act="storage"><span class="ic">${UI.icon('image', 15)}</span><span class="t">存储占用<span>相册缓存 386MB · 云端 1.2GB</span></span><span class="r">${UI.icon('right', 13)}</span></button>
        </div>

        <div class="section-title"><h2>更多</h2><span class="more">v1.0 原型</span></div>
        <div class="menu">
          <button class="mrow" data-act="notifications"><span class="ic">${UI.icon('bell', 15)}</span><span class="t">消息中心<span>${Store.unread()} 条未读</span></span><span class="r">${UI.icon('right', 13)}</span></button>
          <button class="mrow" data-act="about"><span class="ic">${UI.icon('sparkle', 15)}</span><span class="t">关于旅迹与验收对照<span>依据 PRD V1.0 实现</span></span><span class="r">${UI.icon('right', 13)}</span></button>
          <button class="mrow" data-act="reset"><span class="ic">${UI.icon('refresh', 15)}</span><span class="t">重置演示数据<span>回到首次使用的状态</span></span><span class="r">${UI.icon('right', 13)}</span></button>
          <button class="mrow danger" data-act="delete"><span class="ic">${UI.icon('trash', 15)}</span><span class="t">注销账号<span>7 天冷静期 · 公共内容去标识化</span></span><span class="r">${UI.icon('right', 13)}</span></button>
        </div>

        <div class="footer-note">旅迹 Travelog · 高保真原型 v1.0<br>数据保存在本机浏览器，不会上传</div>
      </div>`;
    },

    mount(root) {
      root.querySelectorAll('[data-set]').forEach((inp) => {
        inp.onchange = () => { Store.toggle(inp.dataset.set, inp.checked); UI.toast('设置已更新'); };
      });
      root.querySelectorAll('[data-city]').forEach((b) => {
        b.onclick = () => { Store.setCity(b.dataset.city); location.hash = '#/map'; UI.toast(`已切换到 ${b.dataset.city}`); };
      });
      const on = (act, fn) => root.querySelectorAll(`[data-act="${act}"]`).forEach((b) => { b.onclick = fn; });
      on('edit', () => this.openEdit());
      on('manual', () => this.openManual());
      on('blacklist', () => this.openBlacklist());
      on('privacy-detail', () => this.openPrivacy());
      on('export', () => UI.toast('正在打包导出 · 完成后发送下载链接', 'download'));
      on('recycle', () => { location.hash = '#/memory'; });
      on('clear-loc', async () => {
        const ok = await UI.confirm({ title: '删除定位历史？', text: '删除后 7 天内无法恢复原始轨迹，已点亮的城市与到访天数会保留。', ok: '删除', danger: true });
        if (ok) UI.toast('定位历史已删除，城市状态保留');
      });
      on('storage', () => UI.toast('相册缓存 386MB · 云端 1.2GB · 可清理缓存'));
      on('notifications', () => App.openNotifications());
      on('about', () => this.openAbout());
      on('reset', () => this.openReset());
      on('delete', () => this.openDelete());
      on('settings', () => UI.toast('设置已整合在本页'));
    },

    openEdit() {
      const s = Store.state;
      UI.sheet({
        title: '编辑资料',
        body: `<div style="display:flex;flex-direction:column;gap:9px">
          <label style="font-size:10px;color:var(--muted)">昵称</label>
          <input value="${UI.esc(s.user.name)}" data-name style="height:44px;border-radius:12px;border:1px solid var(--line);background:#fff;padding:0 12px;font-size:13px;outline:none">
          <label style="font-size:10px;color:var(--muted);margin-top:4px">一句话简介</label>
          <input value="${UI.esc(s.user.bio)}" data-bio style="height:44px;border-radius:12px;border:1px solid var(--line);background:#fff;padding:0 12px;font-size:13px;outline:none">
          <label style="font-size:10px;color:var(--muted);margin-top:4px">旅行偏好</label>
          <div class="chips" style="padding:0;flex-wrap:wrap">
            ${['摄影', '徒步', '咖啡', '博物馆', '夜游', '美食'].map((t) => `<span class="chip ${s.user.tags.includes(t) ? 'on' : ''}">${t}</span>`).join('')}
          </div>
          <p class="hint" style="margin:4px 0 0">共享模式下，昵称、年龄段、旅行标签会展示在名片中；手机号和实名信息不会展示。</p>
        </div>`,
        footer: `<button class="btn primary block" data-save style="margin-top:14px">保存</button>`,
        onMount(layer, close) {
          layer.querySelector('[data-save]').onclick = () => {
            const name = layer.querySelector('[data-name]').value.trim() || '阿澈';
            const bio = layer.querySelector('[data-bio]').value.trim();
            Store.updateUser({ name, bio, initial: name.slice(0, 1) });
            close(); UI.toast('资料已更新');
          };
        },
      });
    },

    openManual(preset) {
      const base = ['苏州', '南京', '青岛', '西安', '丽江', '张家界'];
      const options = preset && base.indexOf(preset) < 0 ? [preset].concat(base) : base;
      const initial = preset || '苏州';
      UI.sheet({
        title: '手动补录城市',
        sub: preset ? `为「${preset}」补录一次到访` : '仅作为定位失败的兜底 · 每月 5 次',
        body: `<div class="chips" style="padding:2px 0 12px;flex-wrap:wrap">
            ${options.map((c) => `<button class="chip ${c === initial ? 'on' : ''}" data-mcity="${c}">${c}</button>`).join('')}
          </div>
          <div style="display:flex;gap:9px">
            <input value="2026-10-18" style="flex:1;height:44px;border-radius:12px;border:1px solid var(--line);background:#fff;padding:0 12px;font-size:12px;outline:none">
            <button class="btn ghost" style="height:44px">${UI.icon('image', 16)}上传凭证</button>
          </div>
          <div style="margin-top:10px;padding:10px 12px;border-radius:11px;background:var(--gold-wash);font-size:10.5px;line-height:1.6;color:#7B5F28">
            需上传带 EXIF 时间与地点的照片或票据。补录记录标记「手动点亮」，进入人工审核，不计入深度点亮。
          </div>`,
        footer: `<button class="btn primary block" data-go style="margin-top:14px">提交审核</button>`,
        onMount(layer, close) {
          let city = initial;
          layer.querySelectorAll('[data-mcity]').forEach((b) => {
            b.onclick = () => {
              layer.querySelectorAll('[data-mcity]').forEach((x) => x.classList.remove('on'));
              b.classList.add('on'); city = b.dataset.mcity;
            };
          });
          layer.querySelector('[data-go]').onclick = () => {
            Store.addCityManual(city);
            close(); UI.toast(`${city} 已标记为手动点亮 · 审核中`, 'pin');
            App.rerender();
          };
        },
      });
    },

    openBlacklist() {
      UI.sheet({
        title: '黑名单',
        body: `<div class="menu" style="margin:0">
          ${[['阿泽', 'a4'], ['陈默', 'a1']].map(([n, h]) => `<div class="mrow">
            <span class="avatar ${h}" style="width:30px;height:30px;font-size:11px;border-radius:50%">${n.slice(0, 1)}</span>
            <span class="t">${n}<span>已屏蔽 · 互相不可见</span></span>
            <button class="btn sm ghost" style="margin-left:auto">解除</button>
          </div>`).join('')}
        </div>
        <p class="hint" style="margin:12px 3px 0">屏蔽后对方无法在大厅看到你，也不能申请加入你的队伍。</p>`,
      });
    },

    openPrivacy() {
      UI.sheet({
        title: '权限与数据说明',
        tall: true,
        body: `<div style="display:flex;flex-direction:column;gap:10px">
          ${[
            ['locate', '定位', '用于城市点亮判定、现场校验与同城匹配。原始定位点保留 7 天后降精度为城市级。', '使用 App 期间'],
            ['image', '相册', '仅读取你授权的照片，用于自动成团。不上传未授权内容，不用于模型训练。', '仅选中照片'],
            ['camera', '相机', 'App 内拍摄与发布。', '使用时询问'],
            ['bell', '通知', '匹配、队伍消息与安全提醒。重要安全消息不受免打扰限制。', '已开启'],
          ].map(([ic, t, d, st]) => `<div style="padding:12px;border:1px solid var(--line);border-radius:14px;background:#fff">
            <div style="display:flex;align-items:center;gap:7px">${UI.icon(ic, 15)}<b style="font-size:12px">${t}</b><span style="margin-left:auto;font-size:9.5px;color:var(--jade)">${st}</span></div>
            <p style="font-size:10px;line-height:1.65;color:var(--muted);margin:6px 0 0">${d}</p>
          </div>`).join('')}
        </div>
        <p class="hint" style="margin:12px 3px 0">所有权限都可以在系统设置中随时关闭；关闭后仍可使用手动补录等替代路径。</p>`,
      });
    },

    openAbout() {
      const ac = Store.aclist();
      UI.sheet({
        title: '关于旅迹',
        sub: '旅游记录 App · 高保真原型 v1.0',
        tall: true,
        body: `<div style="text-align:center;padding:6px 0 16px">
            <div style="width:64px;height:64px;border-radius:20px;margin:0 auto 12px;background:radial-gradient(circle at 30% 25%,#2F8A70,#0C342A);display:grid;place-items:center;color:#EFE6CF;box-shadow:0 14px 30px -14px rgba(12,52,42,.7)">${UI.icon('map', 28)}</div>
            <div style="font-family:var(--serif);font-size:20px;letter-spacing:.14em">旅迹 Travelog</div>
            <div style="font-size:10px;color:var(--muted);margin-top:4px">把到达，变成风景</div>
          </div>
          <div class="section-title" style="padding:0;margin:0 0 8px"><h2>验收标准对照</h2><span class="more">${ac.filter((x) => x.done).length}/9 已覆盖</span></div>
          <div class="ac-list">
            ${ac.map((x) => `<div class="ac ${x.done ? 'done' : ''}"><span class="box">${UI.icon('check', 9)}</span>${x.label}<span class="code">${x.code}</span></div>`).join('')}
          </div>
          <div class="menu" style="margin:4px 0 0">
            <button class="mrow"><span class="ic">${UI.icon('shield', 15)}</span><span class="t">用户协议与隐私政策</span><span class="r">${UI.icon('right', 13)}</span></button>
            <button class="mrow"><span class="ic">${UI.icon('flag', 15)}</span><span class="t">侵权投诉通道</span><span class="r">${UI.icon('right', 13)}</span></button>
            <button class="mrow"><span class="ic">${UI.icon('sparkle', 15)}</span><span class="t">开源许可</span><span class="r">${UI.icon('right', 13)}</span></button>
          </div>
          <p class="hint" style="margin:12px 3px 0">本原型依据《旅游记录 App 产品需求文档 V1.0》实现，用于范围评审与交互演示，不代表最终视觉方案。</p>`,
      });
    },

    openReset() {
      UI.sheet({
        title: '重置演示数据',
        body: `<p style="font-size:12.5px;line-height:1.8;color:var(--ink-2);margin:2px 2px 14px">将清除本机的点亮记录、回忆盒、共享状态与发布内容，回到「首次到达」的演示起点。此操作不可撤销。</p>`,
        footer: `<div style="display:flex;gap:8px"><button class="btn ghost" style="flex:1" data-c>取消</button><button class="btn primary" style="flex:1" data-ok>重置</button></div>`,
        onMount(layer, close) {
          layer.querySelector('[data-c]').onclick = close;
          layer.querySelector('[data-ok]').onclick = () => {
            Store.reset();
            close();
            location.hash = '#/map';
            UI.toast('演示数据已重置');
            setTimeout(() => App.showOnboarding(true), 300);
          };
        },
      });
    },

    openDelete() {
      if (Store.state.deletion) {
        const d = Store.state.deletion;
        UI.sheet({
          title: '账号注销中',
          body: `<div style="text-align:center;padding:10px 0">
              <div style="width:58px;height:58px;border-radius:50%;background:var(--gold-wash);color:#8A641F;display:grid;place-items:center;margin:0 auto 14px">${UI.icon('clock', 26)}</div>
              <div style="font-size:15px;font-weight:650">7 天冷静期</div>
              <p style="font-size:11.5px;line-height:1.75;color:var(--muted);margin:8px 0 0">期间登录会恢复账号。到期后将删除个人信息，公共内容去标识化，法律要求保留的内容除外。</p>
            </div>`,
          footer: `<button class="btn ghost block" data-undel style="margin-top:16px">撤销注销</button>`,
          onMount(layer, close) {
            layer.querySelector('[data-undel]').onclick = () => {
              Store.commit((s) => { s.deletion = null; s.metrics.deleted = false; });
              close(); UI.toast('已撤销注销申请');
            };
          },
        });
        return;
      }
      UI.sheet({
        title: '注销账号',
        sub: '7 天冷静期 · 可随时撤销',
        body: `<div style="display:flex;flex-direction:column;gap:8px">
            ${[
              ['clock', '7 天冷静期', '期间重新登录即恢复账号'],
              ['trash', '删除个人信息', '资料、相册缓存、定位历史与 AI 对话'],
              ['eye', '公共内容去标识化', '已发布内容保留但不再关联你的身份'],
              ['lock', '依法保留', '交易、投诉与安全记录按法规要求保留'],
            ].map(([ic, t, d]) => `<div style="display:flex;gap:10px;padding:11px 12px;background:#fff;border:1px solid var(--line-2);border-radius:12px">
              <span style="width:28px;height:28px;border-radius:8px;background:var(--paper-2);display:grid;place-items:center;color:var(--ink-2);flex:none">${UI.icon(ic, 14)}</span>
              <div><div style="font-size:11.5px;font-weight:600">${t}</div><div style="font-size:9.5px;color:var(--muted);margin-top:2px">${d}</div></div>
            </div>`).join('')}
          </div>`,
        footer: `<button class="btn clay block" data-go style="margin-top:14px">确认注销</button>`,
        onMount(layer, close) {
          layer.querySelector('[data-go]').onclick = () => {
            Store.requestDeletion();
            close(); UI.toast('已进入 7 天冷静期', 'clock');
          };
        },
      });
    },
  };

  App.screens = App.screens || {};
  App.screens.me = Me;
})();
