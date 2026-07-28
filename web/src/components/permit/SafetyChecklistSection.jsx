import React, { useEffect, useState } from 'react';
import { getSafetyItems } from '../../services/settingsService.js';
import SectionLanguageToggle from './SectionLanguageToggle.jsx';
import { t } from '../../config/permitLabels.js';
import Icon from '../common/Icon.jsx';

/**
 * "تأكيد الإجراءات" (Checkbox) تُقرأ ديناميكيًا من جدول "إعدادات السلامة" حسب (نوع
 * التصريح، المرحلة) - إقرار من الموظف بأنه نفّذ الإجراءات فعليًا، وليست تعليمات للقراءة
 * فقط (تلك منفصلة تمامًا - انظر SafetyAcknowledgmentGate/SafetyInstructionsPage).
 * لغة العرض تُضبط من المكوّن الأب (PartySection عبر PermitDocumentViewer) وليست حالة
 * داخلية، لتنعكس نفس اللغة على بقية بطاقة الطرف (التسميات/الأزرار) دفعة واحدة.
 */
export default function SafetyChecklistSection({ permitType, stage, checkedMap, onToggle, readOnly, onCompletionChange, lang, onLangChange, forceOpen }) {
  const [items, setItems] = useState([]);
  // مطويّة افتراضيًا دائمًا أثناء دورة الحياة التفاعلية (تعبئة أو قراءة مرحلة سابقة) لتقليل
  // طول الصفحة وسرعة الإدخال - تُفتح فقط عند الحاجة الفعلية بضغطة المستخدم. أما شاشة العرض
  // النهائية بعد الإغلاق الكامل (forceOpen) فتُظهر كل البنود دومًا بلا طيّ إطلاقًا، لأنها
  // وثيقة رسمية يجب أن تعرض كل شيء دفعة واحدة.
  const [open, setOpen] = useState(!!forceOpen);

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
        onClick={forceOpen ? undefined : () => setOpen((v) => !v)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open ? 4 : 0, cursor: forceOpen ? 'default' : 'pointer' }}
      >
        {/* أيقونة واحدة فقط (السهم) بدل درع+سهم متضادين في الجهة - السهم وحده يكفي للدلالة
            على قابلية الطي/الفتح، ويبقى بجانب النص مباشرة في نفس الجهة دائمًا. مطويّة
            دائمًا افتراضيًا (تعبئة أو قراءة) لتقليل طول الصفحة - نص فرعي "مراجعة الإجراءات"
            يوضّح أنها قابلة للفتح عند الحاجة. */}
        <strong style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!forceOpen && <Icon name={open ? 'expand_less' : 'chevron_left'} size={16} />}
            {t('safetyItems', lang)} ({items.length})
          </span>
          {!open && <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.65 }}>{t('reviewActions', lang)}</span>}
        </strong>
        {open && <SectionLanguageToggle lang={lang} onChange={onLangChange} />}
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {items.map((item) => {
            const checked = !!checkedMap[item.row];
            return (
              // كل بند بطاقته المستقلة الصغيرة المستديرة الزوايا (بدل صف قائمة طويل متصل) -
              // أقرب لواجهات iOS الحديثة، وتُميَّز البطاقة نفسها بخلفية خضراء فاتحة عند
              // اكتمال البند بدل الاعتماد على لون النص وحده.
              <label
                key={item.row} className="safety-item"
                style={{
                  display: 'flex', gap: 8, alignItems: 'center', minHeight: 40, fontSize: 12,
                  padding: '8px 10px', borderRadius: 'var(--radius-md)',
                  background: checked ? '#EAF7EE' : '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  color: checked ? '#1B5E20' : undefined, fontWeight: checked ? 'bold' : undefined
                }}
              >
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
      )}
    </div>
  );
}
