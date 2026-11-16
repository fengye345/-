import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';

type Step = 'welcome' | 'profile' | 'city' | 'light' | 'album' | 'permission' | 'arrival';

const HUES = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
const HUE_COLORS: Record<string, string> = {
  a1: '#B85C3E', a2: '#3F5F7A', a3: '#1F6B57',
  a4: '#8A6A2F', a5: '#6B4E71', a6: '#4C6250',
};
const TAGS = ['摄影', '徒步', '咖啡', '美食', '夜游', '亲子', '人文', '慢节奏'];
const CITIES = ['杭州', '上海', '成都', '大理', '厦门', '北京'];

interface CityOption {
  name: string;
  province: string;
  image: string;
  note: string;
}

const LIGHT_CITIES: CityOption[] = [
  { name: '杭州', province: '浙江省', image: 'photos/pic04.jpg', note: '西湖 · 桂花 · 龙井' },
  { name: '上海', province: '上海市', image: 'photos/pic14.jpg', note: '外滩 · 梧桐 · 展览' },
  { name: '成都', province: '四川省', image: 'photos/pic05.jpg', note: '茶馆 · 巷子 · 夜市' },
  { name: '大理', province: '云南省', image: 'photos/pic02.jpg', note: '洱海 · 稻田 · 慢生活' },
  { name: '厦门', province: '福建省', image: 'photos/pic07.jpg', note: '海边 · 沙坡尾 · 骑行' },
  { name: '北京', province: '北京市', image: 'photos/pic09.jpg', note: '故宫 · 胡同 · 展览' },
  { name: '西安', province: '陕西省', image: 'photos/pic03.jpg', note: '城墙 · 兵马俑 · 面食' },
  { name: '重庆', province: '重庆市', image: 'photos/pic08.jpg', note: '山城 · 江景 · 夜景' },
  { name: '青岛', province: '山东省', image: 'photos/pic10.jpg', note: '红瓦 · 海风 · 啤酒' },
  { name: '长沙', province: '湖南省', image: 'photos/pic08.jpg', note: '湘江 · 夜市 · 小吃' },
];

