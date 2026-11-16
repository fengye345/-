/* ============================================================
   状态、持久化与业务动作
   ============================================================ */
(function () {
  const KEY = 'travelog.demo.v3';

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const listeners = new Set();

  const TTL = { now: 6 * 60, today: 24 * 60, long: 30 * 24 * 60 };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(window.SEED);
      const data = JSON.parse(raw);
      if (!data || data.version !== window.SEED.version) return clone(window.SEED);
      return data;
    } catch (e) {
      return clone(window.SEED);
    }
  }

  const Store = {
    state: load(),
    TTL,

    reset() {
      this.state = clone(window.SEED);
      localStorage.removeItem(KEY);
      this.save();
      this.emit();
    },

    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { /* ignore quota */ }
    },

    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    emit() { listeners.forEach((fn) => fn(this.state)); },

    commit(mutator) {
      const out = mutator(this.state);
      this.save();
      this.emit();
      return out;
    },

    /* ---------------- derived ---------------- */
    litCities() {
      const cur = this.state.currentCity;
      return Object.entries(this.state.cities)
        .filter(([, v]) => v.lit)
        .sort((a, b) => {
          const ca = a[0] === cur ? 1 : 0;
          const cb = b[0] === cur ? 1 : 0;
          if (ca !== cb) return cb - ca;
          const da = a[1].deep ? 1 : 0;
          const db = b[1].deep ? 1 : 0;
          if (da !== db) return db - da;
          return (b[1].visits || 0) - (a[1].visits || 0);
        })
        .map(([name, v]) => ({ name, ...v }));
    },
    litCount() { return this.litCities().length; },
    litProvinces() {
      return [...new Set(this.litCities().map((c) => c.province || (c.name === '北京' ? '北京市' : '')))].filter(Boolean);
    },
    provinceProgress() { return Math.round((this.litProvinces().length / 34) * 100); },
    current() {
      const name = this.state.currentCity;
      return { name, ...(this.state.cities[name] || { lit: false }) };
    },
    cityMeta(name) {
      return window.CITY_META ? window.CITY_META[name] : null;
    },
    unread() { return this.state.notifications.filter((n) => n.unread).length; },
    boxes() { return this.state.boxes; },
    box(id) { return this.state.boxes.find((b) => b.id === id); },
    draftBox() { return this.state.boxes.find((b) => b.status === 'draft'); },

    postRemaining(p) {
      const ttl = TTL[p.type] || TTL.now;
      const left = ttl - (p.ago || 0);
      return left;
    },
    isExpired(p) { return this.postRemaining(p) <= 0; },

    shareLeft() {
      const s = this.state.share;
      if (!s.active || !s.expiresAt) return 0;
      return Math.max(0, s.expiresAt - Date.now());
    },

    aclist() {
      const m = this.state.metrics;
      return [
        { code: 'AC-01', label: '自动点亮不重复', done: m.lit },
        { code: 'AC-02', label: '模拟定位拒绝点亮', done: m.cheat },
        { code: 'AC-03', label: '手动补录标记审核', done: m.manual },
        { code: 'AC-04', label: '回忆盒可编辑导出', done: m.boxCreated },
        { code: 'AC-05', label: '现场发布与过期折叠', done: m.posted },
        { code: 'AC-06', label: '公共副本私密隔离', done: m.publicCopy },
        { code: 'AC-07', label: '双方喜欢才匹配', done: m.matched },
        { code: 'AC-08', label: 'AI 标注来源与不确定', done: m.aiUsed },
        { code: 'AC-09', label: '注销冷静期与去标识', done: m.deleted },
      ];
    },

    /* ---------------- actions ---------------- */
    lightUp(city) {
      return this.commit((s) => {
        const meta = CITY_META[city] || { province: '', visits: 1, days: 1, deep: false, first: '2026.10.19' };
        s.cities[city] = {
          ...meta, lit: true, last: '今天',
          first: meta.first || '2026.10.19',
        };
        s.currentCity = city;
        s.pendingArrival = null;
        s.metrics.lit = true;
        s.metrics.litCity = city;
        s.onboarded = true;
        return s.cities[city];
      });
    },

    addCityManual(city) {
      return this.commit((s) => {
        const meta = CITY_META[city] || { province: '', visits: 1, days: 1, deep: false };
        s.cities[city] = { ...meta, lit: true, last: '手动补录', manual: true };
        s.metrics.manual = true;
        return s.cities[city];
      });
    },

    startShare() {
      return this.commit((s) => {
        s.share.active = true;
        s.share.startedAt = Date.now();
        s.share.expiresAt = Date.now() + 24 * 3600 * 1000;
        s.share.cardPublished = true;
        s.metrics.shared = true;
      });
    },
    stopShare() {
      return this.commit((s) => {
        s.share.active = false;
        s.share.expiresAt = null;
        s.share.cardPublished = false;
      });
    },
    likeUser(id) {
      return this.commit((s) => {
        if (!s.share.likes.includes(id)) s.share.likes.push(id);
      });
    },
    match(id) {
      return this.commit((s) => {
        s.share.matchId = id;
        s.metrics.matched = true;
        s.team.joined = true;
        s.team.members = s.team.members.map((m) => m.me ? { ...m } : m);
      });
    },
    joinTeam() {
      return this.commit((s) => { s.team.joined = true; });
    },
    leaveTeam() {
      return this.commit((s) => { s.team.joined = false; });
    },
    sendMessage(text) {
      return this.commit((s) => {
        s.team.messages.push({ who: '我', me: true, text, time: timeHM(Date.now()) });
      });
    },
    addPost(post) {
      return this.commit((s) => {
        s.posts.unshift({ ...post, id: 'p' + Date.now(), ago: 0, mine: true, valid: 0, invalid: 0, likes: 0, comments: 0 });
        s.metrics.posted = true;
      });
    },
    votePost(id, kind) {
      return this.commit((s) => {
        const p = s.posts.find((x) => x.id === id);
        if (!p) return;
        if (kind === 'valid') { p.valid++; p.votedValid = true; }
        if (kind === 'invalid') { p.invalid++; p.votedInvalid = true; }
        if (kind === 'like') { p.liked = !p.liked; p.likes += p.liked ? 1 : -1; }
        if (kind === 'save') { p.saved = !p.saved; }
      });
    },
    updateBox(id, patch) {
      return this.commit((s) => {
        const b = s.boxes.find((x) => x.id === id);
        if (b) Object.assign(b, patch);
      });
    },
    deleteBox(id) {
      return this.commit((s) => {
        const i = s.boxes.findIndex((x) => x.id === id);
        if (i >= 0) {
          const [b] = s.boxes.splice(i, 1);
          s.recycle.unshift({ id: 'r' + Date.now(), title: b.title, deleted: '刚刚', left: 30, cover: b.cover });
        }
      });
    },
    restoreBox(id) {
      return this.commit((s) => {
        const i = s.recycle.findIndex((x) => x.id === id);
        if (i < 0) return;
        const [r] = s.recycle.splice(i, 1);
        s.boxes.unshift({
          id: 'box-' + Date.now(), title: r.title, kicker: '已恢复', city: r.title.split(' · ')[0],
          start: '—', end: '—', range: '已从回收站恢复', cover: r.cover, photos: [r.cover],
          count: 1, status: 'done', template: 'minimal', privacy: 'private', views: 0,
        });
      });
    },
    shareBox(id) {
      return this.commit((s) => {
        const b = s.boxes.find((x) => x.id === id);
        if (b) { b.shared = true; b.shareDays = 7; b.shareUrl = 'https://trip.app/s/' + id.slice(-4) + 'k9'; }
        s.metrics.boxShared = true;
      });
    },
    revokeBoxShare(id) {
      return this.commit((s) => {
        const b = s.boxes.find((x) => x.id === id);
        if (b) { b.shared = false; b.shareUrl = null; }
      });
    },
    createBox() {
      return this.commit((s) => {
        s.boxes.unshift({
          id: 'box-' + Date.now(), title: '杭州 · 新的回忆', kicker: '自动识别 · 刚刚',
          city: '杭州', start: '10.19', end: '进行中', range: '2026.10.19 — 进行中',
          cover: 'assets/img/pic15.jpg', photos: ['assets/img/pic15.jpg', 'assets/img/pic14.jpg'],
          count: 2, status: 'draft', template: 'magazine', privacy: 'private',
          days: [{ label: 'Day 1', date: '10.19 周日', note: '自动识别', photos: ['assets/img/pic15.jpg', 'assets/img/pic14.jpg'] }],
        });
        s.metrics.boxCreated = true;
      });
    },
    toggle(key, val) {
      return this.commit((s) => { s.settings[key] = val; });
    },
    cheatAttempt() {
      return this.commit((s) => { s.metrics.cheat = true; s.pendingArrival = null; });
    },
    markPublicCopy() {
      return this.commit((s) => { s.metrics.publicCopy = true; });
    },
    markAiUsed() {
      return this.commit((s) => { s.metrics.aiUsed = true; s.ai.used = Math.min(s.ai.quota, s.ai.used + 1); });
    },
    requestDeletion() {
      return this.commit((s) => {
        s.metrics.deleted = true;
        s.deletion = { requestedAt: Date.now(), daysLeft: 7 };
      });
    },
    markAllRead() {
      return this.commit((s) => { s.notifications.forEach((n) => (n.unread = false)); });
    },
    updateUser(patch) {
      return this.commit((s) => { Object.assign(s.user, patch); });
    },
    setCity(city) {
      return this.commit((s) => { s.currentCity = city; });
    },
  };

  function timeHM(ts) {
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function relTime(min) {
    if (min < 1) return '刚刚';
    if (min < 60) return `${Math.round(min)} 分钟前`;
    if (min < 1440) return `${Math.floor(min / 60)} 小时前`;
    return `${Math.floor(min / 1440)} 天前`;
  }
  function dur(min) {
    if (min <= 0) return '已过期';
    if (min < 60) return `${Math.round(min)} 分钟后过期`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return `剩余 ${h} 小时${m ? ' ' + m + ' 分' : ''}`;
  }
  function pad(n) { return String(n).padStart(2, '0'); }

  Store.util = { timeHM, relTime, dur, pad };
  window.Store = Store;
})();
