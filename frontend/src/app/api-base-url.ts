import { Capacitor } from '@capacitor/core';
import { environment } from '../environments/environment';

declare global {
  interface Window {
    __TRANSPORT_CONFIG__?: {
      apiBaseUrl?: string;
      nativeApiBaseUrl?: string;
    };
  }
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  const runtimeConfig =
    typeof window === 'undefined' ? undefined : window.__TRANSPORT_CONFIG__;
  const apiBaseUrl = runtimeConfig?.apiBaseUrl || environment.apiBaseUrl;
  const nativeApiBaseUrl =
    runtimeConfig?.nativeApiBaseUrl ||
    runtimeConfig?.apiBaseUrl ||
    environment.nativeApiBaseUrl;

  return normalizeBaseUrl(
    Capacitor.isNativePlatform() ? nativeApiBaseUrl : apiBaseUrl
  );
}
