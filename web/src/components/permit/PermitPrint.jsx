import React from 'react';
import QRCodeView from '../common/QRCodeView.jsx';
import { PERMIT_TYPE } from '../../config/constants.js';
import { t } from '../../config/permitLabels.js';
import { useSafetyInstructions, SafetyInstructionsTable } from './SafetyInstructionsPage.jsx';
import { computeWorkDurationLabel, splitToBadgeItems } from '../../utils/permitFormatting.js';
import { formatDateTimeShort, formatBilingualDateLines, combineDateAndTime } from '../../hooks/useHijriGregorianDate.js';

/**
 * مستند الطباعة/PDF المستقل - مكوّن قائم بذاته منفصل تمامًا عن شاشة العرض التفاعلية،
 * لا يُعرض على الشاشة إطلاقًا (screen:none) ولا يظهر إلا عند الطباعة الفعلية. صفحتان
 * A4 فقط (كل صفحة تحمل رقم التصريح + QR مصغّر في رأسها لتجميع الأوراق إن تفرّقت):
 * 1) رحلة التصريح كاملة: بيانات المهمة (مختصرة) + المصدر + المستلم + إغلاق المستلم +
 *    الإغلاق النهائي للمصدر + QR الكامل (مرة واحدة فقط) + رقم التصريح + مدة العمل.
 * 2) سجل رحلة التصريح (Audit Trail) + ملخص التواقيع + تعليمات السلامة.
 */
