import React from 'react';
import Icon from '../common/Icon.jsx';
import { computeWorkDurationLabel } from '../../utils/permitFormatting.js';
import { formatDateTimeTwoLines, combineDateAndTime } from '../../hooks/useHijriGregorianDate.js';
import { THEMES } from './permitTheme.js';

/**
 * مؤشر خطوات/صفحات - يُستخدم لكل من خطوات الويزار التفاعلي (freeNav=false، لا يُميَّز
 * كمكتمل/قابل للنقر إلا ما قبل الخطوة الحالية) وتصفح صفحات شاشة العرض النهائية بعد
 * الإغلاق (freeNav=true، كل الصفحات مكتملة أصلًا فتظهر جميعها ملوّنة وقابلة للنقر بحرية).
 */
export function WizardStepper({ steps, currentStep, onStepClick, freeNav, light }) {
  // تسمية واحدة فقط أسفل الصف (اسم الخطوة الحالية) بدل تسمية تحت كل دائرة - يختصر ارتفاع
  // الهيدر كثيرًا مع بقاء وضوح "أين أنا الآن" عبر الدائرة الحالية البارزة + التسمية الواحدة.
  const currentDef = steps.find((s) => s.key === currentStep);
  return (
    <div style={{ marginTop: 8 }}>
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 2 }}>
        {steps.map((step, index) => {
          const isDoneOrActive = freeNav || step.key <= currentStep;
          const isCurrent = step.key === currentStep;
          // نمط "فاتح" (light): دوائر بيضاء فوق هيدر ملوّن بدل دوائر ملوّنة فوق خلفية بيضاء -
          // مستخدَم عندما يعيش المؤشر داخل الهيدر الملوّن نفسه (شاشة تطبيق جوال حقيقية).
          const color = light ? '#fff' : (isDoneOrActive ? step.color : THEMES.neutral.border);
          const circleBg = light ? (isDoneOrActive ? '#fff' : 'rgba(255,255,255,0.25)') : (isDoneOrActive ? color : '#fff');
          const circleText = light ? (isDoneOrActive ? step.color : '#fff') : (isDoneOrActive ? '#fff' : color);
          return (
            <React.Fragment key={step.key}>
              <div
                onClick={() => onStepClick(step.key)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isDoneOrActive ? 'pointer' : 'default', flexShrink: 0 }}
              >
                <div style={{
                  width: isCurrent ? 26 : 22, height: isCurrent ? 26 : 22, borderRadius: '50%',
                  background: circleBg,
                  border: '2px solid ' + (light ? '#fff' : color), color: circleText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0,
                  boxShadow: isCurrent ? '0 0 0 3px rgba(255,255,255,0.35)' : undefined
                }}>
                  {index + 1}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, minWidth: 12, background: light ? 'rgba(255,255,255,0.5)' : ((freeNav || step.key < currentStep) ? step.color : THEMES.neutral.border) }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {currentDef && (
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 'bold', marginTop: 6, color: light ? '#fff' : currentDef.color }}>
          {currentDef.label}
        </div>
      )}
    </div>
  );
}

/**
 * شريط "مراحل حياة التصريح" الأفقي بالأيقونات والتواريخ - يظهر في كل الأحوال (أثناء
 * التعبئة وبعد الإغلاق) ليمنح صورة سريعة عن موقع التصريح في دورة حياته الكاملة.
 * مخفي عند الطباعة (جداول الملخص النهائي في SummaryTables تغطي نفس المعلومات كنص عادي).
 */
export function LifecycleTimeline({ permit }) {
  const workDuration = computeWorkDurationLabel(permit.source.approvalDateTime, permit.closingSource.closeDateTime);
  const stages = [
    { icon: 'edit_note', label: 'تاريخ الإنشاء', dateValue: combineDateAndTime(permit.createdDate, permit.createdTime) },
    { icon: 'tag', label: 'تاريخ إصدار الرقم', dateValue: permit.source.approvalDateTime },
    { icon: 'lock', label: 'تاريخ إغلاق المستلم', dateValue: permit.receiver.closeDateTime },
    { icon: 'check_circle', label: 'تاريخ إغلاق المصدر', dateValue: permit.closingSource.closeDateTime },
    { icon: 'timer', label: 'مدة العمل', text: workDuration, full: true }
  ];
  return (
    <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8, marginTop: 8, marginBottom: 8, fontSize: 11 }}>
      {stages.map((s) => {
        // تاريخ ووقت كسطرين ثابتين (بدل نص طويل واحد قد يلتفّ عشوائيًا داخل صندوق ضيّق).
        const dt = s.dateValue ? formatDateTimeTwoLines(s.dateValue) : null;
        const hasValue = !!(dt || s.text);
        return (
          <div key={s.label} style={{ gridColumn: s.full ? '1 / -1' : undefined, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', boxShadow: 'var(--shadow-card)', borderRadius: 'var(--radius-md)', padding: '8px 10px' }}>
            <Icon name={s.icon} size={16} color={hasValue ? 'var(--color-success)' : '#999'} />
            <div style={{ minWidth: 0 }}>
              <div style={{ opacity: 0.7, fontSize: 10 }}>{s.label}</div>
              {dt ? (
                <div style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>
                  <div>{dt.date}</div>
                  <div style={{ opacity: 0.75, fontWeight: 500 }}>{dt.time}</div>
                </div>
              ) : (
                <div style={{ fontWeight: 'bold', color: hasValue ? 'var(--color-text)' : '#999' }}>{s.text || '—'}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * أزرار التنقل بين خطوات الويزار (السابق/التالي) - onNext اختياري لأن بعض الخطوات
 * تنتقل تلقائيًا للخطوة التالية بعد نجاح إجراء الخادم (مثل الاعتماد) بدل زر يدوي.
 */
export function WizardNav({ onBack, onNext }) {
  return (
    <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
      {onBack ? (
        <button onClick={onBack} style={{ background: THEMES.neutral.badgeBg, color: THEMES.neutral.badgeText }}>السابق</button>
      ) : <span />}
      {onNext ? (
        <button className="primary" onClick={onNext}>التالي</button>
      ) : <span />}
    </div>
  );
}
