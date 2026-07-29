import React, { useState } from 'react';
import Icon from './Icon.jsx';

/**
 * بطاقة العدادات بالشاشة الرئيسية - معلومة فقط (وليست عملاً)، مطويّة افتراضيًا بسطر واحد
 * مختصر (📊 إحصائياتي PTW xx SFT xx)، ولا تُظهر التفصيل الكامل (created/received/closed/
 * archived/trash - يُمرَّر عبر children) إلا بضغطة توسيع صريحة من الموظف.
 */
export default function StatsCard({ totalPtw, totalSft, children }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="app-card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', background: 'none', padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 0 }}
      >
        <span style={{ fontSize: 12, fontWeight: 'bold', opacity: 0.75, display: 'flex', alignItems: 'center', gap: 10 }}>
          📊 إحصائياتي
          <span>PTW {totalPtw}</span>
          <span>SFT {totalSft}</span>
        </span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={18} />
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, fontWeight: 'bold' }}>
          {children}
        </div>
      )}
    </section>
  );
}
