import type { AppData, CityIndexItem, CityMeta } from '../types';

export const PHOTO = (i: number) => `photos/pic${String(i).padStart(2, '0')}.jpg`;

/**
 * Static city catalogue only. It is not user history: visits/days are 0 until
 * the user actually lights a city.
 */
export const CITY_META: Record<string, CityMeta> = {
  杭州: { province: '浙江省', first: '', visits: 0, days: 0, deep: false, hue: 158, coord: [120.155, 30.274] },
  上海: { province: '上海市', first: '', visits: 0, days: 0, deep: false, hue: 205, coord: [121.473, 31.23] },
  成都: { province: '四川省', first: '', visits: 0, days: 0, deep: false, hue: 24, coord: [104.066, 30.572] },
  大理: { province: '云南省', first: '', visits: 0, days: 0, deep: false, hue: 190, coord: [100.267, 25.606] },
  厦门: { province: '福建省', first: '', visits: 0, days: 0, deep: false, hue: 174, coord: [118.089, 24.479] },
  北京: { province: '北京市', first: '', visits: 0, days: 0, deep: false, hue: 0, coord: [116.407, 39.904] },
};

/** 64 cities for name / pinyin / province search. */
export const CITY_INDEX: CityIndexItem[] = (
  [
    ['北京', '北京市', 'beijing', 1], ['上海', '上海市', 'shanghai', 1],
    ['天津', '天津市', 'tianjin', 0], ['重庆', '重庆市', 'chongqing', 1],
    ['杭州', '浙江省', 'hangzhou', 1], ['宁波', '浙江省', 'ningbo', 0],
    ['温州', '浙江省', 'wenzhou', 0], ['苏州', '江苏省', 'suzhou', 0],
    ['南京', '江苏省', 'nanjing', 1], ['无锡', '江苏省', 'wuxi', 0],
    ['扬州', '江苏省', 'yangzhou', 0], ['成都', '四川省', 'chengdu', 1],
    ['绵阳', '四川省', 'mianyang', 0], ['乐山', '四川省', 'leshan', 0],
    ['昆明', '云南省', 'kunming', 0], ['大理', '云南省', 'dali', 1],
    ['丽江', '云南省', 'lijiang', 1], ['香格里拉', '云南省', 'xianggelila', 0],
    ['西双版纳', '云南省', 'xishuangbanna', 0], ['厦门', '福建省', 'xiamen', 1],
    ['福州', '福建省', 'fuzhou', 0], ['泉州', '福建省', 'quanzhou', 0],
    ['广州', '广东省', 'guangzhou', 0], ['深圳', '广东省', 'shenzhen', 0],
    ['珠海', '广东省', 'zhuhai', 0], ['汕头', '广东省', 'shantou', 0],
    ['西安', '陕西省', 'xian', 1], ['延安', '陕西省', 'yanan', 0],
    ['青岛', '山东省', 'qingdao', 1], ['济南', '山东省', 'jinan', 0],
    ['烟台', '山东省', 'yantai', 0], ['长沙', '湖南省', 'changsha', 1],
    ['张家界', '湖南省', 'zhangjiajie', 1], ['武汉', '湖北省', 'wuhan', 0],
    ['宜昌', '湖北省', 'yichang', 0], ['郑州', '河南省', 'zhengzhou', 0],
    ['洛阳', '河南省', 'luoyang', 0], ['哈尔滨', '黑龙江省', 'haerbin', 0],
    ['沈阳', '辽宁省', 'shenyang', 0], ['大连', '辽宁省', 'dalian', 0],
    ['长春', '吉林省', 'changchun', 0], ['呼和浩特', '内蒙古自治区', 'huhehaote', 0],
    ['乌鲁木齐', '新疆维吾尔自治区', 'wulumuqi', 0], ['拉萨', '西藏自治区', 'lasa', 1],
    ['兰州', '甘肃省', 'lanzhou', 0], ['敦煌', '甘肃省', 'dunhuang', 1],
    ['西宁', '青海省', 'xining', 0], ['银川', '宁夏回族自治区', 'yinchuan', 0],
    ['太原', '山西省', 'taiyuan', 0], ['石家庄', '河北省', 'shijiazhuang', 0],
    ['秦皇岛', '河北省', 'qinhuangdao', 0], ['南昌', '江西省', 'nanchang', 0],
    ['景德镇', '江西省', 'jingdezhen', 1], ['合肥', '安徽省', 'hefei', 0],
    ['黄山', '安徽省', 'huangshan', 1], ['南宁', '广西壮族自治区', 'nanning', 0],
    ['桂林', '广西壮族自治区', 'guilin', 1], ['海口', '海南省', 'haikou', 0],
    ['三亚', '海南省', 'sanya', 1], ['贵阳', '贵州省', 'guiyang', 0],
    ['遵义', '贵州省', 'zunyi', 0], ['香港', '香港特别行政区', 'xianggang', 0],
    ['澳门', '澳门特别行政区', 'aomen', 0], ['台北', '台湾省', 'taibei', 0],
  ] as const
).map(([n, p, py, hot]) => ({ n, p, py, hot: !!hot }));

/**
 * A fresh account starts with no history, check-ins, favourites, memories,
 * posts, notifications, hall users or teams. Everything here is empty by
 * design; pages must render their own empty states instead of demo rows.
 */
export const SEED: AppData = {
  version: 1,
  onboarded: false,
  user: {
    name: '',
    initial: '',
    hue: 'a3',
    age: 0,
    city: '',
    bio: '',
    tags: [],
    verified: false,
    adult: false,
    joined: '',
    phone: '',
  },
  settings: {
    autoLight: true,
    mapVisible: true,
    shareVisible: true,
    personalized: true,
    albumSync: false,
    notify: true,
    dnd: false,
    precise: false,
  },
  currentCity: '杭州',
  pendingArrival: null,
  cities: {},
  boxes: [],
  hall: [],
  team: {
    id: '',
    name: '',
    city: '',
    cap: 8,
    members: [],
    meeting: { place: '', time: '', note: '' },
    messages: [],
    joined: false,
  },
  posts: [],
  qas: [],
  ai: {
    quota: 10,
    used: 0,
    route: {
      title: '',
      total: '',
      weather: { icon: 'sun', temp: '', desc: '' },
      stops: [],
      unknown: '',
    },
  },
  share: { active: false, startedAt: null, expiresAt: null, likes: [], matchId: null },
  metrics: {
    lit: false, boxCreated: false, shared: false, posted: false, matched: false,
    aiUsed: false, deleted: false, manual: false, cheat: false, publicCopy: false, boxShared: false,
  },
  notifications: [],
  recycle: [],
  deletion: null,
};
