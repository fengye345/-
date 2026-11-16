import { useAppStore } from '../store/appStore';
import { searchCities } from '../lib/citySearch';
import type { AiAnswer, PublishedInput } from '../types';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const api = {
  auth: {
    async login() {
      await delay(320);
      return useAppStore.getState().user;
    },
  },

  cities: {
    /** Pure search over the bundled city index; lit state comes from the store. */
    search(query: string) {
      const { cities, currentCity } = useAppStore.getState();
      return searchCities(query, cities, currentCity);
    },
    listLit() {
      const { cities } = useAppStore.getState();
      return Object.entries(cities)
        .filter(([, c]) => c.lit)
        .map(([name, c]) => ({ name, ...c }));
    },
  },

  visits: {
    async lightUp(city: string) {
      await delay(650);
      return useAppStore.getState().lightUp(city);
    },
    async manual(city: string) {
      await delay(500);
      useAppStore.getState().addManualCity(city);
    },
  },

  memory: {
    async create() {
      await delay(1350);
      return useAppStore.getState().createBox();
    },
    async saveLink(boxId: string) {
      await delay(600);
      useAppStore.getState().shareBox(boxId);
      return useAppStore.getState().boxes.find((b) => b.id === boxId);
    },
    async revokeLink(boxId: string) {
      await delay(300);
      useAppStore.getState().revokeBoxShare(boxId);
    },
  },

  posts: {
    async publish(input: PublishedInput) {
      if (input.text.length > 500) {
        throw new ApiError('POST_422_01', '内容超过 500 字', 422);
      }
      await delay(1200);
      return useAppStore.getState().addPost(input);
    },
  },

  share: {
    async start() {
      await delay(400);
      useAppStore.getState().startShare();
    },
    async stop() {
      await delay(200);
      useAppStore.getState().stopShare();
    },
    async like(userId: string) {
      await delay(350);
      const store = useAppStore.getState();
      if (store.share.likes.includes(userId)) {
        throw new ApiError('SHARE_429_01', '已经表达过喜欢', 429);
      }
      store.likeUser(userId);
      const mutual = userId === 'u1';
      if (mutual) store.match(userId);
      return { mutual };
    },
  },

  ai: {
    async ask(question: string): Promise<AiAnswer> {
      const store = useAppStore.getState();
      if (store.ai.used >= store.ai.quota) {
        throw new ApiError('AI_429_01', '今日 AI 额度已用尽', 429);
      }
      store.markAiUsed();
      await delay(1150);
      if (/人多|值得|排队|开放|开门/.test(question)) return { kind: 'crowd', text: question };
      if (/吃|餐厅|美食|咖啡/.test(question)) return { kind: 'food', text: question };
      return { kind: 'route', text: question };
    },
  },
};
