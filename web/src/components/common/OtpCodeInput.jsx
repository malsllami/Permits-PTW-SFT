import React, { useRef } from 'react';
import { sanitizeDigitsOnly } from '../../hooks/useArabicIndicDigits.js';

/**
 * إدخال رمز سري بصناديق منفصلة لكل رقم (نمط OTP) - يقبل الأرقام العربية والإنجليزية
 * ويحوّلها فورًا، وينتقل تلقائيًا للصندوق التالي/السابق أثناء الكتابة أو الحذف.
 * القيمة/التغيير بنفس واجهة أي حقل نصي عادي (value نص واحد + onChange(نص)) ليسهل
 * استبدال أي حقل نصي قائم به دون تغيير منطق التخزين.
 */
export default function OtpCodeInput({ value, onChange, length = 6 }) {
  const inputsRef = useRef([]);
  const digits = (value || '').padEnd(length, ' ').split('').slice(0, length);

  const setDigitAt = (index, char) => {
    const next = (value || '').padEnd(length, ' ').split('');
    next[index] = char;
    onChange(next.join('').replace(/ /g, ''));
  };

  const handleChange = (index, raw) => {
    const cleaned = sanitizeDigitsOnly(raw);
    if (!cleaned) {
      setDigitAt(index, '');
      return;
    }
    // يدعم لصق الرمز كاملًا دفعة واحدة في أي صندوق - يوزَّع الأرقام تلقائيًا بدءًا منه.
    const chars = cleaned.split('');
    let i = index;
    chars.forEach((ch) => {
      if (i < length) { setDigitAtImmediate(i, ch); i += 1; }
    });
    const nextFocus = Math.min(i, length - 1);
    inputsRef.current[nextFocus] && inputsRef.current[nextFocus].focus();
  };

  // نسخة تُحدّث onChange دفعة واحدة عند اللصق (لتفادي الكتابة فوق نفسها بسبب closures متتالية)
  function setDigitAtImmediate(index, char) {
    const base = (value || '').padEnd(length, ' ').split('');
    base[index] = char;
    onChange(base.join('').replace(/ /g, ''));
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index].trim()) {
      const prev = index - 1;
      if (prev >= 0) inputsRef.current[prev] && inputsRef.current[prev].focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', direction: 'ltr' }}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputsRef.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={length}
          value={digits[index].trim()}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          style={{
            width: 40, height: 'var(--size-input-height)', textAlign: 'center', fontSize: 18, fontWeight: 'bold',
            borderRadius: 'var(--radius-md)', border: '1px solid #d5d9e0'
          }}
        />
      ))}
    </div>
  );
}
