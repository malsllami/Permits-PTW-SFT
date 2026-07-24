import React, { useState } from 'react';

/** كل قسم في التصريح يملك حالة لغة مستقلة خاصة به - وليس مفتاح لغة واحد للصفحة كاملة. */
export function useSectionLanguage(initial = 'ar') {
  const [lang, setLang] = useState(initial);
  return [lang, setLang];
}

export default function SectionLanguageToggle({ lang, onChange }) {
  return (
    <div style={{ display: 'inline-flex', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--color-primary)' }}>
      <button
        type="button"
        onClick={() => onChange('ar')}
        style={{
          background: lang === 'ar' ? 'var(--color-primary)' : 'transparent',
          color: lang === 'ar' ? '#fff' : 'var(--color-primary)',
          fontSize: 11, padding: '3px 10px', borderRadius: 0
        }}
      >
        عربي
      </button>
      <button
        type="button"
        onClick={() => onChange('en')}
        style={{
          background: lang === 'en' ? 'var(--color-primary)' : 'transparent',
          color: lang === 'en' ? '#fff' : 'var(--color-primary)',
          fontSize: 11, padding: '3px 10px', borderRadius: 0
        }}
      >
        EN
      </button>
    </div>
  );
}
