import React, { useEffect, useState } from 'react';
import { getSafetyItems } from '../../services/settingsService.js';
import SectionLanguageToggle, { useSectionLanguage } from './SectionLanguageToggle.jsx';
import { t } from '../../config/permitLabels.js';

/** بنود السلامة (Checkbox) تُقرأ ديناميكيًا من جدول "إعدادات السلامة" حسب (نوع التصريح، المرحلة). */
export default function SafetyChecklistSection({ permitType, stage, checkedMap, onToggle, readOnly }) {
  const [items, setItems] = useState([]);
  const [lang, setLang] = useSectionLanguage('ar');

  useEffect(() => {
    let active = true;
    getSafetyItems(permitType, stage)
      .then((rows) => {
        if (active) setItems(rows.filter((r) => r.itemType === 'إجراء'));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [permitType, stage]);

  if (items.length === 0) return null;

  return (
    <div style={{ border: '1px solid #e3e6eb', borderRadius: 'var(--radius-md)', padding: 12, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 13 }}>{t('safetyItems', lang)}</strong>
        <SectionLanguageToggle lang={lang} onChange={setLang} />
      </div>
      {items.map((item) => (
        <label key={item.row} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={!!checkedMap[item.row]}
            disabled={readOnly}
            onChange={(e) => onToggle(item.row, e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>{lang === 'ar' ? item.textAr : (item.textEn || item.textAr)}</span>
        </label>
      ))}
    </div>
  );
}
