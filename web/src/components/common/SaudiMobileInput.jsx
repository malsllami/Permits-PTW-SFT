import React from 'react';
import { extractLocalMobileDigits, buildStoredMobile } from '../../utils/mobileFormat.js';

/**
 * حقل إدخال رقم جوال موحَّد لكامل الموقع - "+966" ثابت غير قابل للتعديل، والإدخال يقبل
 * فقط الجزء المحلي (9 أرقام تبدأ بـ5، يُحذف أي صفر بادئ تلقائيًا لو كُتب) - راجع mobileFormat.js.
 */
export default function SaudiMobileInput({ value, onChange, style, inputStyle, disabled }) {
  const local = extractLocalMobileDigits(value);

  const handleChange = (e) => {
    onChange(buildStoredMobile(extractLocalMobileDigits(e.target.value)));
  };

  return (
    <div dir="ltr" style={{ display: 'flex', alignItems: 'center', gap: 6, ...style }}>
      <span style={{ fontWeight: 'bold', opacity: 0.7, whiteSpace: 'nowrap' }}>+966</span>
      <input
        type="tel"
        inputMode="numeric"
        placeholder="5xxxxxxxx"
        value={local}
        disabled={disabled}
        onChange={handleChange}
        maxLength={9}
        style={{ flex: 1, ...inputStyle }}
      />
    </div>
  );
}
