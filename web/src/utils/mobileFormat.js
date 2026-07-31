import { sanitizeDigitsOnly } from '../hooks/useArabicIndicDigits.js';

/**
 * توحيد صيغة رقم الجوال في كامل الموقع: يُخزَّن دائمًا كـ"966" + 9 أرقام محلية تبدأ بـ5
 * (بلا رمز + وبلا صفر بادئ)، ليطابق تلقائيًا روابط tel:/wa.me الجاهزة في PartySection.jsx.
 */
export function extractLocalMobileDigits(stored) {
  let digits = sanitizeDigitsOnly(stored || '');
  if (digits.startsWith('966')) digits = digits.slice(3);
  while (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 9);
}

export function buildStoredMobile(localDigits) {
  return localDigits ? '966' + localDigits : '';
}
