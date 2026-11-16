import { beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value); },
  removeItem: (key: string) => { memory.delete(key); },
  clear: () => { memory.clear(); },
  key: (index: number) => Array.from(memory.keys())[index] ?? null,
  get length() { return memory.size; },
} as Storage;
vi.stubGlobal('localStorage', storage);
vi.stubGlobal('window', { localStorage: storage });

const { useAppStore } = await import('./appStore');

describe('registration state', () => {
  beforeEach(() => {
    useAppStore.getState().resetDemo();
  });

  it('creates an account and completes the profile', () => {
    useAppStore.getState().beginRegistration('13800001234');
    expect(useAppStore.getState().auth?.profileComplete).toBe(false);
    expect(useAppStore.getState().auth?.phone).toBe('138****1234');

    useAppStore.getState().completeRegistration({
      name: '小满', age: 25, city: '杭州', tags: ['摄影', '咖啡'], hue: 'a1',
    });
    const state = useAppStore.getState();
    expect(state.auth?.profileComplete).toBe(true);
    expect(state.user.name).toBe('小满');
    expect(state.user.initial).toBe('小');
    expect(state.user.tags).toEqual(['摄影', '咖啡']);
  });

  it('persists the completed profile for the next visit', async () => {
    useAppStore.getState().beginRegistration('13800001234');
    useAppStore.getState().completeRegistration({
      name: '小满', age: 25, city: '杭州', tags: ['摄影'], hue: 'a1',
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const raw = memory.get('travelog.app.v2') ?? '';
    expect(raw).toContain('"profileComplete":true');
    expect(raw).toContain('小满');
  });

  it('stores city, light and album decisions', () => {
    useAppStore.getState().beginRegistration('13800001234');
    useAppStore.getState().completeRegistration({
      name: '小满', age: 25, city: '杭州', tags: ['摄影'], hue: 'a1',
    });
    useAppStore.getState().updateAuth({
      city: { name: '杭州', province: '浙江省' },
      light: 'LIGHT',
      album: 'UPLOAD',
      albumCount: 3,
    });
    const auth = useAppStore.getState().auth;
    expect(auth?.city?.name).toBe('杭州');
    expect(auth?.light).toBe('LIGHT');
    expect(auth?.album).toBe('UPLOAD');
    expect(auth?.albumCount).toBe(3);
  });

  it('logs out without wiping local travel data', () => {
    useAppStore.getState().beginRegistration('13800001234');
    useAppStore.getState().completeRegistration({
      name: '小满', age: 25, city: '杭州', tags: ['摄影'], hue: 'a1',
    });
    useAppStore.getState().logout();
    expect(useAppStore.getState().auth).toBeUndefined();
    expect(useAppStore.getState().onboarded).toBe(false);
    expect(useAppStore.getState().boxes.length).toBe(0);
  });
});
