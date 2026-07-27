import React, { useEffect, useState } from 'react';
import { getSafetyItems } from '../../services/settingsService.js';
import SectionLanguageToggle, { useSectionLanguage } from './SectionLanguageToggle.jsx';
import { t } from '../../config/permitLabels.js';
import Icon from '../common/Icon.jsx';

/** بنود السلامة (Checkbox) تُقرأ ديناميكيًا من جدول "إعدادات السلامة" حسب (نوع التصريح، المرحلة). */
export default function SafetyChecklistSection({ permitType, stage, checkedMap, onToggle, readOnly, onCompletionChange }) {
  const [items, setItems] = useState([]);
  const [lang, setLang] = useSectionLanguage('ar');
  // مطويّة افتراضيًا في وضع القراءة فقط (بعد تجاوز المرحلة) لتوفير مساحة، ومفتوحة دائمًا
  // أثناء التعبئة الفعلية (يحتاج المستخدم رؤية البنود ليضع علامة عليها).
  const [open, setOpen] = useState(!readOnly);

  useEffect(() => {
    let active = true;
    getSafetyItems(permitType, stage)
      .then((rows) => {
        if (active) setItems(rows.filter((r) => r.itemType === 'إجراء'));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [permitType, stage]);

  useEffect(() => {
    if (!onCompletionChange) return;
    if (items.length === 0) {
      onCompletionChange(true);
      return;
    }
    const allChecked = items.every((item) => !item.required || checkedMap[item.row]);
    onCompletionChange(allChecked);
    // eslint-disable-next-line
  }, [items, checkedMap]);

  if (items.length === 0) return null;

  return (
    <div className="safety-checklist" style={{ border: '1px solid #e3e6eb', borderRadius: 'var(--radius-md)', padding: 10, marginTop: 10 }}>
      <div
        onClick={readOnly ? () => setOpen((v) => !v) : undefined}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open ? 4 : 0, cursor: readOnly ? 'pointer' : 'default' }}
      >
        {/* أيقونة واحدة فقط (السهم) بدل درع+سهم متضادين في الجهة - السهم وحده يكفي للدلالة
            على قابلية الطي/الفتح، ويبقى بجانب النص مباشرة في نفس الجهة دائمًا. */}
        <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          {readOnly && <Icon name={open ? 'expand_less' : 'chevron_left'} size={16} />}
          {t('safetyItems', lang)} ({items.length})
        </strong>
        {open && <SectionLanguageToggle lang={lang} onChange={setLang} />}
      </div>
      {open && items.map((item) => {
        const checked = !!checkedMap[item.row];
        return (
          <label key={item.row} className="safety-item" style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 34, fontSize: 12, color: checked ? '#1B5E20' : undefined, fontWeight: checked ? 'bold' : undefined }}>
            {readOnly ? (
              // بعد إغلاق المرحلة (وعند الطباعة/PDF تحديدًا) نستخدم مربّعًا مرسومًا بالكود
              // بدل input[type=checkbox] الأصلي - محركات الطباعة/PDF في المتصفحات لا تُظهر
              // دائمًا لون accent-color لصندوق الاختيار الأصلي بشكل موثوق، بينما هذا العنصر
              // (خلفية/حدود عادية) يُطبع بنفس الشكل واللون الأخضر في كل الحالات دون استثناء.
              <span style={{
                marginTop: 1, width: 12, height: 12, minWidth: 12, borderRadius: 3, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                background: checked ? '#2E9E49' : '#fff', border: '1.5px solid ' + (checked ? '#2E9E49' : '#999'),
                color: '#fff', fontSize: 9, fontWeight: 'bold'
              }}>
                {checked ? '✓' : ''}
              </span>
            ) : (
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle(item.row, e.target.checked)}
                style={{ marginTop: 2, width: 12, height: 12, accentColor: '#2E9E49' }}
              />
            )}
            <span>{lang === 'ar' ? item.textAr : (item.textEn || item.textAr)}</span>
          </label>
        );
      })}
    </div>
  );
}
