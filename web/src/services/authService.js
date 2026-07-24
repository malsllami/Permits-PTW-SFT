import { SESSION_STORAGE_KEY } from '../config/apiConfig.js';
import { callApi } from './apiClient.js';

export function getStoredSession() {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function getStoredToken() {
  const session = getStoredSession();
  return session ? session.token : null;
}

export function setStoredSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function loginWithEmployeeId(employeeId) {
  const result = await callApi('login', { employeeId });
  setStoredSession({ token: result.token, employee: result.employee });
  return result;
}

export function logout() {
  clearStoredSession();
}
