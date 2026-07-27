import React from 'react';
import { t } from '../../config/permitLabels.js';
import { normalizeMixedInput } from '../../hooks/useArabicIndicDigits.js';
import Icon from '../common/Icon.jsx';
import SignaturePad from '../common/SignaturePad.jsx';
import { remainingDaysTone } from './permitTheme.js';
import { formatBilingualDateLines, formatDateTimeTwoLines } from '../../hooks/useHijriGregorianDate.js';

/**
 * خلية مضغوطة (أيقونة + قيمة فقط، بلا تسمية منفصلة فوقها) - تُستخدم في "بيانات الموظف"
 * تحديدًا حيث تسمية القسم نفسه تكفي للسياق (اسم/رقم وظيفي/جوال/بطاقة معروفة الترتيب دائمًا)،
 * فتكرار اسم كل حقل فوق قيمته كان يهدر مساحة دون فائدة حسب الملاحظة الصريحة.
 */
export function CompactCell({ icon, value, full, valueBg, valueText, twoLines }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div style={{
      gridColumn: full ? '1 / -1' : undefined, display: 'flex', alignItems: 'center', gap: 8,
      background: valueBg || '#fff', boxShadow: valueBg ? undefined : '0 1px 3px rgba(0,0,0,0.06)',
      borderRadius: 'var(--radius-md)', padding: '0 12px', minHeight: 40, boxSizing: 'border-box'
    }}>
      {icon && <span style={{ flexShrink: 0, opacity: 0.75 }}>{icon}</span>}
      {twoLines ? (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 'bold', fontSize: 13, color: valueText || 'var(--color-text)' }}>{value.date}</div>
          <div style={{ fontWeight: 500, fontSize: 12, opacity: 0.75, color: valueText || 'var(--color-text)' }}>{value.time}</div>
        </div>
      ) : (
        <div style={{ fontWeight: 'bold', fontSize: 13, color: valueText || 'var(--color-text)', minWidth: 0 }}>{value}</div>
      )}
    </div>
  );
}

/**
 * صف بيانات موظف بعرض كامل ضمن بطاقة موحّدة واحدة - Padding داخلي لكل صف (6px أعلى/أسفل)
 * بدل مسافة/فراغ بين الصفوف، وخط فاصل رفيع جدًا (1px #F2F2F2) بدل الالتصاق التام - ارتفاع
 * كل صف يقع طبيعيًا بين 52-56px حسب حجم خطه (56 للاسم الأبرز، ~52 للبقية).
 */
function IdentityRow({ icon, value, big, last, valueBg, valueText }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px',
      minHeight: big ? 56 : 52, boxSizing: 'border-box',
      borderBottom: last ? 'none' : '1px solid #F2F2F2', background: valueBg || 'transparent'
    }}>
      {icon && <span style={{ flexShrink: 0, opacity: 0.75 }}>{icon}</span>}
      <div style={{ fontWeight: big ? 700 : 'bold', fontSize: big ? 17 : 13, color: valueText || 'var(--color-text)', minWidth: 0 }}>{value}</div>
    </div>
  );
}

/** حقل مُدخل يدويًا/من الجداول ("بيانات الاعتماد") - يبقى بتسمية فوق القيمة لأن الحقول هنا
    متغيّرة (رقم قفل/جهة معنية...) ولا يمكن التعرّف عليها من مكانها فقط كبيانات الموظف الثابتة. */
export function ExtraField({ label, value, editable, onChange, type, options, icon }) {
  if (!editable && !value) return null;
  return (
    <div className="wf-field" style={{
      background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderRadius: 'var(--radius-md)',
      padding: '8px 10px', height: 90, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4
    }}>
      <div className="wf-field-label" style={{ fontWeight: 500, fontSize: 10, opacity: 0.65, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon}{label}
      </div>
      {editable ? (
        type === 'select' ? (
          <select style={{ width: '100%', fontWeight: 'bold' }} defaultValue={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {(options || []).map((opt) => (
              <option key={opt.key} value={opt.valueAr}>{opt.valueAr}</option>
            ))}
          </select>
        ) : (
          <input
            type="text" style={{ width: '100%', fontWeight: 'bold' }}
            defaultValue={value || ''}
            onChange={(e) => { const v = normalizeMixedInput(e.target.value); e.target.value = v; onChange(v); }}
          />
        )
      ) : (
        <div style={{ fontWeight: 'bold', fontSize: 13 }}>{value}</div>
      )}
    </div>
  );
}

/** تسمية قسم فرعي (بيانات الموظف/بيانات الاعتماد) - نص عادي بلا خلفية ولا خطوط فاصلة
    (لا تضيف شيئًا فعليًا حسب الملاحظة الصريحة) - الفصل بين الأقسام بمسافة بيضاء كافية فقط. */
function SubsectionLabel({ children, spaced }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 'bold', color: 'var(--color-text)', opacity: 0.8,
      marginTop: spaced ? 18 : 0, marginBottom: 8
    }}>
      {children}
    </div>
  );
}

/**
 * قسم موحّد لكل طرف (مصدر/مستلم/إغلاق): ثلاث مناطق واضحة - بنود السلامة، بيانات الموظف
 * المضغوطة، ثم بيانات الاعتماد (حقول إضافية + تاريخ/وقت + موقع + توقيع) - مفصولة بخطوط
 * متقطعة خفيفة بدل عناصر متناثرة بمسافات غير موحّدة.
 */
