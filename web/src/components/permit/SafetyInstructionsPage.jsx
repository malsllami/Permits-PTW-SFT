import React, { useEffect, useState } from 'react';
import { getSafetyInstructions } from '../../services/settingsService.js';
import SectionLanguageToggle from './SectionLanguageToggle.jsx';

/** يجلب بنود "تعليمات" السلامة (للاطلاع فقط) لهذا النوع من التصريح - يُستخدم لعرضها ولحساب عددها. */
export function useSafetyInstructions(permitType) {
  const [instructions, setInstructions] = useState([]);
  useEffect(() => {
    let active = true;
    getSafetyInstructions(permitType).then((rows) => { if (active) setInstructions(rows); }).catch(() => {});
    return () => { active = false; };
  }, [permitType]);
  return instructions;
}

/**
 * جدول موحّد بلغة واحدة لتعليمات السلامة مع زر تبديل اللغة (وليس عمودين ثنائيي اللغة
 * جنبًا إلى جنب) - يُستخدم أثناء التعبئة التفاعلية وأيضًا كأساس لصفحة التعليمات النهائية
 * بعد الإغلاق. زر التبديل نفسه داخل "no-print" فيختفي تلقائيًا عند الطباعة/PDF - اللغة
 * التي كانت مختارة لحظة الطباعة (يُختارها المستخدم صراحة قبل الطباعة) هي ما يُطبع فعليًا.
 */
export function SafetyInstructionsTable({ instructions, lang, onLangChange, responsiveFontSize }) {
  if (!instructions || instructions.length === 0) return null;
  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <SectionLanguageToggle lang={lang} onChange={onLangChange} />
      </div>
      <div className="table-scroll-wrap">
        <table className="app-table app-table-list">
          <thead>
            <tr><th>{lang === 'ar' ? 'بند تعليمات السلامة' : 'Safety Instruction'}</th></tr>
          </thead>
          <tbody>
            {instructions.map((item) => {
              const text = lang === 'ar' ? item.textAr : (item.textEn || item.textAr);
              // على الجوال فقط (responsiveFontSize) - كلما طالت الجملة صغُر خطها تدريجيًا
              // (100% ← 90% ← 83%، أي 18 ← 16 ← 15 عند الحجم الافتراضي) قبل أن تُضطر
              // للالتفاف لسطر جديد - نسبةً من حجم الخط الحالي (بما يشمل زر "A+" للتكبير،
              // فلا يتعارض التصغير التدريجي مع تكبير المستخدم اليدوي). نسخة PDF/الطباعة
              // لا تستخدم هذا الخيار إطلاقًا فيبقى حجمها الحالي بلا أي تغيير.
              const shrinkRatio = text.length > 90 ? 0.83 : text.length > 60 ? 0.9 : 1;
              const fontSize = responsiveFontSize ? 'calc(var(--table-font-size, 18px) * ' + shrinkRatio + ')' : undefined;
              return (
                <tr key={item.row}>
                  <td style={{ textAlign: lang === 'ar' ? 'right' : 'left', direction: lang === 'ar' ? 'rtl' : 'ltr', fontSize }}>
                    {text}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * قواعد وتعليمات السلامة للاطلاع فقط على الشاشة - تُعرض بلغة واحدة قابلة للتبديل (مطابقة
 * لصفحة "Important Instructions" في النماذج الورقية المرجعية، لكن بجدول موحّد بدل عمودين
 * ثنائيي اللغة). تظهر بعد إغلاق/إلغاء التصريح. نسخة الطباعة/PDF منفصلة تمامًا (الصفحة 4
 * من PermitPrint) وتستخدم نفس SafetyInstructionsTable المشترك أدناه بلغة ثابتة مُختارة.
 */
// دورة أحجام خط القراءة على الجوال - افتراضي مريح للقراءة السريعة، مع إمكانية تكبيره
// لمن يحتاج خطًا أكبر، ثم يعود للحجم الافتراضي عند تجاوز آخر قيمة (وليس تكبيرًا بلا حدود).
const READING_FONT_SIZES = [16, 20, 24];

export default function SafetyInstructionsPage({ permitType, lang: controlledLang, onLangChange }) {
  const instructions = useSafetyInstructions(permitType);
  const [localLang, setLocalLang] = useState('ar');
  const lang = controlledLang || localLang;
  const setLang = onLangChange || setLocalLang;
  const [fontSizeIdx, setFontSizeIdx] = useState(0);

  if (instructions.length === 0) return null;

  const fontSize = READING_FONT_SIZES[fontSizeIdx];

  return (
    <div
      className="app-card safety-instructions-page"
      style={{ marginTop: 16, '--table-font-size': fontSize + 'px', '--table-line-height': 1.65 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, color: 'var(--color-primary)', margin: 0 }}>
          {lang === 'ar' ? 'قواعد وتعليمات السلامة الهامة' : 'Important Safety Instructions'}
        </h3>
        <button
          type="button"
          className="no-print secondary"
          onClick={() => setFontSizeIdx((i) => (i + 1) % READING_FONT_SIZES.length)}
          style={{ fontSize: 12, padding: '6px 10px', minHeight: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <strong>A+</strong> تكبير النص
        </button>
      </div>
      <SafetyInstructionsTable instructions={instructions} lang={lang} onLangChange={setLang} responsiveFontSize />
    </div>
  );
}
