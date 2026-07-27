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
export function SafetyInstructionsTable({ instructions, lang, onLangChange }) {
  if (!instructions || instructions.length === 0) return null;
  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <SectionLanguageToggle lang={lang} onChange={onLangChange} />
      </div>
      <div className="table-scroll-wrap">
        <table className="app-table">
          <thead>
            <tr><th>{lang === 'ar' ? 'بند تعليمات السلامة' : 'Safety Instruction'}</th></tr>
          </thead>
          <tbody>
            {instructions.map((item) => (
              <tr key={item.row}>
                <td style={{ textAlign: lang === 'ar' ? 'right' : 'left', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                  {lang === 'ar' ? item.textAr : (item.textEn || item.textAr)}
                </td>
              </tr>
            ))}
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
export default function SafetyInstructionsPage({ permitType, lang: controlledLang, onLangChange }) {
  const instructions = useSafetyInstructions(permitType);
  const [localLang, setLocalLang] = useState('ar');
  const lang = controlledLang || localLang;
  const setLang = onLangChange || setLocalLang;

  if (instructions.length === 0) return null;

  return (
    <div className="app-card safety-instructions-page" style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 15, color: 'var(--color-primary)', textAlign: 'center', margin: '0 0 10px' }}>
        {lang === 'ar' ? 'قواعد وتعليمات السلامة الهامة' : 'Important Safety Instructions'}
      </h3>
      <SafetyInstructionsTable instructions={instructions} lang={lang} onLangChange={setLang} />
    </div>
  );
}