export function Onboarding() {
  const auth = useAppStore((s) => s.auth);
  const onboarded = useAppStore((s) => s.onboarded);
  const user = useAppStore((s) => s.user);
  const beginRegistration = useAppStore((s) => s.beginRegistration);
  const completeRegistration = useAppStore((s) => s.completeRegistration);
  const finishOnboarding = useAppStore((s) => s.finishOnboarding);
  const lightUp = useAppStore((s) => s.lightUp);
  const updateAuth = useAppStore((s) => s.updateAuth);
  const cities = useAppStore((s) => s.cities);
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('welcome');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sent, setSent] = useState(false);

  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('26');
  const [city, setCity] = useState('杭州');
  const [bio, setBio] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [hue, setHue] = useState('a3');
  const [pickedCity, setPickedCity] = useState<CityOption | null>(null);
  const [albumIntent, setAlbumIntent] = useState<'UPLOAD' | 'SKIP' | null>(null);
  const [albumFiles, setAlbumFiles] = useState<Array<{ name: string; url: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth) setStep('welcome');
    else if (!auth.profileComplete) setStep('profile');
    else if (auth.city === undefined) setStep('city');
    else if (auth.city && auth.light === undefined) setStep('light');
    else if (auth.light === 'LIGHT' && auth.album === undefined) setStep('album');
    else if (!onboarded) {
      setStep((prev) => (['welcome', 'profile', 'city', 'light', 'album'].includes(prev)
        ? 'permission'
        : prev));
    }
  }, [auth, onboarded]);

  useEffect(() => () => {
    albumFiles.forEach((f) => URL.revokeObjectURL(f.url));
  }, [albumFiles]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  if (auth?.profileComplete && onboarded) return null;

  const phoneValid = /^1\d{10}$/.test(phone);
  const sendCode = () => {
    if (!phoneValid) {
      toast('请输入 11 位手机号', 'alert');
      return;
    }
    setSent(true);
    setCountdown(60);
    toast('验证码已发送 · 演示码 123456', 'message');
  };

  const login = () => {
    if (!agreed) {
      toast('请先阅读并同意用户协议与隐私政策', 'alert');
      return;
    }
    if (!sent) {
      toast('请先获取验证码', 'alert');
      return;
    }
    if (code !== '123456') {
      toast('验证码不正确，演示码为 123456', 'alert');
      return;
    }
    beginRegistration(phone);
    setStep('profile');
    toast('注册成功 · 完善资料后进入旅迹', 'check');
  };

  const social = (provider: 'WECHAT' | 'APPLE') => {
    beginRegistration('13800000000', provider);
    setStep('profile');
    toast(provider === 'WECHAT' ? '已通过微信创建账号' : '已通过 Apple 创建账号', 'check');
  };

  const nicknameValid = nickname.trim().length >= 2;
  const ageNum = Number(age);
  const submitProfile = () => {
    if (!nicknameValid) {
      toast('昵称至少 2 个字', 'alert');
      return;
    }
    if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 80) {
      toast('年龄需在 18–80 岁之间', 'alert');
      return;
    }
    if (!tags.length) {
      toast('至少选择一个旅行偏好', 'alert');
      return;
    }
    completeRegistration({
      name: nickname.trim(),
      age: ageNum,
      city: city.trim() || '杭州',
      bio: bio.trim(),
      tags,
      hue,
    });
    setStep('city');
    toast('资料已保存 · 选择第一座城市', 'check');
  };

  const pickCity = (picked: CityOption | null) => {
    setPickedCity(picked);
    updateAuth({
      city: picked ? { name: picked.name, province: picked.province } : null,
      light: picked ? undefined : 'SKIP',
    });
    if (picked) {
      setStep('light');
    } else {
      setStep('permission');
      toast('已跳过城市点亮，之后可以在地图里补上', 'pin');
    }
  };

  const chooseLight = (light: boolean) => {
    updateAuth({ light: light ? 'LIGHT' : 'SKIP' });
    setStep(light ? 'album' : 'permission');
  };

  const finishAlbum = (choice: 'UPLOAD' | 'SKIP') => {
    updateAuth({ album: choice, albumCount: choice === 'UPLOAD' ? albumFiles.length : 0 });
    setStep('permission');
    if (choice === 'UPLOAD') toast(`已选择 ${albumFiles.length} 张照片 · 进入后整理`, 'image');
  };

  const onFiles = (files: FileList | null) => {
    const list = Array.from(files ?? []).slice(0, 9).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setAlbumFiles(list);
    setAlbumIntent('UPLOAD');
  };

  const enterApp = () => {
    const current = useAppStore.getState().auth;
    const target = current?.city ?? { name: '杭州', province: '浙江省' };
    if (!useAppStore.getState().cities[target.name]?.lit) {
      lightUp(target.name, target.province);
    }
    finishOnboarding();
    navigate('/map');
    toast(`已点亮 ${target.name} · 欢迎来到旅迹`, 'pin');
  };

  const enterAppNoLight = () => {
    finishOnboarding();
    navigate('/map');
    toast('欢迎来到旅迹');
  };

  const afterPermission = () => {
    const current = useAppStore.getState().auth;
    if (current?.light === 'LIGHT' && current.city) setStep('arrival');
    else enterAppNoLight();
  };

  const brand = (
    <div className="ob-brand">
      <div className="b">
        <div className="g-mark" style={{ width: 30, height: 30 }}><Icon name="map" size={15} /></div>
        <b>旅迹</b>
      </div>
      <span className="auth-step">
        {step === 'welcome' ? ''
          : step === 'profile' ? '资料 1 / 3'
            : step === 'city' || step === 'light' ? '城市 2 / 3'
              : step === 'album' ? '相册 3 / 3'
                : step === 'permission' ? '权限' : '完成'}
      </span>
    </div>
  );

  if (step === 'welcome') {
    return (
      <div className="onboard auth-screen">
        <div className="auth-hero">
          {brand}
          <div className="auth-rings"><i /><i /><i /><span /></div>
          <div className="auth-hero-copy">
            <div className="k">TRAVELOG · 从到达开始</div>
            <h1>把每一次到达，<br />变成看得见的记忆</h1>
          </div>
        </div>

        <div className="auth-sheet">
          <h2>手机号登录 / 注册</h2>
          <p>未注册的手机号会自动创建账号；登录成功后，下次打开无需再次登录。</p>

          <label className="auth-label" htmlFor="auth-phone">手机号</label>
          <div className="auth-phone">
            <span>+86</span>
            <input
              id="auth-phone"
              inputMode="numeric"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="请输入手机号"
              autoComplete="tel"
            />
          </div>

          <label className="auth-label" htmlFor="auth-code">验证码</label>
          <div className="auth-code">
            <input
              id="auth-code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6 位验证码"
              autoComplete="one-time-code"
            />
            <button disabled={countdown > 0 || !phoneValid} onClick={sendCode}>
              {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
            </button>
          </div>

          <label className="auth-agree">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>我已阅读并同意 <b>用户协议</b> 与 <b>隐私政策</b></span>
          </label>

          <button
            className="btn primary lg auth-submit"
            disabled={!phoneValid || code.length !== 6 || !agreed}
            onClick={login}
          >
            注册 / 登录
          </button>

          <div className="auth-alt">
            <span>或使用</span>
            <button onClick={() => social('WECHAT')}><Icon name="wechat" size={15} />微信</button>
            <button onClick={() => social('APPLE')}><Icon name="apple" size={15} />Apple</button>
          </div>
          <div className="auth-note">演示验证码 123456 · 不会发送真实短信</div>
        </div>
      </div>
    );
  }

  if (step === 'profile') {
    const initial = nickname.trim().slice(0, 1) || '旅';
    return (
      <div className="onboard auth-screen auth-screen-scroll">
        <div className="auth-top">{brand}</div>
        <div className="auth-profile">
          <div className="auth-heading">
            <div className="k">CREATE PROFILE</div>
            <h1>让我们认识你</h1>
            <p>这些信息会用于城市卡和共享名片，进入后仍可在「我的」里修改。</p>
          </div>

          <div className="auth-avatar-row">
            <div className={`avatar ${hue} auth-avatar`} style={{ background: HUE_COLORS[hue] }}>{initial}</div>
            <div>
              <b>头像颜色</b>
              <div className="hue-row">
                {HUES.map((h) => (
                  <button
                    key={h}
                    className={`hue-dot${hue === h ? ' on' : ''}`}
                    style={{ background: HUE_COLORS[h] }}
                    onClick={() => setHue(h)}
                    aria-label={`选择颜色 ${h}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label>昵称 <small>2–12 个字</small></label>
            <input
              maxLength={12}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="怎么称呼你？"
            />
          </div>

          <div className="auth-two">
            <div className="auth-field">
              <label>年龄</label>
              <input
                inputMode="numeric"
                maxLength={2}
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))}
                placeholder="26"
              />
            </div>
            <div className="auth-field">
              <label>常住城市</label>
              <input maxLength={8} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="auth-city-chips">
            {CITIES.map((c) => (
              <button key={c} className={city === c ? 'on' : ''} onClick={() => setCity(c)}>{c}</button>
            ))}
          </div>

          <div className="auth-field">
            <label>一句话介绍 <small>{bio.length}/60</small></label>
            <textarea
              maxLength={60}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="比如：拍照、徒步、找本地小店"
            />
          </div>

          <div className="auth-field">
            <label>旅行偏好 <small>至少选 1 个</small></label>
            <div className="tag-pick">
              {TAGS.map((t) => (
                <button
                  key={t}
                  className={tags.includes(t) ? 'on' : ''}
                  onClick={() => setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].slice(0, 5))}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button className="btn primary lg auth-submit" disabled={!nicknameValid || tags.length === 0} onClick={submitProfile}>
            完成注册
          </button>
          <p className="auth-note">资料仅保存在本机；注册完成后可直接进入地图。</p>
        </div>
      </div>
    );
  }

  if (step === 'city') {
    return (
      <div className="onboard auth-screen auth-screen-scroll">
        <div className="auth-top">{brand}</div>
        <div className="auth-profile">
          <div className="auth-heading">
            <div className="k">FIRST CITY</div>
            <h1>想先点亮哪座城市？</h1>
            <p>可以选一座已经去过的城市，也可以先不选，进入后随时补上。</p>
          </div>

          <div className="city-grid">
            {LIGHT_CITIES.map((c) => {
              const lit = !!cities[c.name]?.lit;
              return (
                <button
                  key={c.name}
                  className={`city-opt${pickedCity?.name === c.name ? ' on' : ''}`}
                  onClick={() => setPickedCity(c)}
                >
                  <img src={c.image} alt="" />
                  <span className="co-veil" />
                  <span className="co-name">{c.name}</span>
                  <span className="co-prov">{c.province}</span>
                  {lit ? <span className="co-lit">已点亮</span> : null}
                </button>
              );
            })}
          </div>

          <button className={`city-none${!pickedCity ? ' on' : ''}`} onClick={() => setPickedCity(null)}>
            <Icon name="close" size={13} />我还没有想好 · 暂不选择城市
          </button>

          <button className="btn primary lg auth-submit" onClick={() => pickCity(pickedCity)}>
            {pickedCity ? `下一步 · ${pickedCity.name}` : '暂不选择，继续'}
          </button>
          <p className="auth-note">城市是点亮单位；景区、商圈和街区属于城市内部地点。</p>
        </div>
      </div>
    );
  }

  if (step === 'light') {
    const chosen = auth?.city ?? (pickedCity
      ? { name: pickedCity.name, province: pickedCity.province }
      : { name: '杭州', province: '浙江省' });
    const option = LIGHT_CITIES.find((c) => c.name === chosen.name);
    const alreadyLit = !!cities[chosen.name]?.lit;
    return (
      <div className="onboard auth-screen auth-center">
        <div className="auth-top">{brand}</div>
        <div className="auth-light-cover">
          <img src={option?.image ?? 'photos/pic04.jpg'} alt="" />
          <div className="alc-veil" />
          <div className="alc-copy">
            <span>{chosen.province}</span>
            <h1>{chosen.name}</h1>
            <p>{option?.note ?? '第一座被点亮的城市'}</p>
          </div>
        </div>
        <div className="auth-copy">
          <div className="k">YOUR FIRST CITY</div>
          <h2>{alreadyLit ? `你已经点亮过 ${chosen.name}` : `要现在点亮 ${chosen.name} 吗？`}</h2>
          <p>点亮后会生成城市卡，并计入你的地图完成度；不会因为再次到访而重复点亮。</p>
        </div>
        <div className="auth-actions">
          <button className="btn primary lg" onClick={() => chooseLight(true)}>
            <Icon name="locate" size={17} />{alreadyLit ? '继续' : `点亮 ${chosen.name}`}
          </button>
          <button className="btn ghost" onClick={() => chooseLight(false)}>暂不点亮，先逛逛</button>
          <button className="auth-skip" onClick={() => setStep('city')}>重新选择城市</button>
        </div>
      </div>
    );
  }

  if (step === 'album') {
    const chosen = auth?.city ?? { name: '杭州', province: '浙江省' };
    return (
      <div className="onboard auth-screen auth-screen-scroll">
        <div className="auth-top">{brand}</div>
        <div className="auth-profile">
          <div className="auth-heading">
            <div className="k">ALBUM · OPTIONAL</div>
            <h1>把照片也带进来？</h1>
            <p>{chosen.name}点亮后，可以从相册选几张照片，进入后自动整理成回忆盒草稿。</p>
          </div>

          <div className="album-stack">
            {['photos/pic04.jpg', 'photos/pic14.jpg', 'photos/pic02.jpg'].map((src, i) => (
              <img key={src} src={src} alt="" style={{ transform: `rotate(${(i - 1) * 5}deg) translateX(${i * 6}px)` }} />
            ))}
            <div className="album-stack-copy">
              <b>{albumFiles.length ? `已选择 ${albumFiles.length} 张` : '回忆盒草稿'}</b>
              <span>仅本人可见</span>
            </div>
          </div>

          <div className="album-choices">
            <button
              className={albumIntent === 'UPLOAD' ? 'on' : ''}
              onClick={() => fileRef.current?.click()}
            >
              <span className="ico"><Icon name="image" size={17} /></span>
              <b>上传相册照片</b>
              <span>选择 1–9 张，进入后自动去重</span>
            </button>
            <button
              className={albumIntent === 'SKIP' ? 'on' : ''}
              onClick={() => setAlbumIntent('SKIP')}
            >
              <span className="ico"><Icon name="close" size={17} /></span>
              <b>暂不上传</b>
              <span>进入后可随时在回忆盒添加</span>
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />

          {albumFiles.length ? (
            <div className="album-previews">
              {albumFiles.map((f) => <img key={f.url} src={f.url} alt={f.name} />)}
            </div>
          ) : null}

          <button
            className="btn primary lg auth-submit"
            disabled={!albumIntent || (albumIntent === 'UPLOAD' && albumFiles.length === 0)}
            onClick={() => finishAlbum(albumIntent === 'SKIP' ? 'SKIP' : 'UPLOAD')}
          >
            {albumIntent === 'SKIP' ? '暂不上传，继续' : '完成选择，继续'}
          </button>
          <p className="auth-note">演示环境不会上传原图；照片只在本机预览。</p>
        </div>
      </div>
    );
  }

  if (step === 'permission') {
    return (
      <div className="onboard auth-screen auth-center">
        <div className="auth-top">{brand}</div>
        <div className="auth-perm-art">
          <div className="auth-rings"><i /><i /><i /><span /></div>
        </div>
        <div className="auth-copy">
          <div className="k">LOCATION · 仅用于记录</div>
          <h1>开启定位，<br />让城市替你记住</h1>
          <p>停留判定需要 30 分钟与 2 个定位点。原始位置保留 7 天后降为城市级，你可以随时关闭。</p>
        </div>
        <div className="auth-actions">
          <button className="btn primary lg" onClick={afterPermission}>始终允许</button>
          <button className="btn ghost" onClick={afterPermission}>仅使用 App 期间</button>
          <button className="auth-skip" onClick={afterPermission}>暂不开启，稍后手动补录</button>
          <p className="auth-note">定位、相册、相机与通知分别申请，拒绝后仍可使用手动记录。</p>
        </div>
      </div>
    );
  }

  const chosenCity = auth?.city ?? { name: '杭州', province: '浙江省' };
  return (
    <div className="onboard auth-screen auth-center">
      <div className="auth-top">{brand}</div>
      <div className="auth-arrival-art">
        <div className="arrival-ring">
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle className="ring-track" cx="75" cy="75" r="70" fill="none" strokeWidth="6" />
            <circle
              className="ring-fill" cx="75" cy="75" r="70" fill="none" strokeWidth="6"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={0}
              transform="rotate(-90 75 75)"
            />
          </svg>
          <div className="val">30<small>分钟</small></div>
        </div>
      </div>
      <div className="auth-copy">
        <div className="k">FIRST CITY · {chosenCity.province}</div>
        <h2>点亮 {chosenCity.name}</h2>
        <p>你选择了 {chosenCity.name} 作为第一座城市。收下这张城市卡，之后每次到达都会记在这里。</p>
      </div>
      <div className="auth-facts">
        <div><b>3 个</b><span>定位点</span></div>
        <div><b>38m</b><span>定位精度</span></div>
        <div><b>47 分</b><span>本次停留</span></div>
      </div>
      <div className="auth-actions">
        <button className="btn primary lg" onClick={enterApp}><Icon name="locate" size={17} />点亮 {chosenCity.name}，进入旅迹</button>
        <p className="auth-note">已登录 {auth?.phone ?? user.phone} · 下次打开将直接进入</p>
      </div>
    </div>
  );
}
