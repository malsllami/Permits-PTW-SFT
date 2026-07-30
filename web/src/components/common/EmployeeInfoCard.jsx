import React, { useState } from 'react';
import { formatBilingualDateLines } from '../../hooks/useHijriGregorianDate.js';
import { updateMyMobile, updateMyCardExpiry } from '../../services/employeesService.js';
import { convertArabicDigitsToEnglish } from '../../hooks/useArabicIndicDigits.js';
import Icon from './Icon.jsx';

// هيدر البطاقة تدرّج لوني واحد متصل (وليس قسمين صلبين متجاورين بخط فاصل حاد) بين ألوان
// أنواع البطاقات التي يحملها الموظف فعليًا (له تاريخ انتهاء مُدخَل) - أحمر=مصدر دائمًا/
// أصفر=مستلم دائمًا، يمتزجان تدريجيًا في المنتصف عند حمل البطاقتين معًا، بلون واحد صريح
// فقط إن كان يحمل واحدة منهما. يعتمد على وجود تاريخ الانتهاء نفسه (لا على حقل "الدور" -
// موظف قد يحمل دور "مصدر" فقط بينما لديه فعليًا بطاقتا مصدر ومستلم مُدخلتان معًا).
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

/** يحوّل أي قيمة تاريخ مخزَّنة (نص/ISO) إلى صيغة YYYY-MM-DD المطلوبة لـ input[type=date]. */
function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/**
 * بطاقة صلاحية واحدة (عمل/مصدر/مستلم) - لا تظهر إطلاقًا إن لم يُدخَل تاريخ انتهاء لها فعليًا
 * في جدول الموظفين. حدّ جانبي بلون الصلاحية نفسها (عمل=أزرق النظام/مصدر=أحمر/مستلم=أصفر)
 * للتمييز بين البطاقات عند تعدّدها، وشارة "المدة المتبقية" بلون منفصل حسب حدّة القرب من
 * الانتهاء (employeeCardTone). قابلة للتعديل الذاتي أيضًا (تاريخ الانتهاء نفسه) - المدة
 * المتبقية تُعاد حسابها تلقائيًا في الخادم فور الحفظ.
 */
