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
        flex: 1, textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
        border: '2px solid ' + color, opacity: disabled ? 0.5 : 1, padding: 18
      }}
    >
      <div style={{ fontSize: 'var(--fs-card-title)', fontWeight: 'bold', color }}>{type}</div>
      {/* ارتفاع أدنى ثابت للعنوان الفرعي (سطران) - وإلا يختلف ارتفاع بطاقتي PTW/SFT فعليًا
          لأن نص SFT ("تصريح التعميد بالاختبار") أطول من نص PTW ويلتفّ لسطر إضافي. */}
      <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-text)', minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{subtitle}</div>
    </button>
  );
}
