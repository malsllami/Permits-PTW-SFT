const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** يحوّل الأرقام العربية (الهندية) إلى إنجليزية فور الكتابة، ويرفض أي حرف غير رقمي. */
export function convertArabicDigitsToEnglish(value) {
  if (value === null || value === undefined) return value;
  return String(value).replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)));
}

export function sanitizeDigitsOnly(value) {
  return convertArabicDigitsToEnglish(value).replace(/[^0-9]/g, '');
}

export function useArabicIndicDigitsHandler(onChange) {
  return (e) => {
    const sanitized = sanitizeDigitsOnly(e.target.value);
    onChange(sanitized);
  };
}
