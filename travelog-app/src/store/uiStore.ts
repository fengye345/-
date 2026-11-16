import { create } from 'zustand';

interface UiState {
  aiOpen: boolean;
  aiPrefill: string | null;
  openAi: (prefill?: string) => void;
  closeAi: () => void;
  citySearchOpen: boolean;
  citySearchQuery: string;
  openCitySearch: (query?: string) => void;
  closeCitySearch: () => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  aiOpen: false,
  aiPrefill: null,
  openAi: (prefill) => set({ aiOpen: true, aiPrefill: prefill ?? null }),
  closeAi: () => set({ aiOpen: false, aiPrefill: null }),

  citySearchOpen: false,
  citySearchQuery: '',
  openCitySearch: (query) => set({ citySearchOpen: true, citySearchQuery: query ?? '' }),
  closeCitySearch: () => set({ citySearchOpen: false, citySearchQuery: '' }),

  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
}));