function CardValidityField({ label, field, color, expiry, remaining, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!expiry) return null;
  const tone = employeeCardTone(remaining);

  const startEditing = () => { setValue(toDateInputValue(expiry)); setError(''); setEditing(true); };

  const handleSave = async () => {
    if (!value) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateMyCardExpiry(field, value);
      onSaved(updated);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'var(--color-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', borderInlineStart: '4px solid ' + color, padding: '10px 12px', flex: '0 1 calc(50% - 4px)', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 'bold' }}>{label}</div>
        {!editing && (
          <button type="button" onClick={startEditing} style={{ background: 'none', padding: 0, minHeight: 0, display: 'flex', alignItems: 'center' }}>
            <Icon name="edit" size={14} />
          </button>
        )}
      </div>
      {!editing ? (
        <>
          <div style={{ fontSize: 'var(--fs-field-value)', fontWeight: 'bold', marginTop: 2 }}>
            <ExpiryDateValue value={expiry} />
          </div>
          {tone && (remaining !== '' && remaining !== undefined && remaining !== null) && (
            <div style={{ display: 'inline-block', marginTop: 6, background: tone.bg, color: tone.text, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 'bold' }}>
              {remaining > 0 ? 'سارية لمدة ' + remaining + ' يوم' : 'منتهية'}
            </div>
          )}
        </>
      ) : (
        <div style={{ marginTop: 4 }}>
          <input type="date" value={value} onChange={(e) => setValue(e.target.value)} style={{ width: '100%', minHeight: 34, fontSize: 12, padding: '4px 6px' }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button type="button" disabled={saving || !value} onClick={handleSave} style={{ background: 'var(--color-primary)', color: '#fff', minHeight: 32, fontSize: 11, padding: '0 10px', flex: 1 }}>
              {saving ? '...' : 'حفظ'}
            </button>
            <button type="button" onClick={() => setEditing(false)} style={{ background: 'var(--color-secondary)', color: '#fff', minHeight: 32, fontSize: 11, padding: '0 10px' }}>
              إلغاء
            </button>
          </div>
          {error && <div style={{ color: 'var(--color-error)', fontSize: 11, marginTop: 4 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

/** حقل الجوال قابل للتعديل ذاتيًا - إدخال + زر حفظ. */
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
      onSaved(updated);
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
 * 👤 الاسم / الرقم الوظيفي - ثابتان لا يتغيّران أبدًا). عند التوسيع: الجوال + تاريخ انتهاء
 * كل بطاقة (عمل/مصدر/مستلم) قابلان للتعديل الذاتي، وتظهر بطاقة الصلاحية فقط لما أُدخل له
 * تاريخ انتهاء فعليًا في جدول الموظفين - لا افتراضات.
 */
export default function EmployeeInfoCard({ profile }) {
  const [open, setOpen] = useState(false);
  // لقطة محلية تُستبدَل بالكامل بأحدث profile عائد من الخادم فور أي حفظ ناجح (جوال أو تاريخ
  // بطاقة) - أبسط من تتبّع كل حقل بحالة مستقلة، ويضمن اتساق "المدة المتبقية" المُعاد حسابها.
  const [override, setOverride] = useState(null);
  if (!profile) return null;
  const current = override || profile;

  // أنواع البطاقات الفعلية التي يحملها الموظف - حسب وجود تاريخ انتهاء مُدخَل لها بالفعل
  // (وليس حسب حقل "الدور" النصي، الذي قد لا يطابق ما أُدخل فعليًا من بطاقات).
  const presentRoles = ['مصدر', 'مستلم'].filter((r) =>
    r === 'مصدر' ? !!current.issuerCardExpiry : !!current.receiverCardExpiry
  );
  const displayRoles = presentRoles.length ? presentRoles : ['مصدر'];
  // "to left" (وليس درجة زاوية ثابتة مثل 90deg) لأن تدرّجات CSS لا تنعكس تلقائيًا مع
  // dir:rtl - "90deg" يرسم اللون الأول دومًا عند الحافة اليسرى فعليًا بصرف النظر عن اتجاه
  // الصفحة، بينما تسميات الأدوار (flex) تنعكس فعليًا مع RTL فيصبح "مصدر" على اليمين دائمًا
  // (أول عنصر في displayRoles) - "to left" يضمن رسم لون "مصدر" (أول لون بالمصفوفة) فعليًا
  // عند الحافة اليمنى نفسها التي تُعرَض فيها تسميته، بدل تعارضهما.
  const headerBackground = displayRoles.length > 1
    ? 'linear-gradient(to left, ' + displayRoles.map((r) => ROLE_META[r].color).join(', ') + ')'
    : ROLE_META[displayRoles[0]].color;

  // كل بطاقات الصلاحية الممكنة - كل واحدة تُصفَّى ذاتيًا (CardValidityField تُعيد null) إن
  // لم يُدخَل لها تاريخ انتهاء فعليًا، فتظهر فقط البطاقات ذات البيانات الحقيقية المدخلة.
  const cardFields = [
    { key: 'work', field: 'workCardExpiry', label: 'تاريخ انتهاء بطاقة العمل', color: 'var(--color-primary)', expiry: current.workCardExpiry, remaining: current.workCardRemainingDays },
    { key: 'مصدر', field: 'issuerCardExpiry', label: 'تاريخ انتهاء بطاقة المصدر', color: ROLE_META['مصدر'].color, expiry: current.issuerCardExpiry, remaining: current.issuerCardRemainingDays },
    { key: 'مستلم', field: 'receiverCardExpiry', label: 'تاريخ انتهاء بطاقة المستلم', color: ROLE_META['مستلم'].color, expiry: current.receiverCardExpiry, remaining: current.receiverCardRemainingDays }
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
          👤 {current.fullName}
          <span style={{ color: 'var(--color-text)', opacity: 0.85, fontWeight: 700 }}>{current.employeeId}</span>
        </span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={18} />
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexWrap: 'wrap', columnGap: 8, rowGap: 6 }}>
          <MobileField mobile={current.mobile} onSaved={setOverride} />
          {cardFields.map((c) => (
            <CardValidityField key={c.key} label={c.label} field={c.field} color={c.color} expiry={c.expiry} remaining={c.remaining} onSaved={setOverride} />
          ))}
        </div>
      )}
    </div>
  );
}
