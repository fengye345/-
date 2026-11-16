/* ============================================================
   共享：开启 / 同城大厅 / 匹配 / 队伍房
   ============================================================ */
(function () {
  const App = (window.App = window.App || {});

  function fmtLeft(ms) {
    if (ms <= 0) return '已结束';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  const Share = {
    filter: '全部',
    timer: null,

    render(params) {
      if (params && params.view === 'team') return this.renderTeam();
      return Store.state.share.active ? this.renderHall() : this.renderGate();
    },

    mount(root, params) {
      clearInterval(this.timer);
      if (params && params.view === 'team') return this.mountTeam(root);
      if (Store.state.share.active) return this.mountHall(root);
      return this.mountGate(root);
    },

    /* ---------------- gate ---------------- */
    renderGate() {
      const s = Store.state;
      const cur = Store.current();
      return `<div class="screen">
        <div class="apphead">
          <div><h1>共享</h1><div class="sub">同城 · 同时在场 · 双方确认</div></div>
          <button class="iconbtn" data-act="shield" aria-label="安全中心">${UI.icon('shield', 18)}</button>
        </div>

        <div class="share-hero">
          <div class="kicker">SHARE MODE · 24H</div>
          <h2>此刻，和同城的人<br>一起走一段</h2>
          <p>只有已点亮当前城市、且定位仍在城市内时才能开启。共享状态默认 24 小时有效，精确位置始终不对外展示。</p>
          <button class="btn" style="background:#D8B96F;color:#14251F" data-act="open">${UI.icon('users', 16)}开启共享</button>
        </div>

        <div class="section-title"><h2>开启条件</h2><span class="more">${s.user.adult ? '全部满足' : '未满足'}</span></div>
        <div class="share-check">
          <div class="row"><span class="ok">${UI.icon('check', 12)}</span><div class="t">当前城市已点亮<span>${UI.esc(s.currentCity)} · 浙江省</span></div><span class="st">已满足</span></div>
          <div class="row"><span class="ok">${UI.icon('check', 12)}</span><div class="t">定位仍在城市内<span>距城市中心 3.2km · 精度 38m</span></div><span class="st">已满足</span></div>
          <div class="row"><span class="ok">${UI.icon('check', 12)}</span><div class="t">手机号 + 实名核验<span>结果仅用于合规与风控，不在名片展示</span></div><span class="st">已满足</span></div>
          <div class="row"><span class="ok">${UI.icon('check', 12)}</span><div class="t">年满 18 周岁<span>陌生人匹配仅对成年人开放</span></div><span class="st">已满足</span></div>
        </div>

        <div class="section-title"><h2>安全边界</h2><span class="more">设计取舍</span></div>
        <div style="padding:0 20px;display:flex;flex-direction:column;gap:8px">
          ${[
            ['eye', '距离只显示三档', '同城 / 3 公里内 / 1 公里内，不显示精确坐标'],
            ['message', '匹配前不能私信', '双方表达喜欢后才建立匹配与聊天'],
            ['pin', '不共享实时位置', '集合点选在公共场所，聊天内不发送坐标'],
          ].map(([ic, t, d]) => `
            <div style="display:flex;gap:10px;padding:11px 12px;background:rgba(255,255,255,.55);border:1px solid var(--line-2);border-radius:14px">
              <span style="width:30px;height:30px;border-radius:9px;background:var(--jade-wash);color:var(--jade);display:grid;place-items:center;flex:none">${UI.icon(ic, 15)}</span>
              <div><div style="font-size:12px;font-weight:600">${t}</div><div style="font-size:10px;color:var(--muted);margin-top:2px;line-height:1.5">${d}</div></div>
            </div>`).join('')}
        </div>

        <div class="footer-note">首版只在已点亮城市开放 · 不跨城市推荐<br>离开城市超过 5 公里，共享状态自动暂停</div>
      </div>`;
    },

    mountGate(root) {
      root.querySelectorAll('[data-act="open"]').forEach((b) => { b.onclick = () => this.openCard(); });
      root.querySelector('[data-act="shield"]').onclick = () => this.openSafety();
    },

    openCard() {
      const s = Store.state;
      const total = s.hall.length;
      UI.sheet({
        title: '共享名片',
        sub: '发布前预览 · 可随时关闭',
        body: `<div style="border-radius:18px;overflow:hidden;border:1px solid var(--line);background:#fff;padding:16px;position:relative;margin-bottom:14px">
            <div style="display:flex;gap:11px;align-items:center">
              <span class="avatar ${s.user.hue}" style="width:54px;height:54px;font-size:19px;border-radius:18px">${s.user.initial}</span>
              <div>
                <div style="display:flex;align-items:center;gap:6px"><b style="font-size:15px">${s.user.name}</b><span style="font-size:10.5px;color:var(--muted)">26 岁 · 女</span></div>
                <div style="font-size:10px;color:var(--jade);display:flex;gap:4px;align-items:center;margin-top:3px">${UI.icon('shield', 11)}已实名 · 信用良好</div>
              </div>
              <span class="badge clay" style="margin-left:auto">预览</span>
            </div>
            <div style="display:flex;gap:5px;margin-top:11px;flex-wrap:wrap">
              ${['摄影', '徒步', '咖啡', '慢节奏'].map((t) => `<span style="font-size:9.5px;background:var(--paper-2);padding:3px 8px;border-radius:5px">${t}</span>`).join('')}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:13px;padding-top:12px;border-top:1px solid var(--line-2)">
              <div><div style="font-size:9px;color:var(--muted)">到访日期</div><div style="font-size:11px;font-weight:500;margin-top:2px">10.18 — 10.21</div></div>
              <div><div style="font-size:9px;color:var(--muted)">想找的同伴</div><div style="font-size:11px;font-weight:500;margin-top:2px">拍照 / 看展搭子</div></div>
              <div><div style="font-size:9px;color:var(--muted)">距离显示</div><div style="font-size:11px;font-weight:500;margin-top:2px">1 公里内</div></div>
              <div><div style="font-size:9px;color:var(--muted)">语言</div><div style="font-size:11px;font-weight:500;margin-top:2px">中文 · 英文</div></div>
            </div>
            <div style="margin-top:12px;padding:8px 10px;border-radius:9px;background:var(--gold-wash);font-size:9.5px;color:#7B5F28;line-height:1.5">名片不展示手机号、社交账号和精确位置。你随时可以关闭共享。</div>
          </div>
          <div style="font-size:10px;letter-spacing:.12em;color:var(--muted);margin:0 2px 7px">可见时长</div>
          <div class="chips" style="padding:0 0 4px">
            <button class="chip on">24 小时</button><button class="chip">8 小时</button><button class="chip">本次停留</button>
          </div>
          <p class="hint" style="margin:10px 2px 0">同城当前有 ${total} 位旅行者开启了共享，发布后可进入大厅筛选。</p>`,
        footer: `<button class="btn primary block" data-go style="margin-top:14px">${UI.icon('users', 16)}发布名片并进入大厅</button>`,
        onMount(layer, close) {
          layer.querySelector('[data-go]').onclick = () => {
            Store.startShare();
            close();
            UI.toast('共享已开启 · 24 小时后自动结束', 'check');
            App.rerender();
          };
        },
      });
    },

    /* ---------------- hall ---------------- */
    renderHall() {
      const s = Store.state;
      const likes = s.share.likes || [];
      const filtered = this.filter === '全部' ? s.hall : s.hall.filter((u) => u.tags.includes(this.filter));
      const matched = likes.length;

      return `<div class="screen">
        <div class="apphead">
          <div><h1>共享</h1><div class="sub">杭州 · 同城大厅</div></div>
          <div class="apphead-actions">
            <button class="iconbtn" data-act="safety" aria-label="安全中心">${UI.icon('shield', 18)}</button>
            <button class="iconbtn" data-act="more" aria-label="更多">${UI.icon('more', 18)}</button>
          </div>
        </div>

        <div class="hall-head" style="padding-top:0">
          <div class="hall-status"><span class="live"></span><b>共享中</b><span>· 已发布名片</span></div>
          <span class="countdown" id="hallCountdown">23:59:59</span>
        </div>

        <div class="hall-sum">
          <div class="hall-stat"><b>${s.hall.length + 6}</b><span>同城可匹配</span></div>
          <div class="hall-stat"><b>${matched}</b><span>我表达的喜欢</span></div>
          <div class="hall-stat"><b>2</b><span>等待你回应</span></div>
        </div>

        <div class="chips" style="padding-top:2px">
          ${['全部', '摄影', '徒步', '夜游', '咖啡'].map((t) => `<button class="chip ${this.filter === t ? 'on' : ''}" data-filter="${t}">${t}</button>`).join('')}
        </div>

        ${filtered.map((u) => {
          const liked = likes.includes(u.id);
          return `<div class="person" data-person="${u.id}">
            <div class="person-top">
              <span class="avatar ${u.hue}">${u.initial}</span>
              <div class="id">
                <div class="nm"><b>${UI.esc(u.name)}</b><span class="age">${u.age}</span>
                  ${u.verified ? `<span class="v">${UI.icon('shield', 13)}</span>` : ''}</div>
                <div class="tags">${u.tags.map((t) => `<span>${t}</span>`).join('')}</div>
              </div>
              <div class="dist">${UI.icon('pin', 11)}${u.dist}</div>
            </div>
            <div class="why">${UI.icon('sparkle', 13)}<div>${u.why}</div></div>
            <div class="acts">
              <span class="hint" style="margin-right:auto">${UI.esc(u.note)}</span>
              <button class="skip" data-skip="${u.id}">跳过</button>
              <button class="btn sm ${liked ? 'clay' : 'primary'} like ${liked ? 'liked' : ''}" data-like="${u.id}">
                ${liked ? UI.iconFilled('heart', 14) : UI.icon('heart', 14)}${liked ? '已喜欢' : '喜欢'}</button>
            </div>
          </div>`;
        }).join('')}

        <div class="footer-note">所有匹配都需要双方确认 · 关闭共享后立即从大厅移除<br>被举报的用户在复核期间不再进入大厅</div>
      </div>`;
    },

    mountHall(root) {
      const el = root.querySelector('#hallCountdown');
      const tick = () => {
        if (!el || !document.body.contains(el)) { clearInterval(this.timer); return; }
        el.textContent = fmtLeft(Store.shareLeft());
      };
      tick();
      this.timer = setInterval(tick, 1000);

      root.querySelectorAll('[data-filter]').forEach((b) => {
        b.onclick = () => { this.filter = b.dataset.filter; App.rerender(); };
      });
      root.querySelectorAll('[data-like]').forEach((b) => {
        b.onclick = () => this.like(b.dataset.like);
      });
      root.querySelectorAll('[data-skip]').forEach((b) => {
        b.onclick = () => UI.toast('已跳过 · 不会通知对方');
      });
      root.querySelector('[data-act="safety"]').onclick = () => this.openSafety();
      root.querySelector('[data-act="more"]').onclick = () => this.openMore();
    },

    like(id) {
      const u = Store.state.hall.find((x) => x.id === id);
      if (!u) return;
      if (Store.state.share.likes.includes(id)) { UI.toast('已表达过喜欢，等待对方回应'); return; }
      Store.likeUser(id);
      if (id === 'u1') {
        setTimeout(() => this.showMatch(u), 380);
      } else {
        UI.toast(`已向 ${u.name} 表达喜欢 · 双方同意后才会匹配`);
        App.rerender();
      }
    },

    showMatch(u) {
      Store.match(u.id);
      const node = UI.el(`<div class="match-screen">
        <div class="match-avatars">
          <span class="avatar a3" style="width:84px;height:84px;font-size:28px">澈</span>
          <span class="heart">${UI.iconFilled('heart', 16)}</span>
          <span class="avatar ${u.hue}" style="width:84px;height:84px;font-size:28px;margin-left:-16px">${u.initial}</span>
        </div>
        <h2>你们互相喜欢</h2>
        <p>${UI.esc(u.name)} 也喜欢了你的名片。平台不会在你确认前展示对方的任何联系方式。</p>
        <div class="match-why"><b>匹配理由</b><br>${u.why.replace(/<\/?em>/g, '')}</div>
        <div class="match-actions">
          <button class="btn" style="background:#D8B96F;color:#14251F" data-team>${UI.icon('users', 16)}和 ${UI.esc(u.name)} 组队</button>
          <button class="btn" style="background:rgba(255,255,255,.08);color:#F7F2E4;border:1px solid rgba(255,255,255,.16)" data-later>继续看看</button>
        </div>
      </div>`);
      node.querySelector('[data-team]').onclick = () => {
        Store.joinTeam();
        node.remove();
        location.hash = '#/share/team';
        UI.toast('已加入队伍 · 记得在公共场所集合', 'users');
      };
      node.querySelector('[data-later]').onclick = () => { node.remove(); App.rerender(); };
      document.getElementById('overlays').appendChild(node);
    },

    openMore() {
      UI.sheet({
        title: '共享设置',
        body: `<div class="menu" style="margin:0">
          <button class="mrow" data-a="close"><span class="ic">${UI.icon('close', 15)}</span><span class="t">关闭共享<span>立即从大厅移除，队伍内保留成员身份</span></span>${UI.icon('right', 13)}</button>
          <button class="mrow" data-a="leave"><span class="ic">${UI.icon('pin', 15)}</span><span class="t">模拟离开城市 5 公里<span>验证自动暂停规则</span></span>${UI.icon('right', 13)}</button>
          <button class="mrow" data-a="edit"><span class="ic">${UI.icon('edit', 15)}</span><span class="t">编辑共享名片</span>${UI.icon('right', 13)}</button>
        </div>`,
        onMount(layer, close) {
          layer.querySelector('[data-a="close"]').onclick = () => { Store.stopShare(); close(); UI.toast('共享已关闭 · 队伍内仍保留成员身份'); };
          layer.querySelector('[data-a="leave"]').onclick = () => {
            Store.stopShare(); close();
            UI.toast('已离开杭州 5 公里 · 共享已自动暂停', 'pin');
          };
          layer.querySelector('[data-a="edit"]').onclick = () => { close(); Share.openCard(); };
        },
      });
    },

    openSafety() {
      UI.sheet({
        title: '安全中心',
        sub: '队伍内任何成员都能随时使用',
        body: `<div class="menu" style="margin:0">
          <button class="mrow" data-a="report"><span class="ic">${UI.icon('flag', 15)}</span><span class="t">举报用户或内容<span>24 小时内首次响应 · 复核期间移出大厅</span></span>${UI.icon('right', 13)}</button>
          <button class="mrow" data-a="block"><span class="ic">${UI.icon('shield', 15)}</span><span class="t">拉黑<span>屏蔽后互不可见</span></span>${UI.icon('right', 13)}</button>
          <button class="mrow" data-a="sos"><span class="ic">${UI.icon('phone', 15)}</span><span class="t" style="color:var(--clay)">一键求助<span style="color:var(--muted)">发送定位给紧急联系人并拨打 110</span></span>${UI.icon('right', 13)}</button>
        </div>
        <div style="margin-top:14px;padding:12px;border-radius:12px;background:var(--jade-wash);font-size:10.5px;line-height:1.7;color:#315244">
          建议在公共场所集合；不要向陌生人转账或透露住宿门牌；遇到危险优先离开现场并报警。
        </div>`,
        onMount(layer) {
          layer.querySelector('[data-a="report"]').onclick = () => { UI.toast('举报已提交 · 我们将在 24 小时内处理', 'flag'); };
          layer.querySelector('[data-a="block"]').onclick = () => { UI.toast('已拉黑 · 双方互不可见', 'shield'); };
          layer.querySelector('[data-a="sos"]').onclick = () => { UI.toast('已向紧急联系人发送集合点位置', 'phone'); };
        },
      });
    },

    /* ---------------- team ---------------- */
    renderTeam() {
      const t = Store.state.team;
      const msgs = t.messages.map((m) => {
        if (m.sys) return `<div class="chat-sys">${UI.esc(m.sys)}</div>`;
        if (m.me) return `<div class="msg me"><span class="tm">${m.time}</span><div class="bubble">${UI.esc(m.text)}</div></div>`;
        return `<div class="msg"><span class="avatar ${m.hue}">${m.initial}</span><div><div class="bubble">${UI.esc(m.text)}</div><div class="tm" style="margin:3px 0 0 2px">${UI.esc(m.who)} · ${m.time}</div></div></div>`;
      }).join('');

      return `<div class="screen team-screen" style="padding-bottom:0">
        <div class="team-head">
          <button class="iconbtn plain" data-act="back" aria-label="返回">${UI.icon('left', 19)}</button>
          <div class="team-title"><b>${UI.esc(t.name)}</b><span>${t.members.length}/${t.cap} 人 · 杭州</span></div>
          <button class="iconbtn plain" data-act="safety" aria-label="安全中心" style="color:var(--clay)">${UI.icon('shield', 19)}</button>
        </div>

        <div class="team-cover">
          <div class="team-meet">
            <span class="ic">${UI.icon('pin', 17)}</span>
            <div><b>${UI.esc(t.meeting.place)}</b><span>${UI.esc(t.meeting.time)} · ${UI.esc(t.meeting.note)}</span></div>
            <span class="map" data-act="map">${UI.icon('map', 12)}地图</span>
          </div>
        </div>

        <div class="members">
          ${t.members.map((m) => `<div class="member ${m.leader ? 'leader' : ''}">
            <span class="avatar ${m.hue}" style="${m.me ? 'box-shadow:0 0 0 2px var(--jade)' : ''}">${m.initial}</span>
            <span>${UI.esc(m.name)}</span>
          </div>`).join('')}
          <div class="member"><span class="avatar" style="background:transparent;border:1px dashed #CFC8B7;color:var(--muted)">${UI.icon('plus', 14)}</span><span>邀请</span></div>
        </div>

        <div class="chat">${msgs}</div>
        <div class="chat-note">${UI.icon('shield', 14)}队伍聊天不共享实时位置；敏感内容会进入审核。解散后记录保留 30 天，仅用于投诉与安全处理。</div>
        <div class="chat-input">
          <button class="iconbtn plain" data-act="plus" aria-label="更多">${UI.icon('plus', 18)}</button>
          <div class="field" data-input data-ph="说点什么…" role="textbox" contenteditable="true" aria-label="输入消息"></div>
          <button class="send" data-act="send" aria-label="发送">${UI.icon('send', 17)}</button>
        </div>
      </div>`;
    },

    mountTeam(root) {
      root.querySelector('[data-act="back"]').onclick = () => { location.hash = '#/share'; };
      root.querySelector('[data-act="safety"]').onclick = () => this.openSafety();
      root.querySelector('[data-act="map"]').onclick = () => UI.toast('集合点：九溪公交站 C 口 · 公共场所');
      root.querySelector('[data-act="plus"]').onclick = () => UI.toast('可发送：图片 / 集合点 / 行程卡');
      const field = root.querySelector('[data-input]');
      const send = () => {
        const text = (field.textContent || '').trim();
        if (!text) return;
        Store.sendMessage(text);
        field.textContent = '';
        App.rerender();
        setTimeout(() => {
          const body = document.querySelector('.screen');
          if (body) body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
        }, 60);
      };
      field.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
      });
      root.querySelector('[data-act="send"]').onclick = send;
    },
  };

  App.screens = App.screens || {};
  App.screens.share = Share;
})();