export default function PartySection({ title, theme, checklist, employeeId, fullName, mobile, cardRemainingDays, cardExpiry, dateTime, gps, savedSignature, editable, signature, onSignatureChange, extraFields, children }) {
  // العربي عنوان رئيسي، والإنجليزي أسفله بخط أصغر (بدل "عربي / إنجليزي" بسطر واحد) - أقرب
  // للنماذج الصناعية الاحترافية وأقل تشتيتًا بصريًا، حسب توصية دليل التصميم.
  const [titleAr, titleEn] = String(title).split(' / ');
  const cardExpiryLines = cardExpiry ? formatBilingualDateLines(cardExpiry) : null;
  const remainingTone = cardRemainingDays !== undefined && cardRemainingDays !== '' ? remainingDaysTone(cardRemainingDays) : null;
  const dateTimeLines = formatDateTimeTwoLines(dateTime);

  return (
    // بطاقة بلونين: هيدر مصمت بلون الدور (Issuer/Receiver/Closing) بارتفاع ثابت، وجسم
    // بخلفية فاتحة جدًا من نفس اللون (theme.bg) - وليس أبيض بالكامل ولا لونًا صلبًا بالكامل،
    // حسب مواصفة التصميم المعتمدة (Header/Background/Border/Radius/Shadow لكل بطاقة طرف).
    <section className="party-section" style={{ marginTop: 12, background: theme.bg, border: '2px solid ' + theme.border, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
      <div className="party-section-title" style={{
        background: theme.border, color: theme.badgeText, minHeight: 'var(--size-card-header-height)',
        padding: '0 20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 10, boxSizing: 'border-box'
      }}>
        <Icon name="person" size={22} />
        <div>
          <div style={{ fontSize: 'var(--fs-card-title)' }}>{titleAr}</div>
          {titleEn && <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.85 }}>{titleEn}</div>}
        </div>
      </div>
      <div className="party-section-body" style={{ padding: 20 }}>
        {checklist}

        {/* ① بيانات الموظف - بطاقة موحّدة واحدة (وليست شبكة عمودين): الاسم بسطره الخاص
            (أبرز وزنًا)، ثم الرقم الوظيفي بسطره، ثم الجوال بسطره، ثم تاريخ انتهاء البطاقة
            مع حالتها (سارية/قاربت على الانتهاء/انتهت) مدمجَين في سطر واحد أخير. */}
        <SubsectionLabel spaced={!!checklist}>بيانات الموظف</SubsectionLabel>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {(() => {
            const rows = [
              { icon: <Icon name="person" size={18} />, value: fullName, big: true },
              { icon: <Icon name="badge" size={16} />, value: employeeId },
              mobile ? {
                icon: (
                  <span style={{ display: 'flex', gap: 8 }}>
                    <a href={'tel:+' + String(mobile).replace(/[^0-9]/g, '')} title="اتصال مباشر" style={{ textDecoration: 'none', color: 'inherit' }}><Icon name="call" size={16} /></a>
                    <a href={'https://wa.me/' + String(mobile).replace(/[^0-9]/g, '')} target="_blank" rel="noreferrer" title="واتساب" style={{ textDecoration: 'none', color: 'inherit' }}><Icon name="chat" size={16} /></a>
                  </span>
                ),
                value: mobile
              } : null,
              (cardExpiryLines || remainingTone) ? {
                icon: <Icon name="event" size={16} />,
                value: (
                  <>
                    {cardExpiryLines && cardExpiryLines.gregorian}
                    {remainingTone && <> - {remainingTone.label} - {cardRemainingDays} يوم</>}
                  </>
                ),
                valueBg: remainingTone ? remainingTone.bg : undefined,
                valueText: remainingTone ? remainingTone.text : undefined
              } : null
            ].filter((r) => r && r.value !== undefined && r.value !== null && r.value !== '');
            return rows.map((row, idx) => (
              <IdentityRow key={idx} {...row} last={idx === rows.length - 1} />
            ));
          })()}
        </div>

        {/* ② بيانات الاعتماد - حقول إضافية مزدوجة، ثم تاريخ ووقت مدمجان بلا ثوانٍ، ثم الموقع
            الجغرافي مختصرًا مع زر فتح الخرائط، ثم التوقيع بخط متقطع بدل إطار كبير. */}
        {(extraFields && extraFields.length > 0) || dateTimeLines || gps || editable || savedSignature ? (
          <>
            <SubsectionLabel spaced>بيانات الاعتماد</SubsectionLabel>
            {extraFields && extraFields.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8, fontSize: 12, marginBottom: dateTimeLines || gps ? 8 : 0 }}>
                {extraFields.map((field) => (
                  <ExtraField key={field.label} editable={editable} {...field} />
                ))}
              </div>
            )}

            {dateTimeLines && (
              <CompactCell full twoLines icon={<Icon name="schedule" size={16} />} value={dateTimeLines} />
            )}

            {gps && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderRadius: 'var(--radius-md)', padding: '9px 12px', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <Icon name="location_on" size={16} />
                  <strong style={{ fontWeight: 'bold' }}>{gps}</strong>
                </span>
                <a
                  href={'https://www.google.com/maps?q=' + gps}
                  target="_blank" rel="noreferrer"
                  style={{ flexShrink: 0, fontSize: 11, fontWeight: 'bold', color: 'var(--color-primary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  فتح في الخرائط
                </a>
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', opacity: 0.8, paddingBottom: 4, borderBottom: '1px solid #F2F2F2', marginBottom: 6 }}>{t('signature', 'ar')}</div>
              {editable ? (
                <SignaturePad onChange={onSignatureChange} />
              ) : (
                savedSignature ? (
                  <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <img src={savedSignature} alt="التوقيع" style={{ height: 100, maxWidth: '100%' }} />
                  </div>
                ) : (
                  <div style={{ borderBottom: '1.5px dashed #b7bfca', minHeight: 20 }} />
                )
              )}
            </div>
          </>
        ) : null}

        {children}
      </div>
    </section>
  );
}
