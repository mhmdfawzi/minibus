import { Capacitor } from '@capacitor/core';
import { environment } from '../environments/environment';

export function getApiBaseUrl(): string {
  return Capacitor.isNativePlatform()
    ? environment.nativeApiBaseUrl
    : environment.apiBaseUrl;
}
