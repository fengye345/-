import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

interface TravelogLocation {
  checkPermission(): Promise<{ state: string }>;
  requestPermission(): Promise<{ granted: boolean }>;
  start(): Promise<{ started: boolean }>;
  stop(): Promise<{ stopped: boolean }>;
  getLastKnown(): Promise<{ location: LocationPoint | null }>;
  addListener(
    eventName: 'location' | 'providerDisabled' | 'providerEnabled',
    listener: (data: unknown) => void,
  ): Promise<PluginListenerHandle>;
}

export interface LocationPoint {
  lat: number;
  lng: number;
  accuracy: number;
  capturedAtMs: number;
  provider: string;
  mock: boolean;
}

interface TravelogMedia {
  pickImage(): Promise<{ uri: string }>;
  capturePhoto(): Promise<{ uri: string }>;
}

interface TravelogPush {
  requestPermission(): Promise<{ granted: boolean }>;
  getToken(): Promise<{ token: string; provider: string; configured: boolean }>;
}

export const TravelogLocation = registerPlugin<TravelogLocation>('TravelogLocation');
export const TravelogMedia = registerPlugin<TravelogMedia>('TravelogMedia');
export const TravelogPush = registerPlugin<TravelogPush>('TravelogPush');

/**
 * Called once from the app shell. On the web this is a no-op; inside the
 * Capacitor shell it requests location permission and starts the native
 * listener. Points are buffered by the web layer and POSTed to
 * `/api/v1/location/points` in batches.
 */
export async function initNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const permission = await TravelogLocation.requestPermission();
    if (permission.granted) await TravelogLocation.start();
  } catch (error) {
    // Permission denied or location disabled: the PRD requires a manual path,
    // so we never block the app on this call.
    console.warn('[native] location not started', error);
  }
}

export function isNative() {
  return Capacitor.isNativePlatform();
}
