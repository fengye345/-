import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppData, CityRecord, MemoryBox, Post, PostType, PublishedInput, Settings, TemplateId,
} from '../types';
import { CITY_META, PHOTO, SEED } from '../data/seed';

export type Store = AppData & {
  beginRegistration: (phone: string, provider?: 'PHONE' | 'WECHAT' | 'APPLE' | 'DEMO') => void;
  completeRegistration: (patch: Partial<AppData['user']>) => void;
  updateAuth: (patch: Partial<NonNullable<AppData['auth']>>) => void;
  logout: () => void;
  lightUp: (city: string, province?: string) => CityRecord;
  finishOnboarding: () => void;
  addManualCity: (city: string, province?: string, adcode?: string) => void;
  setCurrentCity: (city: string) => void;
  toggleSetting: (key: keyof Settings, value: boolean) => void;
  startShare: () => void;
  stopShare: () => void;
  likeUser: (id: string) => void;
  match: (id: string) => void;
  joinTeam: () => void;
  leaveTeam: () => void;
  sendMessage: (text: string) => void;
  addPost: (input: PublishedInput) => Post;
  votePost: (id: string, kind: 'valid' | 'invalid' | 'like' | 'save') => void;
  createBox: () => MemoryBox;
  updateBox: (id: string, patch: Partial<MemoryBox>) => void;
  deleteBox: (id: string) => void;
  restoreBox: (id: string) => void;
  shareBox: (id: string) => void;
  revokeBoxShare: (id: string) => void;
  markAiUsed: () => void;
  markPublicCopy: () => void;
  markCheat: () => void;
  markAllRead: () => void;
  updateProfile: (patch: Partial<AppData['user']>) => void;
  requestDeletion: () => void;
  cancelDeletion: () => void;
  resetDemo: () => void;
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      ...clone(SEED),

      beginRegistration(phone: string, provider: 'PHONE' | 'WECHAT' | 'APPLE' | 'DEMO' = 'PHONE') {
        const masked = phone.length >= 11
          ? `${phone.slice(0, 3)}****${phone.slice(7)}`
          : phone;
        set((s) => ({
          auth: {
            phone: masked,
            provider,
            registeredAt: Date.now(),
            profileComplete: false,
          },
          user: {
            ...s.user,
            phone: masked,
            name: '',
            initial: '',
            bio: '',
            tags: [],
            city: '杭州',
            joined: new Date().toISOString().slice(0, 7).replace('-', '.'),
          },
          onboarded: false,
          currentCity: '杭州',
        }));
      },

      completeRegistration(patch) {
        set((s) => {
          const name = (patch.name ?? s.user.name ?? '').trim() || '旅行者';
          const age = patch.age ?? s.user.age ?? 26;
          return {
            user: {
              ...s.user,
              ...patch,
              name,
              initial: name.slice(0, 1),
              age,
              verified: true,
              adult: age >= 18,
              phone: s.user.phone,
              joined: new Date().toISOString().slice(0, 7).replace('-', '.'),
            },
            auth: s.auth
              ? { ...s.auth, profileComplete: true }
              : {
                phone: s.user.phone || '138****0000',
                provider: 'PHONE',
                registeredAt: Date.now(),
                profileComplete: true,
              },
            currentCity: (patch.city ?? s.user.city) || '杭州',
          };
        });
      },

      updateAuth(patch) {
        set((s) => (s.auth ? { auth: { ...s.auth, ...patch } } : {}));
      },

      logout() {
        set({ auth: undefined, onboarded: false });
      },

      lightUp(city: string, province?: string): CityRecord {
        const existing = get().cities[city];
        if (existing?.lit) {
          set({ currentCity: city, onboarded: true });
          return existing;
        }
        const meta = CITY_META[city];
        const record: CityRecord = {
          province: province ?? meta?.province ?? '',
          first: new Date().toISOString().slice(0, 10),
          visits: 1,
          days: 1,
          deep: false,
          coord: meta?.coord,
          lit: true,
          last: '今天',
        };
        set((s) => ({
          cities: { ...s.cities, [city]: record },
          currentCity: city,
          pendingArrival: null,
          onboarded: true,
          metrics: { ...s.metrics, lit: true },
        }));
        return record;
      },

      finishOnboarding: () => set({ onboarded: true }),

      addManualCity(city: string, province?: string, adcode?: string) {
        const base = CITY_META[city];
        const record: CityRecord = {
          province: province ?? base?.province ?? '',
          first: new Date().toISOString().slice(0, 10),
          visits: 1,
          days: 1,
          deep: false,
          coord: base?.coord,
          adcode,
          lit: true,
          last: '手动补录',
          manual: true,
        };
        set((s) => ({
          cities: { ...s.cities, [city]: record },
          metrics: { ...s.metrics, manual: true },
        }));
      },

      setCurrentCity: (city) => set({ currentCity: city }),

      toggleSetting(key, value) {
        set((s) => ({ settings: { ...s.settings, [key]: value } }));
      },

      startShare() {
        const now = Date.now();
        set((s) => ({
          share: { ...s.share, active: true, startedAt: now, expiresAt: now + 24 * 3600 * 1000, likes: [] },
          metrics: { ...s.metrics, shared: true },
        }));
      },

      stopShare() {
        set((s) => ({ share: { ...s.share, active: false, expiresAt: null, likes: [] } }));
      },

      likeUser(id) {
        if (get().share.likes.includes(id)) return;
        set((s) => ({ share: { ...s.share, likes: [...s.share.likes, id] } }));
      },

      match(id) {
        set((s) => ({
          share: { ...s.share, matchId: id },
          team: { ...s.team, joined: true },
          metrics: { ...s.metrics, matched: true },
        }));
      },

      joinTeam: () => set((s) => ({ team: { ...s.team, joined: true } })),
      leaveTeam: () => set((s) => ({ team: { ...s.team, joined: false } })),

      sendMessage(text) {
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        set((s) => ({
          team: { ...s.team, messages: [...s.team.messages, { who: '我', me: true, text, time }] },
        }));
      },

      addPost(input: PublishedInput): Post {
        const type = input.type as PostType;
        const post: Post = {
          id: `p${Date.now()}`,
          type,
          author: get().user.name,
          initial: get().user.initial,
          hue: get().user.hue,
          verified: get().user.verified,
          ago: 0,
          place: input.place,
          dist: input.onSite ? '同城' : '—',
          area: input.place,
          text: input.text.replace(/\n/g, '<br>'),
          img: input.img,
          valid: 0,
          invalid: 0,
          likes: 0,
          comments: 0,
          saved: false,
          liked: false,
          mine: true,
          status: 'PUBLISHED',
        };
        set((s) => ({
          posts: [post, ...s.posts],
          metrics: { ...s.metrics, posted: true, publicCopy: input.fromBox ? true : s.metrics.publicCopy },
        }));
        return post;
      },

      votePost(id, kind) {
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== id) return p;
            if (kind === 'valid') {
              if (p.mine || p.votedValid) return p;
              return { ...p, valid: p.valid + 1, votedValid: true };
            }
            if (kind === 'invalid') {
              if (p.mine || p.votedInvalid) return p;
              return { ...p, invalid: p.invalid + 1, votedInvalid: true };
            }
            if (kind === 'like') return { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) };
            return { ...p, saved: !p.saved };
          }),
        }));
      },

      createBox(): MemoryBox {
        const city = get().currentCity || '杭州';
        const box: MemoryBox = {
          id: `box-${Date.now()}`,
          title: `${city} · 新的回忆`,
          kicker: '刚刚创建',
          city,
          range: '还没有添加照片',
          cover: '',
          photos: [],
          count: 0,
          status: 'draft',
          template: 'magazine',
          privacy: 'private',
          days: [],
        };
        set((s) => ({
          boxes: [box, ...s.boxes],
          metrics: { ...s.metrics, boxCreated: true },
        }));
        return box;
      },

      updateBox(id, patch) {
        set((s) => ({ boxes: s.boxes.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
      },

      deleteBox(id) {
        const box = get().boxes.find((b) => b.id === id);
        if (!box) return;
        set((s) => ({
          boxes: s.boxes.filter((b) => b.id !== id),
          recycle: [
            { id: `r${Date.now()}`, title: box.title, deleted: '刚刚', left: 30, cover: box.cover },
            ...s.recycle,
          ],
        }));
      },

      restoreBox(id) {
        const item = get().recycle.find((r) => r.id === id);
        if (!item) return;
        set((s) => ({
          recycle: s.recycle.filter((r) => r.id !== id),
          boxes: [
            {
              id: `box-${Date.now()}`,
              title: item.title,
              kicker: '已恢复',
              city: item.title.split(' · ')[0],
              range: '已从回收站恢复',
              cover: item.cover,
              photos: [item.cover],
              count: 1,
              status: 'done',
              template: 'minimal' as TemplateId,
              privacy: 'private',
              views: 0,
            },
            ...s.boxes,
          ],
        }));
      },

      shareBox(id) {
        set((s) => ({
          boxes: s.boxes.map((b) => (b.id === id
            ? { ...b, shared: true, shareDays: 7, shareUrl: `https://trip.app/s/${id.slice(-4)}k9` }
            : b)),
          metrics: { ...s.metrics, boxShared: true },
        }));
      },

      revokeBoxShare(id) {
        set((s) => ({
          boxes: s.boxes.map((b) => (b.id === id ? { ...b, shared: false, shareUrl: null } : b)),
        }));
      },

      markAiUsed() {
        set((s) => ({ ai: { ...s.ai, used: Math.min(s.ai.quota, s.ai.used + 1) }, metrics: { ...s.metrics, aiUsed: true } }));
      },

      markPublicCopy: () => set((s) => ({ metrics: { ...s.metrics, publicCopy: true } })),
      markCheat: () => set((s) => ({ metrics: { ...s.metrics, cheat: true }, pendingArrival: null })),

      markAllRead() {
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, unread: false })) }));
      },

      updateProfile(patch) {
        set((s) => ({ user: { ...s.user, ...patch } }));
      },

      requestDeletion() {
        set((s) => ({
          deletion: { requestedAt: Date.now(), daysLeft: 7 },
          metrics: { ...s.metrics, deleted: true },
        }));
      },

      cancelDeletion: () => set({ deletion: null }),

      resetDemo() {
        set({ ...clone(SEED), onboarded: false });
      },
    }),
    {
      name: 'travelog.app.v2',
      version: 1,
    },
  ),
);

export const litCities = (cities: Record<string, CityRecord>) =>
  Object.entries(cities)
    .filter(([, c]) => c.lit)
    .map(([name, c]) => ({ name, ...c }))
    .sort((a, b) => Number(!!b.deep) - Number(!!a.deep) || b.visits - a.visits);

export const unreadCount = (notifications: AppData['notifications']) =>
  notifications.filter((n) => n.unread).length;
