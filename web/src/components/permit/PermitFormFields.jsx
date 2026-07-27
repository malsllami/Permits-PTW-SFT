import React, { useState } from 'react';
import { normalizeMixedInput } from '../../hooks/useArabicIndicDigits.js';
import { splitToBadgeItems } from '../../utils/permitFormatting.js';
import { WORK_FIELD_LABEL_BG, WORK_FIELD_LABEL_TEXT, WORK_FIELD_VALUE_BG } from './permitTheme.js';

/** حقل من "بيانات العمل": تسمية بخلفية سماوية فاتحة ثابتة + قيمة بخلفية أغمق قليلًا من الأبيض. */
export function WorkField({ label, value, editable, onChange, full }) {
  return (
    <div className="wf-field" style={{ gridColumn: full ? '1 / -1' : undefined, background: WORK_FIELD_LABEL_BG, borderRadius: 10, padding: 6 }}>
      <div className="wf-field-label" style={{ fontWeight: 'bold', marginBottom: 2, fontSize: 10, color: WORK_FIELD_LABEL_TEXT }}>{label}</div>
      {editable ? (
        <input
          type="text" style={{ width: '100%', minHeight: 34, background: WORK_FIELD_VALUE_BG, fontWeight: 'bold' }}
          defaultValue={value || ''}
          onChange={(e) => { const v = normalizeMixedInput(e.target.value); e.target.value = v; onChange(v); }}
        />
      ) : (
        <div className="wf-field-value" style={{ minHeight: 16, background: WORK_FIELD_VALUE_BG, borderRadius: 6, padding: '3px 8px', fontWeight: 'bold' }}>{value || '—'}</div>
      )}
    </div>
  );
}

/** حقل اختيار من قائمة من "بيانات العمل" (مستوى الجهد لـPTW) - نفس مظهر WorkField لكن بقائمة منسدلة بدل نص حر. */
export function WorkSelectField({ label, value, editable, onChange, options, full }) {
  return (
    <div className="wf-field" style={{ gridColumn: full ? '1 / -1' : undefined, background: WORK_FIELD_LABEL_BG, borderRadius: 10, padding: 6 }}>
      <div className="wf-field-label" style={{ fontWeight: 'bold', marginBottom: 2, fontSize: 10, color: WORK_FIELD_LABEL_TEXT }}>{label}</div>
      {editable ? (
        // Uncontrolled عمدًا (defaultValue وليس value) - "value" هنا يأتي من permit.voltageLevel
        // الذي لا يتحدّث محليًا إلا بعد إعادة تحميل التصريح من الخادم، فلو كان controlled كانت
        // القائمة ترتد فورًا للقيمة القديمة فور الاختيار (تبدو وكأنها "لا تقبل" الاختيار).
        <select style={{ width: '100%', minHeight: 34, background: WORK_FIELD_VALUE_BG, fontWeight: 'bold' }} defaultValue={value || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>—</option>
          {options.map((opt) => (
            <option key={opt.key} value={opt.valueEn || opt.valueAr}>{opt.valueAr}</option>
          ))}
        </select>
      ) : (
        <div className="wf-field-value" style={{ minHeight: 16, background: WORK_FIELD_VALUE_BG, borderRadius: 6, padding: '3px 8px', fontWeight: 'bold' }}>
          {(options.find((o) => (o.valueEn || o.valueAr) === value) || {}).valueAr || value || '—'}
        </div>
      )}
    </div>
  );
}

/**
 * حقل عناصر متعددة على شكل Badges منفصلة (نقاط العزل/مفاتيح المصدر) بدل نص حر متصل في
 * حقل واحد - يُخزَّن سلكيًا كنص واحد مفصول بفواصل عربية (كما كان)، لكن يُعرض ويُحرَّر كعناصر
 * مستقلة قابلة للإضافة/الحذف كل عنصر بمفرده، حسب دليل التصميم.
 */
export function BadgeChipField({ label, value, editable, onChange, full }) {
  // قائمة محلية (وليست مُشتقّة من "value" في كل عرض) - "value" يأتي من permit.isolationPoints
  // الذي لا يتحدّث إلا بعد إعادة تحميل التصريح من الخادم؛ لو اعتمدت العناصر على "value"
  // مباشرة، كانت كل إضافة جديدة تُعاد حسابها من القيمة القديمة نفسها فتُفقد الإضافة السابقة
  // (نفس مبدأ الحقول النصية العادية defaultValue غير الخاضعة للتحكم الكامل).
  const [items, setItems] = useState(() => splitToBadgeItems(value));
  const [draft, setDraft] = useState('');

  const commitDraft = () => {
    const cleaned = draft.trim();
    if (!cleaned) return;
    const next = [...items, cleaned];
    setItems(next);
    onChange(next.join('، '));
    setDraft('');
  };

  const removeAt = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    onChange(next.join('، '));
  };

  return (
    <div className="wf-field" style={{ gridColumn: full ? '1 / -1' : undefined, background: WORK_FIELD_LABEL_BG, borderRadius: 10, padding: 8, marginTop: 8 }}>
      <div className="wf-field-label" style={{ fontWeight: 'bold', marginBottom: 2, fontSize: 10, color: WORK_FIELD_LABEL_TEXT }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)', background: '#fff', borderRadius: 999, padding: '3px 10px',
              fontSize: 12, fontWeight: 'bold'
            }}
          >
            {item}
            {editable && (
              <button
                type="button" onClick={() => removeAt(i)}
                style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--color-error)', fontWeight: 'bold', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}
              >
                ×
              </button>
            )}
          </span>
        ))}
        {items.length === 0 && !editable && <span style={{ fontSize: 12, opacity: 0.6 }}>—</span>}
      </div>
      {editable && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input
            type="text" style={{ flex: 1, background: WORK_FIELD_VALUE_BG, fontWeight: 'bold' }}
            value={draft}
            placeholder="اكتب ثم اضغط إضافة"
            onChange={(e) => setDraft(normalizeMixedInput(e.target.value))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitDraft(); } }}
          />
          <button type="button" className="secondary" onClick={commitDraft}>إضافة</button>
        </div>
      )}
    </div>
  );
}
