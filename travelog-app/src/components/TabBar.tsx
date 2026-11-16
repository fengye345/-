import { NavLink, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/map', label: '地图', icon: 'map' },
  { to: '/memory', label: '回忆', icon: 'layers' },
  { to: '/share', label: '共享', icon: 'users' },
  { to: '/discover', label: '发现', icon: 'compass' },
  { to: '/me', label: '我的', icon: 'user' },
];

export function TabBar() {
  const { pathname } = useLocation();
  const hidden = pathname.startsWith('/memory/') || pathname === '/share/team'
    || pathname.startsWith('/recommend/');

  if (hidden) return null;

  return (
    <nav className="tabbar" aria-label="主导航">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
        >
          <span className="tab-ico">
            <Icon name={tab.icon} size={23} />
          </span>
          <span className="tab-txt">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
