import React from 'react';

/** أزرار التحكم بالتكبير/التصغير/إعادة الضبط لمقياس "الملاءمة مع الشاشة". */
export default function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }) {
  return (
    <div
      style={{
        position: 'sticky', bottom: 12, display: 'flex', gap: 8, justifyContent: 'center',
        padding: '8px 0', zIndex: 5
      }}
    >
      <div style={{ background: 'var(--color-surface)', borderRadius: 999, boxShadow: '0 2px 10px rgba(0,0,0,0.15)', display: 'flex', gap: 4, padding: 6 }}>
        <button type="button" onClick={onZoomOut} title="تصغير" style={{ background: 'transparent', color: 'var(--color-primary)', fontSize: 18, width: 36, height: 36, borderRadius: '50%' }}>−</button>
        <button type="button" onClick={onReset} title="إعادة الضبط" style={{ background: 'transparent', color: 'var(--color-primary)', fontSize: 12, padding: '0 10px' }}>
          {Math.round(scale * 100)}%
        </button>
        <button type="button" onClick={onZoomIn} title="تكبير" style={{ background: 'transparent', color: 'var(--color-primary)', fontSize: 18, width: 36, height: 36, borderRadius: '50%' }}>+</button>
      </div>
    </div>
  );
}
