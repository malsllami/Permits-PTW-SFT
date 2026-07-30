import React from 'react';

/**
 * بطاقة قابلة للنقر لبدء إنشاء تصريح (PTW أو SFT) مباشرة - الضغط عليها يفتح نموذج
 * الإدخال فورًا بدون خطوة اختيار وسيطة (قسم 4 بدليل التصميم).
 */
export default function RoleClickCard({ type, subtitle, onClick, disabled }) {
  const color = type === 'PTW' ? 'var(--color-ptw)' : 'var(--color-sft)';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="app-card"
      style={{
        // flex:1 وحدها لا تكفي لمساواة عرض البطاقتين - العنصر الفرعي يحمل min-width:auto
        // ضمنيًا بحكم المتصفح، فيفرض نص SFT الأطول ("تصريح التعميد بالاختبار") عرضًا أدنى
        // أكبر لبطاقته رغم تساوي flex-grow، فتظهر البطاقتان بعرضين مختلفين فعليًا. minWidth:0
        // يُلغي هذا القيد الضمني فتنقسم المساحة 50/50 دائمًا مهما طال النص (يلتفّ بدل أن يوسّع
        // البطاقة). minHeight ثابت أيضًا لضمان ارتفاع موحّد بصرف النظر عن عدد أسطر العنوان الفرعي.
        flex: 1, minWidth: 0, minHeight: 108, textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
        border: '2px solid ' + color, opacity: disabled ? 0.5 : 1, padding: 18,
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
      }}
    >
      <div style={{ fontSize: 'var(--fs-card-title)', fontWeight: 'bold', color }}>{type}</div>
      <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-text)', minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{subtitle}</div>
    </button>
  );
}
