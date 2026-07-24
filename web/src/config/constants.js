// أسماء حقول/مفاتيح API فقط - وليست قوائم بيانات أعمال (تلك تُجلب من الإعدادات العامة عبر settingsService).

export const PERMIT_TYPE = { PTW: 'PTW', SFT: 'SFT' };
export const VOLTAGE_LEVEL = { MV: 'M.V', LV: 'L.V' };

export const ACCESS_MODE = {
  READ_ONLY_UNREGISTERED: 'READ_ONLY_UNREGISTERED',
  READ_ONLY: 'READ_ONLY',
  INTERACTIVE_SOURCE: 'INTERACTIVE_SOURCE',
  INTERACTIVE_RECEIVER: 'INTERACTIVE_RECEIVER',
  INTERACTIVE_SOURCE_CLOSE: 'INTERACTIVE_SOURCE_CLOSE',
  ADMIN_FULL: 'ADMIN_FULL'
};
