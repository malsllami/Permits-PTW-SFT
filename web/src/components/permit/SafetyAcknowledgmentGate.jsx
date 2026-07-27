import React, { useEffect, useState } from 'react';
import { getPublicSettings } from '../../services/settingsService.js';
import { useSafetyInstructions } from './SafetyInstructionsPage.jsx';
import Icon from '../common/Icon.jsx';
import { formatMaybeIsoDateOnly } from '../../hooks/useHijriGregorianDate.js';

/** يفتح تعليمات السلامة في تبويب/نافذة منفصلة (وليس ضمن النافذة المنبثقة نفسها) - صفحة
    بسيطة قابلة للطباعة مباشرة (Ctrl+P أو "حفظ كـ PDF" من نافذة طباعة المتصفح). */
function openInstructionsWindow(instructions, permitType) {
  const win = window.open('', '_blank');
  if (!win) return;
  const rows = instructions.map((item) => '<li>' + (item.textAr || '') + '</li>').join('');
  win.document.write(
    '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
    '<title>تعليمات السلامة</title>' +
    '<style>body{font-family:Tahoma,sans-serif;padding:24px;max-width:700px;margin:0 auto}' +
    'h1{font-size:18px;color:#173F7A;text-align:center}li{margin-bottom:10px;font-size:14px;font-weight:bold}</style>' +
    '</head><body><h1>قواعد وتعليمات السلامة الهامة - ' + permitType + '</h1><ol>' + rows + '</ol></body></html>'
  );
  win.document.close();
}

/**
 * بوابة إقرار الاطلاع على تعليمات السلامة - شريط مضغوط ثابت (ارتفاع 70-80px) يفتح عند
 * الضغط نافذة منبثقة (Modal) تحوي فقط: تاريخ آخر مراجعة، نص الإقرار مع صندوق الموافقة،
 * وزر المتابعة - وزر منفصل "عرض تعليمات السلامة" يفتح التعليمات في تبويب مستقل بدل تضخيم
 * النافذة المنبثقة بجدول كامل.
 */
export default function SafetyAcknowledgmentGate({ permitType, onAcknowledge }) {
  const instructions = useSafetyInstructions(permitType);
  const [modalOpen, setModalOpen] = useState(false);
  const [ackChecked, setAckChecked] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    let active = true;
    getPublicSettings().then((rows) => {
      if (!active) return;
      const row = rows.filter((s) => s.group === 'معلومات النظام' && s.key === 'SAFETY RULES UPDATED AT')[0];
      setLastUpdated(formatMaybeIsoDateOnly(row && row.valueAr));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="no-print"
        style={{
          width: '100%', background: 'var(--color-bg-safety)', color: 'var(--color-primary)',
          border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-lg)', marginTop: 16,
          padding: '8px 14px', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'right'
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <strong style={{ fontSize: 13 }}>بنود السلامة ({instructions.length})</strong>
          {lastUpdated && <span style={{ fontSize: 11, opacity: 0.75, fontWeight: 500 }}>آخر مراجعة {lastUpdated}</span>}
        </span>
        {/* سهم لأسفل (▼) وهو مطويّ - يشير لأعلى (▲) بعد الفتح، بدل سهم جانبي غير معبِّر
            عن اتجاه الطي/الفتح فعليًا. */}
        <Icon name={modalOpen ? 'expand_less' : 'expand_more'} size={18} />
      </button>

      {modalOpen && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div className="app-card" style={{ width: '100%', maxWidth: 440, borderRadius: '20px 20px 0 0', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 14 }}>بنود السلامة ({instructions.length})</strong>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'transparent', color: '#888', fontSize: 18, padding: 4, minHeight: 0 }}>×</button>
            </div>
            {lastUpdated && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>آخر مراجعة {lastUpdated}</div>}

            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, marginTop: 14, fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={ackChecked}
                onChange={(e) => setAckChecked(e.target.checked)}
                style={{ marginTop: 2, accentColor: 'var(--color-secondary)' }}
              />
              <span>أقر بأنني اطلعت على جميع تعليمات السلامة وألتزم بتطبيقها أثناء تنفيذ العمل.</span>
            </label>

            <button
              className="primary" disabled={!ackChecked}
              onClick={() => { setModalOpen(false); onAcknowledge(); }}
              style={{ marginTop: 10, width: '100%' }}
            >
              متابعة
            </button>

            <button
              type="button"
              onClick={() => openInstructionsWindow(instructions, permitType)}
              style={{ marginTop: 10, width: '100%', background: '#fff', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Icon name="menu_book" size={16} /> عرض تعليمات السلامة
            </button>
          </div>
        </div>
      )}
    </>
  );
}