export default function PermitPrint({ permit, companyName, printLang }) {
  const instructions = useSafetyInstructions(permit.permitType);
  const permitTitle = permit.permitType === PERMIT_TYPE.PTW
    ? 'تصريح العمل / Permit To Work'
    : 'تصريح التعميد بالاختبار / Sanction For Testing';

  const hadHandover = permit.receiverHandovers && permit.receiverHandovers.length > 0;
  const firstHandover = hadHandover ? permit.receiverHandovers[0] : null;
  const originalReceiverName = firstHandover
    ? firstHandover.outgoingName + ' (' + firstHandover.outgoingEmployeeId + ')'
    : permit.receiver.fullName + ' (' + permit.receiver.employeeId + ')';
  const closingReceiverName = permit.receiver.fullName + ' (' + permit.receiver.employeeId + ')';

  const workDuration = computeWorkDurationLabel(permit.source.approvalDateTime, permit.closingSource.closeDateTime);

  const journeyStages = [
    { label: 'إنشاء التصريح', dateTime: formatDateTimeShort(combineDateAndTime(permit.createdDate, permit.createdTime)), name: permit.source.fullName, signature: '' },
    { label: 'اعتماد المصدر (تحويل للمستلم)', dateTime: formatDateTimeShort(permit.source.transferDateTime), name: permit.source.fullName, signature: permit.source.transferSignature },
    { label: 'اعتماد المستلم (الاستلام)', dateTime: formatDateTimeShort(permit.receiver.receiveDateTime), name: permit.receiver.fullName, signature: permit.receiver.receiveSignature },
    { label: 'إصدار التصريح', dateTime: formatDateTimeShort(permit.source.approvalDateTime), name: permit.source.fullName, signature: permit.source.approvalSignature },
    { label: 'الإغلاق', dateTime: formatDateTimeShort(permit.closingSource.closeDateTime), name: permit.closingSource.fullName, signature: permit.closingSource.closeSignature }
  ];

  return (
    <div className="permit-print-root">
      <PrintPage pageNumber={1} totalPages={2} permit={permit} companyName={companyName} permitTitle={permitTitle}>
        <WorkDataSection permit={permit} />
        <PersonSection
          bg="var(--color-bg-source)"
          title="بيانات المصدر / Issuer Data"
          employeeId={permit.source.employeeId}
          fullName={permit.source.fullName}
          mobile={permit.source.mobile}
          extraRows={[
            ['رقم قفل السلامة', permit.sourceLockNumber],
            ['اسم مسؤول الجهة المعنية', permit.authorityOfficialName],
            ['نوع الجهة المعنية', permit.authorityType]
          ]}
          dateTime={permit.source.transferDateTime}
          signature={permit.source.transferSignature}
        />
        <PersonSection
          bg="var(--color-bg-receiver)"
          title="بيانات المستلم / Receiver Data"
          employeeId={permit.receiver.employeeId}
          fullName={permit.receiver.fullName}
          mobile={permit.receiver.mobile}
          extraRows={[
            ['رقم قفل السلامة', permit.receiverLockNumber],
            ['نوع الجهة المستلمة', permit.receiverEntityType]
          ]}
          dateTime={permit.receiver.receiveDateTime}
          signature={permit.receiver.receiveSignature}
        />
        <PersonSection
          bg="var(--color-bg-receiver)"
          title="إغلاق/إلغاء التصريح بواسطة المستلم / Closing or Cancelling by Receiver"
          employeeId={permit.receiver.employeeId}
          fullName={hadHandover ? undefined : closingReceiverName}
          extraRows={[
            ['الحالة', permit.status],
            permit.status === 'ملغي' ? ['سبب الإلغاء', permit.cancellationReason] : null,
            hadHandover ? ['المستلم', originalReceiverName] : null,
            hadHandover ? ['المستلم المغلق', closingReceiverName] : null
          ].filter(Boolean)}
          dateTime={permit.receiver.closeDateTime}
          signature={permit.receiver.closeSignature}
        />
        {/* إغلاق المصدر النهائي - نفس بيانات هوية المصدر تُكرَّر هنا عمدًا (رقم قفل السلامة/
            الجهة) بدل الاكتفاء بالتوقيع فقط، فقد لا يكون نفس مصدر بطاقة الإصدار. */}
        <PersonSection
          bg="var(--color-bg-source)"
          title="إغلاق المصدر النهائي / Final Issuer Close-out"
          employeeId={permit.closingSource.employeeId}
          fullName={permit.closingSource.fullName}
          mobile={permit.closingSource.mobile}
          extraRows={[
            ['رقم قفل السلامة', permit.sourceLockNumber],
            ['الجهة', permit.authorityOfficialName]
          ]}
          dateTime={permit.closingSource.closeDateTime}
          signature={permit.closingSource.closeSignature}
        />

        {/* شريط ختامي واحد فقط لكل الصفحتين: QR كامل + رقم التصريح + مدة العمل - بلا تكرار
            لـQR الكامل في الصفحة الثانية (يكفي QR واحد بالمستند، عدا الرمز المصغّر بالرأس
            المتكرر لغرض تجميع الأوراق إن تفرّقت فقط). */}
        <section style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #E2E5EA', borderRadius: 'var(--radius-lg)', padding: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <QRCodeView link={permit.permitLink} size={64} />
          <div style={{ fontSize: 11, flex: 1, minWidth: 0 }}>
            {/* رقم التصريح بسطره الخاص بعرض كامل (اتجاه ثابت LTR بلا التفاف) - لا يُوضَع
                بجانب مدة العمل في نفس الصف كما كان، لأن خلط أرقام/فواصل إنجليزية مع محتوى
                عربي بمساحة ضيقة قد يجعل الأجزاء تُعاد ترتيبها بصريًا (Bidi) بشكل مربك. */}
            <div style={{ opacity: 0.7 }}>{t('permitNumber', 'ar')}</div>
            <div style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--color-success)', direction: 'ltr', textAlign: 'right', whiteSpace: 'nowrap' }}>{permit.permitNumber || '—'}</div>
            <div style={{ opacity: 0.7, marginTop: 6 }}>{t('workDuration', 'ar')}</div>
            <div style={{ fontWeight: 'bold' }}>{workDuration || '—'}</div>
          </div>
        </section>
      </PrintPage>

      <PrintPage pageNumber={2} totalPages={2} permit={permit} companyName={companyName} permitTitle={permitTitle} isLast>
        <section style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--color-primary)' }}>سجل رحلة التصريح</div>
          <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 6 }}>Audit Trail / Operations Log</div>
          <table className="app-table">
            <thead>
              <tr><th>المرحلة</th><th>التاريخ والوقت</th><th>اسم المنفّذ</th></tr>
            </thead>
            <tbody>
              {journeyStages.map((stage) => (
                <tr key={stage.label}>
                  <td>{stage.label}</td>
                  <td>{stage.dateTime || '—'}</td>
                  <td>{stage.name || '—'}</td>
                </tr>
              ))}
              <tr>
                <td>مدة تنفيذ العمل</td>
                <td colSpan={2}>{workDuration || '—'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2E5EA' }}>
          <div style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--color-primary)' }}>ملخص التواقيع</div>
          <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 6 }}>Signatures Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {journeyStages.filter((s) => s.signature).map((stage) => (
              <div key={stage.label} style={{ border: '1px solid #E2E5EA', borderRadius: 'var(--radius-md)', padding: 6, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <img src={stage.signature} alt="توقيع" style={{ height: 30 }} />
                <div style={{ fontSize: 9, fontWeight: 'bold', marginTop: 4 }}>{stage.name || '—'}</div>
                <div style={{ fontSize: 8, opacity: 0.65 }}>{stage.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #E2E5EA' }}>
          <div style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--color-primary)', textAlign: 'center', margin: '0 0 4px' }}>
            {printLang === 'ar' ? 'قواعد وتعليمات السلامة الهامة' : 'Important Safety Instructions'}
          </div>
        </div>
        <SafetyInstructionsTable instructions={instructions} lang={printLang} onLangChange={() => {}} />
      </PrintPage>
    </div>
  );
}

/**
 * غلاف صفحة A4 مع رأس مصغّر متكرر (اسم الشركة/نوع التصريح/رقم التصريح/QR مصغّر/ترقيم
 * الصفحة) - يُكرَّر في كل صفحة عمدًا لتجميع الأوراق إن تفرّقت فعليًا عن بعضها. ارتفاع أدنى
 * (min-height) بدل ارتفاع ثابت مع إخفاء الزائد - تعليمات السلامة متغيّرة الطول وقد تتجاوز
 * صفحة واحدة، فإخفاء الزائد كان سيحذف محتوى فعليًا بدل مجرد إطالة الطباعة صفحة إضافية.
 */
function PrintPage({ pageNumber, totalPages, permit, companyName, permitTitle, isLast, children }) {
  return (
    <section className={'print-page' + (isLast ? ' print-page-last' : '')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--color-primary)', paddingBottom: 6, fontSize: 10 }}>
        <div style={{ fontWeight: 'bold' }}>{companyName || ''}</div>
        <div>
          <span style={{ display: 'inline-block', background: permit.permitType === 'PTW' ? 'var(--color-ptw)' : 'var(--color-sft)', color: '#fff', borderRadius: 999, padding: '1px 8px', fontSize: 9, fontWeight: 'bold', marginLeft: 6 }}>
            {permit.permitType}
          </span>
          {permitTitle}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <QRCodeView link={permit.permitLink} size={26} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 9, direction: 'ltr', textAlign: 'right', whiteSpace: 'nowrap' }}>{permit.permitNumber || permit.creationId}</div>
            <div>صفحة {pageNumber} / {totalPages}</div>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

/** صف مزدوج (بيان|قيمة × 2) داخل جدول بيانات المهمة المختصر. */
function DualRow({ a, b }) {
  return (
    <tr>
      <td style={{ fontWeight: 'bold', opacity: 0.75, width: '17%' }}>{a[0]}</td>
      <td style={{ fontWeight: 'bold', width: '33%' }}>{a[1] || '—'}</td>
      <td style={{ fontWeight: 'bold', opacity: 0.75, width: '17%' }}>{b ? b[0] : ''}</td>
      <td style={{ fontWeight: 'bold', width: '33%' }}>{b ? (b[1] || '—') : ''}</td>
    </tr>
  );
}

/**
 * قسم "بيانات المهمة التشغيلية" - جدول مختصر (بيان|قيمة×2) بدل شبكة حقول رأسية، يقلّص
 * ارتفاع البطاقة بنسبة كبيرة (أكثر بطاقة كانت تستهلك مساحة بالمستند). نقاط العزل ومفاتيح
 * المصدر تبقى Badges منفصلة أسفل الجدول لأنها قوائم متغيّرة الطول لا تناسب خلية جدول ثابتة.
 */
function WorkDataSection({ permit }) {
  const isolationBadges = splitToBadgeItems(permit.isolationPoints);
  const sourceSwitchBadges = splitToBadgeItems(permit.sourceSwitches);
  const voltageOrTest = permit.permitType === PERMIT_TYPE.PTW
    ? [t('voltageLevel', 'ar'), permit.voltageLevel]
    : [t('testType', 'ar'), permit.testType];

  return (
    <section style={{ marginTop: 8, background: 'var(--color-bg-work)', border: '1px solid #E2E5EA', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: 'var(--radius-lg)', padding: 10 }}>
      <div style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--color-primary)' }}>بيانات المهمة التشغيلية</div>
      <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 6 }}>Task Data</div>

      <table className="app-table" style={{ fontSize: 11 }}>
        <thead>
          <tr><th>البيان</th><th>القيمة</th><th>البيان</th><th>القيمة</th></tr>
        </thead>
        <tbody>
          <DualRow a={[t('location', 'ar'), permit.location]} b={[t('unit', 'ar'), permit.unit]} />
          <DualRow a={[t('station', 'ar'), permit.station]} b={[t('feeder', 'ar'), permit.feeder]} />
          <DualRow a={[t('circuit', 'ar'), permit.circuit]} b={[t('operationalProgramNumber', 'ar'), permit.operationalProgramNumber]} />
          <DualRow a={voltageOrTest} b={[t('workDuration', 'ar'), computeWorkDurationLabel(permit.source.approvalDateTime, permit.closingSource.closeDateTime)]} />
          <DualRow a={[t('workDescription', 'ar'), permit.workDescription]} />
        </tbody>
      </table>

      {(isolationBadges.length > 0 || sourceSwitchBadges.length > 0) && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E2E5EA' }}>
          <BadgeField label={t('isolationPoints', 'ar')} items={isolationBadges} />
          <BadgeField label="مفاتيح المصدر" items={sourceSwitchBadges} />
        </div>
      )}
    </section>
  );
}

