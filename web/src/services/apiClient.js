import { GAS_WEB_APP_URL } from '../config/apiConfig.js';
import { getStoredToken } from './authService.js';
import { applyServerDataVersions } from './syncService.js';

/**
 * طبقة اتصال موحدة بـ Google Apps Script Web App.
 * كل طلب: POST بجسم JSON { action, token, data }.
 */
export async function callApi(action, data) {
  if (!GAS_WEB_APP_URL) {
    throw new Error('لم يتم ضبط رابط الخادم (VITE_GAS_WEB_APP_URL).');
  }

  const token = getStoredToken();
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token, data: data || {} })
  });

  if (!response.ok) {
    throw new Error('تعذّر الاتصال بالخادم (HTTP ' + response.status + ').');
  }

  const payload = await response.json();
  if (payload.serverDataVersions) {
    applyServerDataVersions(payload.serverDataVersions);
  }
  if (!payload.ok) {
    throw new Error(payload.error || 'حدث خطأ غير متوقع.');
  }
  return payload.result;
}
