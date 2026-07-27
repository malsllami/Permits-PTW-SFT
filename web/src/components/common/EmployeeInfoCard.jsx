import React from 'react';
import { rolesToList } from '../../utils/roles.js';
import { formatBilingualDateLines } from '../../hooks/useHijriGregorianDate.js';

// شريط علوي بلون/اسم كل صلاحية يحملها الموظف - قسم واحد إن كانت صلاحية واحدة (مصدر أو
// مستلم)، أو قسمان متجاوران بنسبة متساوية إن حمل الموظف الصلاحيتين معًا (قسم 4 بدليل
// التصميم: موظف واحد قد يكون مصدرًا ومستلمًا في آنٍ واحد).
const ROLE_META = {
  'مصدر': { color: 'var(--color-role-source-border)', text: '#fff' },
  'مستلم': { color: 'var(--color-role-receiver-border)', text: '#5C4400' }
};

function MiniField({ label, value, valueNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: '8px 12px', flex: '1 1 120px' }}>
      <div style={{ fontSize: 11, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-field-value)', fontWeight: 'bold', marginTop: 2 }}>
        {valueNode || (value || value === 0 ? value : '—')}
      </div>
    </div>
  );
}

/** تاريخ الانتهاء ميلادي وهجري معًا (سطران) - وليس نص ISO خام كما يُخزَّن بالشيت. */
function ExpiryDateValue({ value }) {
  const dateLines = formatBilingualDateLines(value);
  if (!dateLines) return '—';
  return (
    <>
      <div>{dateLines.gregorian}</div>
      {dateLines.hijri && <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 500 }}>{dateLines.hijri}</div>}
    </>
  );
}

/** بطاقة بيانات الموظف بالشاشة الرئيسية (قسم 4 بدليل التصميم). */
export default function EmployeeInfoCard({ profile }) {
  if (!profile) return null;

  const activeRoles = rolesToList(profile.role).filter((r) => ROLE_META[r]);
  const displayRoles = activeRoles.length ? activeRoles : ['مصدر'];

  // بطاقة الصلاحية المعروضة (تاريخ الانتهاء/الأيام المتبقية): عند ازدواج الصلاحية تُعرض
  // الأكثر إلحاحًا (الأقل أيامًا متبقية) كي لا تختفي تحذيرات قرب الانتهاء خلف بطاقة أخرى.
  const cardsByRole = {
    'مصدر': { expiry: profile.issuerCardExpiry, remaining: profile.issuerCardRemainingDays },
    'مستلم': { expiry: profile.receiverCardExpiry, remaining: profile.receiverCardRemainingDays }
  };
  const relevantCards = displayRoles.map((r) => cardsByRole[r]).filter((c) => c && c.expiry);
  const mostUrgentCard = relevantCards.reduce((best, c) => {
    if (!best) return c;
    const a = Number(best.remaining);
    const b = Number(c.remaining);
    if (isNaN(b)) return best;
    if (isNaN(a)) return c;
    return b < a ? c : best;
  }, null) || { expiry: profile.workCardExpiry, remaining: profile.workCardRemainingDays };

  return (
    <div className="app-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #D9DEE6', marginBottom: 16 }}>
      <div style={{ display: 'flex' }}>
        {displayRoles.map((r) => {
          const meta = ROLE_META[r];
          return (
            <div key={r} style={{ flex: 1, background: meta.color, color: meta.text, textAlign: 'center', fontSize: 12, fontWeight: 'bold', padding: '6px 0' }}>
              {r}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <MiniField label="الاسم" value={profile.fullName} />
        <MiniField label="الرقم الوظيفي" value={profile.employeeId} />
        <MiniField label="الجوال" value={profile.mobile} />
        <MiniField label="تاريخ انتهاء بطاقة السلامة" valueNode={<ExpiryDateValue value={mostUrgentCard.expiry} />} />
        <MiniField label="سارية لمدة" value={mostUrgentCard.remaining !== '' && mostUrgentCard.remaining !== undefined && mostUrgentCard.remaining !== null ? mostUrgentCard.remaining + ' يوم' : '—'} />
      </div>
    </div>
  );
}
