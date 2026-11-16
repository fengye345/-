// Domain types shared by the store, API layer and screens.

export interface CityRecord {
  province: string;
  first: string;
  visits: number;
  days: number;
  deep?: boolean;
  lit: boolean;
  last?: string;
  manual?: boolean;
  adcode?: string;
  coord?: [number, number];
}

export interface CityMeta {
  province: string;
  first: string;
  visits: number;
  days: number;
  deep?: boolean;
  hue?: number;
  coord?: [number, number];
}

export interface CityIndexItem {
  n: string;
  p: string;
  py: string;
  hot: boolean;
}

export interface MemoryDay {
  label: string;
  date: string;
  note: string;
  photos: string[];
}

export type BoxStatus = 'draft' | 'done';
export type TemplateId = 'magazine' | 'film' | 'minimal';

export interface MemoryBox {
  id: string;
  title: string;
  kicker: string;
  city: string;
  range: string;
  cover: string;
  photos: string[];
  count: number;
  status: BoxStatus;
  template: TemplateId;
  privacy: 'private';
  views?: number;
  shared?: boolean;
  shareDays?: number;
  shareUrl?: string | null;
  days?: MemoryDay[];
  music?: string;
}

export interface HallUser {
  id: string;
  name: string;
  initial: string;
  hue: string;
  age: string;
  tags: string[];
  dist: string;
  verified: boolean;
  why: string;
  note: string;
}

export type PostType = 'now' | 'today' | 'long';

export interface Post {
  id: string;
  type: PostType;
  author: string;
  initial: string;
  hue: string;
  verified: boolean;
  ago: number;
  place: string;
  dist: string;
  area: string;
  text: string;
  img: string | null;
  valid: number;
  invalid: number;
  likes: number;
  comments: number;
  saved: boolean;
  liked: boolean;
  mine: boolean;
  votedValid?: boolean;
  votedInvalid?: boolean;
  status?: 'REVIEWING' | 'PUBLISHED';
}

export interface QAAnswer {
  by: string;
  initial: string;
  hue: string;
  verified?: boolean;
  ai?: boolean;
  text: string;
  ago: number;
}

export interface QA {
  id: string;
  q: string;
  answers: QAAnswer[];
}

export interface TeamMember {
  name: string;
  initial: string;
  hue: string;
  leader?: boolean;
  me?: boolean;
}

export interface TeamMessage {
  sys?: string;
  who?: string;
  initial?: string;
  hue?: string;
  me?: boolean;
  text?: string;
  time?: string;
}

export interface Team {
  id: string;
  name: string;
  city: string;
  cap: number;
  members: TeamMember[];
  meeting: { place: string; time: string; note: string };
  messages: TeamMessage[];
  joined: boolean;
}

export interface AiStop {
  time: string;
  name: string;
  desc: string;
  walk: string;
  src: string;
}

export interface AiRoute {
  title: string;
  total: string;
  weather: { icon: string; temp: string; desc: string };
  stops: AiStop[];
  unknown: string;
}

export interface AiState {
  quota: number;
  used: number;
  route: AiRoute;
}

export interface NotificationItem {
  id: string;
  type: 'team' | 'like' | 'system';
  title: string;
  body: string;
  ago: number;
  unread: boolean;
}

export interface RecycleItem {
  id: string;
  title: string;
  deleted: string;
  left: number;
  cover: string;
}

export interface Settings {
  autoLight: boolean;
  mapVisible: boolean;
  shareVisible: boolean;
  personalized: boolean;
  albumSync: boolean;
  notify: boolean;
  dnd: boolean;
  precise: boolean;
}

export interface AuthState {
  phone: string;
  provider: 'PHONE' | 'WECHAT' | 'APPLE' | 'DEMO';
  registeredAt: number;
  profileComplete: boolean;
  city?: { name: string; province: string } | null;
  light?: 'LIGHT' | 'SKIP';
  album?: 'UPLOAD' | 'SKIP';
  albumCount?: number;
}

export interface UserProfile {
  name: string;
  initial: string;
  hue: string;
  age: number;
  city: string;
  bio: string;
  tags: string[];
  verified: boolean;
  adult: boolean;
  joined: string;
  phone: string;
}

export interface ShareState {
  active: boolean;
  startedAt: number | null;
  expiresAt: number | null;
  likes: string[];
  matchId: string | null;
}

export interface Metrics {
  lit: boolean;
  latched?: string;
  boxCreated: boolean;
  shared: boolean;
  posted: boolean;
  matched: boolean;
  aiUsed: boolean;
  deleted: boolean;
  manual: boolean;
  cheat: boolean;
  publicCopy: boolean;
  boxShared: boolean;
}

export interface AppData {
  version: number;
  auth?: AuthState;
  onboarded: boolean;
  user: UserProfile;
  settings: Settings;
  currentCity: string;
  pendingArrival: { city: string; minutes: number; points: number; accuracy: number } | null;
  cities: Record<string, CityRecord>;
  boxes: MemoryBox[];
  hall: HallUser[];
  team: Team;
  posts: Post[];
  qas: QA[];
  ai: AiState;
  share: ShareState;
  metrics: Metrics;
  notifications: NotificationItem[];
  recycle: RecycleItem[];
  deletion: { requestedAt: number; daysLeft: number } | null;
}

export interface PublishedInput {
  type: PostType;
  place: string;
  text: string;
  img: string | null;
  onSite: boolean;
  fromBox?: boolean;
}

export interface AiAnswer {
  kind: 'route' | 'crowd' | 'food';
  text: string;
}
