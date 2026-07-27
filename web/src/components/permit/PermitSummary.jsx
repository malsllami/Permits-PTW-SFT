import React from 'react';
import QRCodeView from '../common/QRCodeView.jsx';
import { t } from '../../config/permitLabels.js';
import { computeWorkDurationLabel } from '../../utils/permitFormatting.js';
import { formatDateTimeShort, combineDateAndTime } from '../../hooks/useHijriGregorianDate.js';
import { THEMES } from './permitTheme.js';

/**
 * لوحة مشاركة موحّدة: رابط التصريح + باركود قابلان للنسخ/المسح فقط - لا رقم برنامج
 * تشغيلي ولا رمز سري ضمنها؛ الرمز السري (إن وُجد) يُعرض منفصلًا بوضوح مع تنويه صريح
 * بعدم تضمينه أو رقم البرنامج التشغيلي ضمن أي رسالة مشاركة، بل إبلاغهما شفهيًا فقط.
 */
export function SharePanel({ permitLink, secretCode, secretNote, onCopy, copied }) {
  return (
    <div className="no-print" style={{ marginTop: 10, border: '1px solid #d5d9e0', borderRadius: 10, padding: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <QRCodeView link={permitLink} size={84} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>{t('permitLink', 'ar')}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input readOnly value={permitLink} style={{ flex: 1, fontSize: 11 }} onFocus={(e) => e.target.select()} />
            <button type="button" className="secondary" onClick={onCopy} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
              {copied ? t('linkCopied', 'ar') : t('copyLink', 'ar')}
            </button>
          </div>
        </div>
      </div>
      {secretCode && (
        <div style={{ marginTop: 10, background: '#FFF3CD', border: '1px solid #E8A93B', borderRadius: 10, padding: 10, fontSize: 12 }}>
          <strong>مهم:</strong> الرمز السري: <strong style={{ fontSize: 16 }}>{secretCode}</strong>
          <br />{secretNote}
        </div>
      )}
    </div>
  );
}

/** بطاقة حدث واحد ضمن خط زمني رأسي (للشاشة فقط) - نقطة ملوّنة + اسم الحدث + الشخص
    المسؤول + التاريخ/الوقت + التوقيع (إن وُجد) - بدل صف جدول ضيّق يُقصّ على الجوال. */
function TimelineEventCard({ color, label, name, dateTime, signature }) {
  if (!dateTime && !name && !signature) return null;
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff', borderRadius: 'var(--radius-md)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 14, marginBottom: 10 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 'bold', fontSize: 13 }}>{label}</div>
        {name && <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{name}</div>}
        {dateTime && <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>{dateTime}</div>}
      </div>
      {signature && <img src={signature} alt="توقيع" style={{ height: 32, flexShrink: 0 }} />}
    </div>
  );
}

/**
 * الخط الزمني النهائي (الصفحة 3 على الشاشة) - بطاقات رأسية واحدة تلو الأخرى (وليست جدولين
 * جنبًا إلى جنب، كانا يضيقان جدًا على الجوال ويقصّان الأسماء/القيم) تجمع كل حدث ومن نفّذه
 * وتوقيعه في بطاقة واحدة مفهومة دفعة واحدة. نسخة الطباعة/PDF تبقى جدولًا منفصلًا تمامًا
 * (PermitPrint لا يستخدم هذا المكوّن إطلاقًا) فلا تأثير لهذا التغيير عليها.
 */
export function SummaryTables({ permit }) {
  const hadHandover = permit.receiverHandovers && permit.receiverHandovers.length > 0;
  const firstHandover = hadHandover ? permit.receiverHandovers[0] : null;
  const originalReceiverName = firstHandover
    ? firstHandover.outgoingName + ' (' + firstHandover.outgoingEmployeeId + ')'
    : permit.receiver.fullName + ' (' + permit.receiver.employeeId + ')';
  const closingReceiverName = permit.receiver.fullName + ' (' + permit.receiver.employeeId + ')';

  const workDuration = computeWorkDurationLabel(permit.source.approvalDateTime, permit.closingSource.closeDateTime);

  return (
    <section style={{ marginTop: 16, breakInside: 'avoid' }}>
      <div>
        <strong style={{ fontSize: 13, color: 'var(--color-primary)' }}>ملخص التصريح النهائي</strong>
        <div style={{ fontSize: 11, opacity: 0.75 }}>Final Permit Summary</div>
      </div>
      <div style={{ marginTop: 10 }}>
        <TimelineEventCard
          color="var(--color-primary)" label="إنشاء التصريح"
          name={permit.source.fullName + ' (' + permit.source.employeeId + ')'}
          dateTime={formatDateTimeShort(combineDateAndTime(permit.createdDate, permit.createdTime))}
        />
        <TimelineEventCard
          color={THEMES.red.border} label="اعتماد المصدر (تحويل للمستلم)"
          name={permit.source.fullName + ' (' + permit.source.employeeId + ')'}
          dateTime={formatDateTimeShort(permit.source.transferDateTime)}
          signature={permit.source.transferSignature}
        />
        <TimelineEventCard
          color={THEMES.yellow.border} label="اعتماد المستلم (الاستلام)"
          name={originalReceiverName}
          dateTime={formatDateTimeShort(permit.receiver.receiveDateTime)}
          signature={permit.receiver.receiveSignature}
        />
        <TimelineEventCard
          color="var(--color-success)" label="إصدار رقم التصريح"
          name={permit.source.fullName + ' (' + permit.source.employeeId + ')'}
          dateTime={formatDateTimeShort(permit.source.approvalDateTime)}
          signature={permit.source.approvalSignature}
        />
        <TimelineEventCard
          color={THEMES.yellow.border} label={hadHandover ? 'إغلاق المستلم (المستلم المغلق)' : 'إغلاق المستلم'}
          name={closingReceiverName}
          dateTime={formatDateTimeShort(permit.receiver.closeDateTime)}
          signature={permit.receiver.closeSignature}
        />
        <TimelineEventCard
          color={THEMES.red.border} label="الإغلاق النهائي (المصدر)"
          name={permit.closingSource.fullName + ' (' + permit.closingSource.employeeId + ')'}
          dateTime={formatDateTimeShort(permit.closingSource.closeDateTime)}
          signature={permit.closingSource.closeSignature}
        />
        {workDuration && (
          <TimelineEventCard color="var(--color-secondary)" label="مدة العمل" name={workDuration} />
        )}
      </div>
    </section>
  );
}
