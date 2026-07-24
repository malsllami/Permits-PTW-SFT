import React from 'react';
import { sanitizeDigitsOnly } from '../../hooks/useArabicIndicDigits.js';

/** حقل رقمي يقبل الأرقام العربية والإنجليزية معًا مع تحويل فوري أثناء الكتابة. */
export default function NumericInputAr({ value, onChange, placeholder, disabled }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value || ''}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(sanitizeDigitsOnly(e.target.value))}
    />
  );
}