function Field({ label, value, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <div style={{ fontWeight: 'bold', opacity: 0.75 }}>{label}</div>
      <div style={{ fontWeight: 'bold' }}>{value || '—'}</div>
    </div>
  );
}

function BadgeField({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 6, fontSize: 11 }}>
      <div style={{ fontWeight: 'bold', opacity: 0.75, marginBottom: 3 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {items.map((item, i) => (
          <span key={i} style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: 999, padding: '2px 8px', fontWeight: 'bold' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * قسم بيانات طرف (مصدر/مستلم/إغلاق): بيانات الموظف، ثم "بيانات الاعتماد" كجدول مدمج
 * مضغوط (حقول إضافية مزدوجة + صف تاريخ/وقت + صف توقيع) بدل خمس بطاقات صغيرة منفصلة -
 * يقلّص ارتفاع كل بطاقة طرف بمقدار كبير حسب المواصفة المعتمدة.
 */
function PersonSection({ bg, title, employeeId, fullName, mobile, extraRows, dateTime, signature }) {
  // العربي عنوان رئيسي والإنجليزي أسفله بخط أصغر - أقرب للنماذج الصناعية الاحترافية.
  const [titleAr, titleEn] = String(title).split(' / ');
  const rows = extraRows || [];
  const pairedRows = [];
  for (let i = 0; i < rows.length; i += 2) {
    pairedRows.push([rows[i], rows[i + 1] || null]);
  }
  const dateLines = formatBilingualDateLines(dateTime);

  return (
    <section style={{ marginTop: 8, background: bg, border: '1px solid #E2E5EA', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: 'var(--radius-lg)', padding: 10 }}>
      <div style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--color-primary)' }}>{titleAr}</div>
      {titleEn && <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 6 }}>{titleEn}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 11 }}>
        {employeeId && <Field label={t('employeeId', 'ar')} value={employeeId} />}
        {fullName && <Field label={t('fullName', 'ar')} value={fullName} />}
        {mobile && <Field label={t('mobile', 'ar')} value={mobile} />}
      </div>

      {/* بيانات الاعتماد - جدول واحد مضغوط: صفوف الحقول الإضافية مزدوجة، ثم صف التاريخ/الوقت
          (ميلادي وهجري معًا)، ثم صف التوقيع بعرض كامل - بدل خمس بطاقات صغيرة متفرقة. خط فاصل
          رفيع أعلاها يفصلها بصريًا عن بيانات الموظف أعلاه ضمن نفس بطاقة الطرف. */}
      <div style={{ fontSize: 10, fontWeight: 'bold', opacity: 0.7, marginTop: 8, paddingTop: 8, borderTop: '1px solid #E2E5EA' }}>بيانات الاعتماد</div>
      <table className="app-table" style={{ marginTop: 2, fontSize: 11 }}>
        <tbody>
          {pairedRows.map(([first, second], idx) => (
            <tr key={idx}>
              <td style={{ fontWeight: 'bold', opacity: 0.75, width: '17%' }}>{first[0]}</td>
              <td style={{ fontWeight: 'bold', width: second ? '33%' : '83%' }} colSpan={second ? 1 : 3}>{first[1] || '—'}</td>
              {second && <td style={{ fontWeight: 'bold', opacity: 0.75, width: '17%' }}>{second[0]}</td>}
              {second && <td style={{ fontWeight: 'bold', width: '33%' }}>{second[1] || '—'}</td>}
            </tr>
          ))}
          {dateLines && (
            <tr>
              <td style={{ fontWeight: 'bold', opacity: 0.75 }}>{t('dateTime', 'ar')}</td>
              <td style={{ fontWeight: 'bold' }} colSpan={3}>
                {dateLines.gregorian}
                <span style={{ opacity: 0.7, fontWeight: 500 }}> - {dateLines.hijri}</span>
              </td>
            </tr>
          )}
          <tr>
            <td style={{ fontWeight: 'bold', opacity: 0.75 }}>{t('signature', 'ar')}</td>
            <td colSpan={3}>
              {signature ? <img src={signature} alt="توقيع" style={{ height: 30 }} /> : '—'}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
