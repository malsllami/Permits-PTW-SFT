import React, { useState } from 'react';
import { rolesToList } from '../../utils/roles.js';
import { formatBilingualDateLines } from '../../hooks/useHijriGregorianDate.js';
import { updateMyMobile } from '../../services/employeesService.js';
import { convertArabicDigitsToEnglish } from '../../hooks/useArabicIndicDigits.js';
import Icon from './Icon.jsx';

// شريط علوي بلون/اسم كل صلاحية يحملها الموظف - قسم واحد إن كانت صلاحية واحدة (مصدر أو
// مستلم)، أو قسمان متجاوران بنسبة متساوية إن حمل الموظف الصلاحيتين معًا (قسم 4 بدليل
// التصميم: موظف واحد قد يكون مصدرًا ومستلمًا في آنٍ واحد).
const ROLE_META = {
  'مصدر': { color: 'var(--color-role-source-border)', text: '#fff' },
  'مستلم': { color: 'var(--color-role-receiver-border)', text: '#5C4400' }
};

function MiniField({ label, value, valueNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: '10px 12px', flex: '1 1 120px' }}>
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

/** حقل الجوال قابل للتعديل ذاتيًا (المدير فقط يملك تعديل بقية البيانات) - إدخال + زر حفظ. */
function MobileField({ mobile, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(mobile || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!editing) {
    return (
      <div style={{ background: 'var(--color-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: '10px 12px', flex: '1 1 120px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>الجوال</div>
          <button type="button" onClick={() => { setValue(mobile || ''); setEditing(true); }} style={{ background: 'none', padding: 0, minHeight: 0, display: 'flex', alignItems: 'center' }}>
            <Icon name="edit" size={14} />
          </button>
        </div>
        <div style={{ fontSize: 'var(--fs-field-value)', fontWeight: 'bold', marginTop: 2 }}>{mobile || '—'}</div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateMyMobile(convertArabicDigitsToEnglish(value));
      onSaved(updated.mobile);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'var(--color-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: '10px 12px', flex: '1 1 200px' }}>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>تعديل الجوال</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={value}
          onChange={(e) => setValue(convertArabicDigitsToEnglish(e.target.value))}
          style={{ flex: 1, minHeight: 36, fontSize: 13, padding: '4px 8px' }}
        />
        <button type="button" disabled={saving} onClick={handleSave} style={{ background: 'var(--color-primary)', color: '#fff', minHeight: 36, fontSize: 12, padding: '0 12px' }}>
          {saving ? '...' : 'حفظ'}
        </button>
        <button type="button" onClick={() => setEditing(false)} style={{ background: 'var(--color-secondary)', color: '#fff', minHeight: 36, fontSize: 12, padding: '0 10px' }}>
          إلغاء
        </button>
      </div>
      {error && <div style={{ color: 'var(--color-error)', fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

/**
 * بطاقة بيانات الموظف بالشاشة الرئيسية (قسم 4 بدليل التصميم) - قابلة للطي: مطويّة افتراضيًا
 * (سطر واحد فقط: 👤 الاسم / الرقم الوظيفي) لأن الموظف لا يحتاج رؤية هذه التفاصيل في كل مرة
 * يفتح فيها الصفحة الرئيسية؛ تُفتح فقط بضغطة لعرض الجوال (قابل للتعديل ذاتيًا) وبطاقة
 * الصلاحية الأكثر إلحاحًا. تواريخ انتهاء البطاقات تبقى للاطلاع فقط (تعديلها بيد المدير حصرًا).
 */
export default function EmployeeInfoCard({ profile }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(null);
  if (!profile) return null;
  const currentMobile = mobile !== null ? mobile : profile.mobile;

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', background: 'none', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 0 }}
      >
        <span style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          👤 {profile.fullName}
          <span style={{ opacity: 0.6, fontWeight: 500 }}>{profile.employeeId}</span>
        </span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={18} />
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexWrap: 'wrap', columnGap: 8, rowGap: 6 }}>
          <MobileField mobile={currentMobile} onSaved={setMobile} />
          <MiniField label="تاريخ انتهاء بطاقة السلامة" valueNode={<ExpiryDateValue value={mostUrgentCard.expiry} />} />
          <MiniField label="سارية لمدة" value={mostUrgentCard.remaining !== '' && mostUrgentCard.remaining !== undefined && mostUrgentCard.remaining !== null ? mostUrgentCard.remaining + ' يوم' : '—'} />
        </div>
      )}
    </div>
  );
}
