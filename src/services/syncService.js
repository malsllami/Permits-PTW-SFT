import { DATA_VERSIONS_STORAGE_KEY } from '../config/apiConfig.js';

const listeners = new Set();

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
 * تُستدعى بعد كل استجابة API - تقارن أرقام الإصدار الواردة من السيرفر بالنسخة المحلية،
 * وتُبلغ أي مستمعين (useSyncedResource) بأن جدولًا معينًا تغيّر ليعيدوا الجلب فقط عند الحاجة.
 */
export function applyServerDataVersions(serverVersions) {
  const local = getLocalVersions();
  const changedTables = [];

  Object.keys(serverVersions).forEach((table) => {
    if (local[table] !== serverVersions[table]) {
      changedTables.push(table);
      local[table] = serverVersions[table];
    }
  });

  if (changedTables.length > 0) {
    setLocalVersions(local);
    listeners.forEach((cb) => cb(changedTables));
  }
}

export function onDataVersionsChanged(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
