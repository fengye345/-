import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, litCities } from '../store/appStore';
import { useUiStore } from '../store/uiStore';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Avatar, SectionTitle, Switch } from '../components/ui';
import { useToast } from '../components/Toast';

export function MeScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const openCitySearch = useUiStore((s) => s.openCitySearch);
  const user = useAppStore((s) => s.user);
  const settings = useAppStore((s) => s.settings);
  const cities = useAppStore((s) => s.cities);
  const boxes = useAppStore((s) => s.boxes);
  const recycle = useAppStore((s) => s.recycle);
  const notifications = useAppStore((s) => s.notifications);
  const deletion = useAppStore((s) => s.deletion);
  const toggleSetting = useAppStore((s) => s.toggleSetting);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const logout = useAppStore((s) => s.logout);
  const requestDeletion = useAppStore((s) => s.requestDeletion);
  const cancelDeletion = useAppStore((s) => s.cancelDeletion);

  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);

  const lit = litCities(cities);
  const visits = lit.reduce((n, c) => n + c.visits, 0);
  const unread = notifications.filter((n) => n.unread).length;

  const saveProfile = () => {
    useAppStore.getState().updateProfile({ name: name.trim() || user.name, bio: bio.trim(), initial: (name.trim() || user.name).slice(0, 1) });
    setEditOpen(false);
    toast('资料已更新');
  };

  return (
    <div className="screen">
      <div className="apphead">
        <div><h1>我的</h1><div className="sub">{user.joined} 加入 · 已实名</div></div>
        <button className="iconbtn" onClick={() => toast('设置已整合在本页')} aria-label="设置"><Icon name="settings" size={18} /></button>
      </div>

      <div className="profile">
        <div className="profile-card">
          <Avatar initial={user.initial} hue={user.hue} size={62} radius={20} />
          <div style={{ minWidth: 0 }}>
            <h2>{user.name}</h2>
            <div className="meta">{user.age} 岁 · {user.city} <span className="v"><Icon name="shield" size={10} />实名已核验</span></div>
            <div className="meta" style={{ marginTop: 3 }}>{user.bio}</div>
          </div>
          <button className="iconbtn plain edit" style={{ marginLeft: 'auto', alignSelf: 'flex-start' }} onClick={() => setEditOpen(true)} aria-label="编辑资料">
            <Icon name="edit" size={17} />
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>{lit.length}</b><span>点亮城市</span></div>
        <div className="stat"><b>{boxes.length}</b><span>回忆盒</span></div>
        <div className="stat"><b>{visits}</b><span>累计到访</span></div>
      </div>

      <div className="city-strip">
        {lit.map((c) => (
          <button className="city-tile" key={c.name} onClick={() => { useAppStore.getState().setCurrentCity(c.name); navigate('/map'); toast(`已切换到 ${c.name}`); }}>
            <b>{c.name}</b><span>{c.visits} 次 · {c.days} 天</span>
          </button>
        ))}
        <button className="city-tile add" onClick={() => openCitySearch()} aria-label="搜索城市"><Icon name="plus" size={17} /></button>
      </div>

      <SectionTitle title="隐私与安全" extra="最小必要" />
      <div className="menu">
        {([
          ['mapVisible', 'eye', '地图可见性', '关闭后他人看不到你的点亮地图'],
          ['autoLight', 'locate', '自动点亮', '满足 30 分钟 + 2 个定位点时自动点亮'],
          ['albumSync', 'image', '相册自动同步', '仅读取你授权的范围'],
          ['shareVisible', 'users', '共享状态可见', '关闭后立即从同城大厅移除'],
        ] as const).map(([key, icon, title, desc]) => (
          <label className="mrow" key={key}>
            <span className="ic"><Icon name={icon} size={15} /></span>
            <span className="t">{title}<span>{desc}</span></span>
            <span className="r"><Switch checked={settings[key]} onChange={(v) => { toggleSetting(key, v); toast('设置已更新'); }} label={title} /></span>
          </label>
        ))}
        <button className="mrow" onClick={() => toast('黑名单：2 人 · 屏蔽后互不可见')}>
          <span className="ic"><Icon name="shield" size={15} /></span>
          <span className="t">黑名单<span>屏蔽后互不可见</span></span><span className="r">2 人 <Icon name="right" size={13} /></span>
        </button>
        <button className="mrow" onClick={() => toast('定位 7 天后降精度为城市级；可随时关闭')}>
          <span className="ic"><Icon name="lock" size={15} /></span>
          <span className="t">权限与数据说明<span>定位 7 天后降精度为城市级</span></span><span className="r"><Icon name="right" size={13} /></span>
        </button>
      </div>

      <SectionTitle title="数据与存储" extra={`${boxes.reduce((n, b) => n + b.count, 0)} 张素材`} />
      <div className="menu">
        <button className="mrow" onClick={() => toast('正在打包导出 · 完成后发送下载链接', 'download')}>
          <span className="ic"><Icon name="download" size={15} /></span><span className="t">导出我的数据<span>城市清单、到访记录与回忆盒链接</span></span><span className="r"><Icon name="right" size={13} /></span>
        </button>
        <button className="mrow" onClick={() => navigate('/memory')}>
          <span className="ic"><Icon name="trash" size={15} /></span><span className="t">回收站<span>{recycle.length} 个回忆盒 · 30 天内可恢复</span></span><span className="r"><Icon name="right" size={13} /></span>
        </button>
        <button className="mrow" onClick={() => toast('定位历史已删除，城市状态保留')}>
          <span className="ic"><Icon name="locate" size={15} /></span><span className="t">删除定位历史<span>删除后无法恢复，城市点亮状态保留</span></span><span className="r"><Icon name="right" size={13} /></span>
        </button>
      </div>

      <SectionTitle title="更多" extra="v1.0" />
      <div className="menu">
        <button className="mrow" onClick={() => toast(`${unread} 条未读消息`)}>
          <span className="ic"><Icon name="bell" size={15} /></span><span className="t">消息中心<span>{unread} 条未读</span></span><span className="r"><Icon name="right" size={13} /></span>
        </button>
        <button className="mrow" onClick={() => setLogoutOpen(true)}>
          <span className="ic"><Icon name="logout" size={15} /></span><span className="t">退出登录<span>下次打开需要重新验证手机号</span></span><span className="r"><Icon name="right" size={13} /></span>
        </button>
        <button className="mrow" onClick={() => setResetOpen(true)}>
          <span className="ic"><Icon name="refresh" size={15} /></span><span className="t">重置演示数据<span>回到首次使用的状态</span></span><span className="r"><Icon name="right" size={13} /></span>
        </button>
        <button className="mrow danger" onClick={() => setDeleteOpen(true)}>
          <span className="ic"><Icon name="trash" size={15} /></span><span className="t">注销账号<span>7 天冷静期 · 公共内容去标识化</span></span><span className="r"><Icon name="right" size={13} /></span>
        </button>
      </div>

      <div className="footer-note">旅迹 Travelog · 前端 v1.0<br />演示数据保存在本机，不会上传</div>

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="编辑资料" footer={<button className="btn primary block" style={{ marginTop: 14 }} onClick={saveProfile}>保存</button>}>
        <div className="form-stack">
          <label>昵称</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <label>一句话简介</label>
          <input value={bio} onChange={(e) => setBio(e.target.value)} />
          <p className="hint">共享模式下，昵称、年龄段与旅行标签会展示在名片中；手机号和实名信息不会展示。</p>
        </div>
      </Sheet>

      <Sheet
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="退出登录？"
        sub="本机数据会保留，下次用手机号登录"
        footer={(
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setLogoutOpen(false)}>取消</button>
            <button
              className="btn clay"
              style={{ flex: 1 }}
              onClick={() => {
                logout();
                setLogoutOpen(false);
                navigate('/map');
                toast('已退出登录');
              }}
            >
              退出
            </button>
          </div>
        )}
      >
        <p className="hint" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
          退出后城市、回忆盒和发布内容仍保存在本机；再次打开需要手机号验证，并会跳过已完成的资料填写。
        </p>
      </Sheet>

      <Sheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="重置演示数据"
        footer={(
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setResetOpen(false)}>取消</button>
            <button className="btn primary" style={{ flex: 1 }} onClick={() => { resetDemo(); setResetOpen(false); navigate('/map'); toast('演示数据已重置'); }}>重置</button>
          </div>
        )}
      >
        <p className="hint" style={{ fontSize: 12.5, lineHeight: 1.8 }}>将清除本机的点亮记录、回忆盒、共享状态与发布内容，回到首次使用的演示起点。此操作不可撤销。</p>
      </Sheet>

      <Sheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={deletion ? '账号注销中' : '注销账号'}
        sub={deletion ? '7 天冷静期' : '7 天冷静期 · 可随时撤销'}
        footer={deletion ? (
          <button className="btn ghost block" style={{ marginTop: 14 }} onClick={() => { cancelDeletion(); setDeleteOpen(false); toast('已撤销注销申请'); }}>撤销注销</button>
        ) : (
          <button className="btn clay block" style={{ marginTop: 14 }} onClick={() => { requestDeletion(); setDeleteOpen(false); toast('已进入 7 天冷静期', 'clock'); }}>确认注销</button>
        )}
      >
        <p className="hint" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
          {deletion
            ? '期间登录会恢复账号。到期后将删除个人信息，公共内容去标识化，法律要求保留的内容除外。'
            : '申请后 7 天内可撤销；到期将删除个人信息，公共内容去标识化，依法保留的内容除外。'}
        </p>
      </Sheet>
    </div>
  );
}
