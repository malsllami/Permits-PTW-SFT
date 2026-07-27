import { DATA_VERSIONS_STORAGE_KEY } from '../config/apiConfig.js';

function getLocalVersions() {
  const raw = localStorage.getItem(DATA_VERSIONS_STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function setLocalVersions(versions) {
  localStorage.setItem(DATA_VERSIONS_STORAGE_KEY, JSON.stringify(versions));
}

/**
 * تُستدعى بعد كل استجابة API - تقارن أرقام الإصدار الواردة من السيرفر بالنسخة المحلية
 * وتُحدِّثها في التخزين المحلي (الأساس لدعم مزامنة تزايدية مستقبلية بدل إعادة تحميل كل شيء).
 */
export function applyServerDataVersions(serverVersions) {
  const local = getLocalVersions();
  let changed = false;

  Object.keys(serverVersions).forEach((table) => {
    if (local[table] !== serverVersions[table]) {
      changed = true;
      local[table] = serverVersions[table];
    }
  });

  if (changed) {
    setLocalVersions(local);
  }
}
