import React from 'react';
import { t } from '../../config/permitLabels.js';
import { normalizeMixedInput } from '../../hooks/useArabicIndicDigits.js';
import Icon from '../common/Icon.jsx';
import SignaturePad from '../common/SignaturePad.jsx';
import { remainingDaysTone, WORK_FIELD_LABEL_BG, WORK_FIELD_LABEL_TEXT, WORK_FIELD_VALUE_BG } from './permitTheme.js';
import { formatBilingualDateLines, formatDateTimeTwoLines } from '../../hooks/useHijriGregorianDate.js';

/**
 * حقل بيانات موظف - نفس مظهر WorkField تمامًا (تسمية صغيرة أعلى القيمة، كل حقل بمربعه
 * المستقل المستدير الزوايا) بدل الصف المتصل السابق - "توزيع متناسق" موحّد مع بطاقة
 * "بيانات العمل" حسب الملاحظة الصريحة، مع الحفاظ التام على البيانات نفسها المعروضة.
 */
function IdentityField({ icon, label, value, full, valueBg, valueText }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined, background: WORK_FIELD_LABEL_BG, borderRadius: 10, padding: 6 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 2, fontSize: 10, color: WORK_FIELD_LABEL_TEXT, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon}{label}
      </div>
      <div style={{ minHeight: 16, background: valueBg || WORK_FIELD_VALUE_BG, borderRadius: 6, padding: '6px 8px', fontWeight: 'bold', fontSize: full ? 15 : 13, color: valueText || 'var(--color-text)' }}>
        {value}
      </div>
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
export default function PartySection({ title, theme, checklist, employeeId, fullName, mobile, cardRemainingDays, cardExpiry, dateTime, gps, savedSignature, editable, signature, onSignatureChange, extraFields, children, lang = 'ar' }) {
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
    <section className="party-section" style={{ marginTop: 8, background: theme.bg, border: '2px solid ' + theme.border, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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

        {/* ① بيانات الموظف - شبكة حقول مستقلة (مثل بيانات العمل تمامًا): الاسم بمربعه الخاص
            بعرض كامل (أبرز وزنًا)، ثم الرقم الوظيفي والجوال جنبًا إلى جنب، ثم صلاحية البطاقة
            بعرض كامل مع تلوين حالتها (سارية/قاربت على الانتهاء/انتهت). */}
        <SubsectionLabel spaced={!!checklist}>{t('employeeData', lang)}</SubsectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <IdentityField full icon={<Icon name="person" size={14} />} label={t('fullName', lang)} value={fullName} />
          <IdentityField icon={<Icon name="badge" size={14} />} label={t('employeeId', lang)} value={employeeId} />
          {mobile && (
            <IdentityField
              icon={(
                <span style={{ display: 'flex', gap: 6 }}>
                  <a href={'tel:+' + String(mobile).replace(/[^0-9]/g, '')} title="اتصال مباشر" style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}><Icon name="call" size={14} /></a>
                  <a href={'https://wa.me/' + String(mobile).replace(/[^0-9]/g, '')} target="_blank" rel="noreferrer" title="واتساب" style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}><Icon name="chat" size={14} /></a>
                </span>
              )}
              label={t('mobile', lang)}
              value={mobile}
            />
          )}
          {(cardExpiryLines || remainingTone) && (
            <IdentityField
              full
              icon={<Icon name="event" size={14} />}
              label={t('cardValidity', lang)}
              value={(
                <>
                  {cardExpiryLines && cardExpiryLines.gregorian}
                  {remainingTone && <> - {remainingTone.label} - {cardRemainingDays} يوم</>}
                </>
              )}
              valueBg={remainingTone ? remainingTone.bg : undefined}
              valueText={remainingTone ? remainingTone.text : undefined}
            />
          )}
        </div>

        {/* ② بيانات الاعتماد - حقول إضافية مزدوجة، ثم تاريخ ووقت مدمجان بلا ثوانٍ، ثم الموقع
            الجغرافي مختصرًا مع زر فتح الخرائط، ثم التوقيع بخط متقطع بدل إطار كبير. */}
        {(extraFields && extraFields.length > 0) || dateTimeLines || gps || editable || savedSignature ? (
          <>
            <SubsectionLabel spaced>{t('approvalData', lang)}</SubsectionLabel>
            {((extraFields && extraFields.length > 0) || dateTimeLines) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8, fontSize: 12, marginBottom: gps ? 8 : 0 }}>
                {extraFields && extraFields.map((field) => (
                  <ExtraField key={field.label} editable={editable} {...field} />
                ))}
                {/* التاريخ والوقت ببطاقة صغيرة مطابقة لبقية حقول "بيانات الاعتماد" (وليس
                    شريطًا عريضًا منفردًا) - أقرب لبطاقات الحقول الصغيرة في كل مكان آخر. */}
                {dateTimeLines && (
                  <div className="wf-field" style={{
                    background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderRadius: 'var(--radius-md)',
                    padding: '8px 10px', height: 90, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4
                  }}>
                    <div style={{ fontWeight: 500, fontSize: 10, opacity: 0.65, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="schedule" size={12} />{t('dateTime', lang)}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: 13 }}>{dateTimeLines.date}</div>
                    <div style={{ fontWeight: 500, fontSize: 12, opacity: 0.75 }}>{dateTimeLines.time}</div>
                  </div>
                )}
              </div>
            )}

            {/* زر واحد نظيف بدل عرض الإحداثيات الخام بارزة - 95٪ من المستخدمين لن يقرؤوا
                رقمَي خط الطول/العرض، والزر نفسه يفتح Google Maps مباشرة بنفس الإحداثيات.
                خلفية زرقاء فاتحة (نفس نمط أزرار النظام الثانوية) بدل الأبيض المسطّح، حتى
                يشعر المستخدم فعليًا أنه زر قابل للضغط وليس مجرد تسمية نصية. */}
            {gps && (
              <a
                href={'https://www.google.com/maps?q=' + gps}
                target="_blank" rel="noreferrer"
                style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 13, fontWeight: 'bold', color: 'var(--color-primary)', textDecoration: 'none' }}
              >
                {t('openInMaps', lang)}
              </a>
            )}

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', opacity: 0.8, paddingBottom: 4, borderBottom: '1px solid #F2F2F2', marginBottom: 6 }}>{t('signature', lang)}</div>
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
