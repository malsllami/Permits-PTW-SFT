import React, { useState } from 'react';
import { rolesToList } from '../../utils/roles.js';
import { formatBilingualDateLines } from '../../hooks/useHijriGregorianDate.js';
import { updateMyMobile } from '../../services/employeesService.js';
import { convertArabicDigitsToEnglish } from '../../hooks/useArabicIndicDigits.js';
import Icon from './Icon.jsx';

// هيدر البطاقة تدرّج لوني واحد متصل (وليس قسمين صلبين متجاورين بخط فاصل حاد) بين ألوان
// الصلاحيات التي يحملها الموظف فعليًا - أحمر=مصدر دائمًا/أصفر=مستلم دائمًا، يمتزجان تدريجيًا
// في المنتصف عند ازدواج الصلاحية بدل حد فاصل واضح بينهما.
const ROLE_META = {
  'مصدر': { color: '#D9534F', text: '#fff' },
  'مستلم': { color: '#F0B429', text: '#5C4400' }
};

/**
 * تلوين "المدة المتبقية" الخاص ببطاقة بيانات الموظف تحديدًا (مختلف عن remainingDaysTone
 * المستخدَم في بطاقات الأطراف أثناء التصريح نفسه - لكل سياق حدوده الخاصة المعتمَدة): 120
 * يومًا فأكثر أخضر، 119-60 برتقالي، 59-1 أصفر، صفر فأقل أحمر.
 */
function employeeCardTone(days) {
  const n = Number(days);
  if (isNaN(n)) return null;
  if (n >= 120) return { bg: '#DFF5E1', text: '#1B5E20' };
  if (n >= 60) return { bg: '#FFE8CC', text: '#8A4B00' };
  if (n >= 1) return { bg: '#FFF3CD', text: '#8D6E00' };
  return { bg: '#F8D7D7', text: '#B71C1C' };
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

/**
 * بطاقة صلاحية واحدة (عمل/مصدر/مستلم) - لا تظهر إطلاقًا إن لم يُدخَل تاريخ انتهاء لها فعليًا
 * في جدول الموظفين (قد يحمل الموظف بطاقة مصدر فقط، أو الاثنتين معًا، أو لا شيء). حدّ جانبي
 * بلون الصلاحية نفسها (عمل=أزرق النظام/مصدر=أحمر/مستلم=أصفر) للتمييز بين البطاقات عند تعدّدها،
 * وشارة "المدة المتبقية" بلون منفصل حسب حدّة القرب من الانتهاء (employeeCardTone).
 */
function CardValidityField({ label, color, expiry, remaining }) {
  if (!expiry) return null;
  const tone = employeeCardTone(remaining);
  return (
    <div style={{ background: 'var(--color-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', borderInlineStart: '4px solid ' + color, padding: '10px 12px', flex: '1 1 150px' }}>
      <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 'bold' }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-field-value)', fontWeight: 'bold', marginTop: 2 }}>
        <ExpiryDateValue value={expiry} />
      </div>
      {tone && (remaining !== '' && remaining !== undefined && remaining !== null) && (
        <div style={{ display: 'inline-block', marginTop: 6, background: tone.bg, color: tone.text, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 'bold' }}>
          {remaining > 0 ? 'سارية لمدة ' + remaining + ' يوم' : 'منتهية'}
        </div>
      )}
    </div>
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
 * بطاقة بيانات الموظف بالشاشة الرئيسية - قابلة للطي (مطويّة افتراضيًا: سطر واحد فقط
 * 👤 الاسم / الرقم الوظيفي - ثابتان لا يتغيّران أبدًا). عند التوسيع: الجوال (قابل للتعديل
 * الذاتي)، ثم بطاقة صلاحية مستقلة لكل نوع بطاقة أُدخل له تاريخ انتهاء فعليًا في جدول
 * الموظفين (عمل/مصدر/مستلم) - قد تظهر واحدة أو أكثر حسب البيانات الفعلية فقط، لا افتراضات.
 */
export default function EmployeeInfoCard({ profile }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(null);
  if (!profile) return null;
  const currentMobile = mobile !== null ? mobile : profile.mobile;

  const activeRoles = rolesToList(profile.role).filter((r) => ROLE_META[r]);
  const displayRoles = activeRoles.length ? activeRoles : ['مصدر'];
  // تدرّج لوني واحد متصل بين ألوان الصلاحيات المزدوجة (بدل قسمين صلبين بخط فاصل) - بلون
  // واحد صرف إن كانت صلاحية واحدة فقط.
  const headerBackground = displayRoles.length > 1
    ? 'linear-gradient(90deg, ' + displayRoles.map((r) => ROLE_META[r].color).join(', ') + ')'
    : ROLE_META[displayRoles[0]].color;

  // كل بطاقات الصلاحية الممكنة - كل واحدة تُصفَّى ذاتيًا (CardValidityField تُعيد null) إن
  // لم يُدخَل لها تاريخ انتهاء فعليًا، فتظهر فقط البطاقات ذات البيانات الحقيقية المدخلة.
  const cardFields = [
    { key: 'work', label: 'تاريخ انتهاء بطاقة العمل', color: 'var(--color-primary)', expiry: profile.workCardExpiry, remaining: profile.workCardRemainingDays },
    { key: 'مصدر', label: 'تاريخ انتهاء بطاقة المصدر', color: ROLE_META['مصدر'].color, expiry: profile.issuerCardExpiry, remaining: profile.issuerCardRemainingDays },
    { key: 'مستلم', label: 'تاريخ انتهاء بطاقة المستلم', color: ROLE_META['مستلم'].color, expiry: profile.receiverCardExpiry, remaining: profile.receiverCardRemainingDays }
  ];

  return (
    <div className="app-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #D9DEE6', marginBottom: 16 }}>
      <div style={{ display: 'flex', background: headerBackground }}>
        {displayRoles.map((r) => (
          <div key={r} style={{ flex: 1, color: ROLE_META[r].text, textAlign: 'center', fontSize: 12, fontWeight: 'bold', padding: '6px 0' }}>
            {r}
          </div>
        ))}
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
          {cardFields.map((c) => (
            <CardValidityField key={c.key} label={c.label} color={c.color} expiry={c.expiry} remaining={c.remaining} />
          ))}
        </div>
      )}
    </div>
  );
}
