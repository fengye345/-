import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { TabBar } from './components/TabBar';
import { useAppStore } from './store/appStore';
import { useUiStore } from './store/uiStore';
import { initNative } from './native';
import { MapScreen } from './screens/MapScreen';
import { MemoryScreen } from './screens/MemoryScreen';
import { MemoryDetailScreen } from './screens/MemoryDetailScreen';
import { ShareScreen } from './screens/ShareScreen';
import { TeamScreen } from './screens/TeamScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { RecommendScreen } from './screens/RecommendScreen';
import { MeScreen } from './screens/MeScreen';
import { AiSheet } from './screens/AiSheet';
import { CitySearchSheet } from './screens/CitySearchSheet';
import { Onboarding } from './screens/Onboarding';

export default function App() {
  useEffect(() => {
    initNative();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('qa') === '1') document.body.classList.add('qa');
    const authStage = params.get('auth');
    if (authStage && !useAppStore.getState().auth) {
      const store = useAppStore.getState();
      store.beginRegistration('13800000000');
      if (authStage !== 'profile') {
        store.completeRegistration({
          name: '小满', age: 25, city: '杭州', tags: ['摄影', '咖啡'], bio: '拍照、徒步、找本地小店', hue: 'a3',
        });
      }
      if (authStage === 'album' || authStage === 'permission') {
        store.updateAuth({ city: { name: '杭州', province: '浙江省' }, light: 'LIGHT' });
      }
      if (authStage === 'permission') {
        store.updateAuth({ album: 'SKIP' });
      }
    }
    if (params.get('demo') !== '1') return;
    const store = useAppStore.getState();
    if (!store.auth?.profileComplete) {
      store.enterDemo();
    } else {
      if (!store.cities['杭州']?.lit) store.lightUp('杭州');
      store.finishOnboarding();
    }
    if (params.get('sheet') === 'citysearch') useUiStore.getState().openCitySearch();
    if (params.get('sheet') === 'ai') useUiStore.getState().openAi();
    if (params.get('state') === 'share' && !store.share.active) store.startShare();
  }, []);

  return (
    <ToastProvider>
      <HashRouter>
        <div className="app-root">
          <div className="app-phone">
            <div className="viewport">
              <Routes>
                <Route path="/" element={<Navigate to="/map" replace />} />
                <Route path="/map" element={<MapScreen />} />
                <Route path="/memory" element={<MemoryScreen />} />
                <Route path="/memory/:boxId" element={<MemoryDetailScreen />} />
                <Route path="/share" element={<ShareScreen />} />
                <Route path="/share/team" element={<TeamScreen />} />
                <Route path="/discover" element={<DiscoverScreen />} />
                <Route path="/recommend/:adcode" element={<RecommendScreen />} />
                <Route path="/me" element={<MeScreen />} />
                <Route path="*" element={<Navigate to="/map" replace />} />
              </Routes>
            </div>
            <TabBar />
            <div id="overlays" className="overlay-layer" />
            <div id="toasts" className="toast-layer" />
            <AiSheet />
            <CitySearchSheet />
            <Onboarding />
          </div>
        </div>
      </HashRouter>
    </ToastProvider>
  );
}
