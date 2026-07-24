import { callApi } from './apiClient.js';

export const getPublicSettings = () => callApi('getPublicSettings', {});
export const getAllSettings = () => callApi('getAllSettings', {});
export const updateSettingValue = (group, key, valueAr, valueEn) =>
  callApi('updateSettingValue', { group, key, valueAr, valueEn });

export const getSafetyItems = (permitType, stage) => callApi('getSafetyItems', { permitType, stage });
export const getSafetyInstructions = (permitType) => callApi('getSafetyInstructions', { permitType });
export const addSafetyItem = (item) => callApi('addSafetyItem', { item });
export const updateSafetyItem = (row, item) => callApi('updateSafetyItem', { row, item });
export const deactivateSafetyItem = (row) => callApi('deactivateSafetyItem', { row });

export const getDashboardStats = () => callApi('getDashboardStats', {});
export const listOperations = (filters) => callApi('listOperations', { filters });

/** يحقن ألوان "الإعدادات العامة" > "ألوان النظام" كـ CSS variables في الجذر. */
export function applyColorsFromSettings(settingsRows) {
  const colorGroup = settingsRows.filter((s) => s.group === 'ألوان النظام');
  const map = {
    'PRIMARY COLOR': '--color-primary',
    'PRIMARY LIGHT COLOR': '--color-primary-light',
    'SECONDARY COLOR': '--color-secondary',
    'ACCENT COLOR': '--color-accent',
    'TEXT COLOR': '--color-text',
    'WARNING COLOR': '--color-warning',
    'ERROR COLOR': '--color-error',
    'SUCCESS COLOR': '--color-success'
  };
  colorGroup.forEach((s) => {
    const cssVar = map[s.key];
    if (cssVar && s.valueAr) {
      document.documentElement.style.setProperty(cssVar, s.valueAr);
    }
  });
}
