import React from 'react';

/** بطاقة إحصائية صغيرة (رقم + تسمية) - تُستخدم في بطاقات الإنشاء/الاستلام/الإغلاق بالشاشة الرئيسية. */
export default function StatCard({ label, value, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 'var(--radius-lg)', padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 'bold', color, marginTop: 2 }}>{label}</div>
    </div>
  );
}
