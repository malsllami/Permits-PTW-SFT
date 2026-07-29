import React from 'react';
import QRCodeView from '../common/QRCodeView.jsx';
import { PERMIT_TYPE } from '../../config/constants.js';
import { t } from '../../config/permitLabels.js';
import { useAllSafetyItems, SafetyInstructionsTable } from './SafetyInstructionsPage.jsx';
import { computeWorkDurationLabel, splitToBadgeItems } from '../../utils/permitFormatting.js';
import { formatDateTimeShort, formatBilingualDateLines, combineDateAndTime } from '../../hooks/useHijriGregorianDate.js';

/**
 * نظام تصميم ثابت لمستند PDF فقط (لا يمسّ متغيّرات الموقع الحي العامة التي قد يُعدّلها
 * المدير من "الإعدادات > ألوان النظام") - المستند الرسمي المؤرشف يجب أن يبقى بنفس الألوان
 * والمقاسات دومًا بصرف النظر عن أي تخصيص لاحق لواجهة الموقع التفاعلية، حسب المواصفة المعتمدة.
 */
const PRINT = {
  space: '5mm',
  blue: '#0F4C81',
  blueLight: '#EEF6FD',
  blueDivider: '#D6E8F8',
  green: '#1D6F42',
  permitGreen: '#14532D',
  yellow: '#F5B400',
  red: '#D9534F',
  gray: '#6B7280',
  divider: '#E5E7EB',
  border: '#E6E6E6',
  radius: 14,
  shadow: '0 1px 3px rgba(0,0,0,.05)',
  headerHeight: 52,
  sourceBg: '#FDF5F4',
  sourceDivider: '#F6D9D6',
  receiverBg: '#FFF9EB',
  receiverDivider: '#F7E5A8'
};

/**
 * مستند الطباعة/PDF المستقل - مكوّن قائم بذاته منفصل تمامًا عن شاشة العرض التفاعلية،
 * لا يُعرض على الشاشة إطلاقًا (screen:none) ولا يظهر إلا عند الطباعة الفعلية. 3 صفحات A4
 * (كل صفحة تحمل رقم التصريح + QR مصغّر في رأسها لتجميع الأوراق إن تفرّقت)، كل صفحة بغرض
 * واحد واضح - التصريح نظام PTW إلكتروني كامل والـPDF نسخة أرشيفية رسمية عند الحاجة فقط:
 * 1) ملخص التصريح: ماذا وَمن؟ - بيانات المهمة + رقم التصريح/QR + بطاقات الأطراف الأربع.
 * 2) الدليل والإثبات: كيف نُفِّذ؟ - سجل رحلة التصريح + إجراءات التنفيذ الموقَّعة لكل مرحلة
 *    (4 مجموعات: مصدر/مستلم/إغلاق مستلم/إغلاق مصدر) + ملخص التواقيع الأربعة.
 * 3) المرجع القانوني والإجرائي: قواعد وتعليمات السلامة فقط - صفحة ثابتة بلا بيانات متغيّرة.
 */
export default function PermitPrint({ permit, companyName, printLang }) {
  const { items: allSafetyItems, loaded: safetyItemsLoaded } = useAllSafetyItems(permit.permitType);
  const instructions = allSafetyItems.filter((i) => i.itemType === 'تعليمات');
  const actionsByStage = (stage) => allSafetyItems.filter((i) => i.itemType === 'إجراء' && i.stage === stage);
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

  // توقيع المصدر واحد فعليًا طوال دورة الإصدار (يُرسم عند التحويل للمستلم ويُعاد استخدامه
  // نفسه عند اعتماد إصدار الرقم لاحقًا - لا توقيع جديد فعليًا) - "ملخص التواقيع" يعرضه
  // مرة واحدة فقط (ضمن "إصدار التصريح") بدل تكراره كتوقيعين منفصلين لنفس الشخص لنفس التوقيع؛
  // سجل رحلة التصريح (الجدول) يبقى يُظهر كلا الحدثين بتوقيتيهما المختلفين كما هما (تسلسل
  // زمني حقيقي، وليس صورة توقيع). "الإغلاق" أيضًا يُفصَّل لحدثين حقيقيين بتوقيعين مختلفين:
  // إغلاق المستلم أولًا ثم الإغلاق النهائي للمصدر.
  const journeyStages = [
    { label: 'إنشاء التصريح', dateTime: formatDateTimeShort(combineDateAndTime(permit.createdDate, permit.createdTime)), name: permit.source.fullName, signature: '' },
    { label: 'اعتماد المصدر (تحويل للمستلم)', dateTime: formatDateTimeShort(permit.source.transferDateTime), name: permit.source.fullName, signature: '' },
    { label: 'اعتماد المستلم (الاستلام)', dateTime: formatDateTimeShort(permit.receiver.receiveDateTime), name: permit.receiver.fullName, signature: permit.receiver.receiveSignature },
    { label: 'إصدار التصريح', dateTime: formatDateTimeShort(permit.source.approvalDateTime), name: permit.source.fullName, signature: permit.source.approvalSignature },
    { label: 'إغلاق المستلم', dateTime: formatDateTimeShort(permit.receiver.closeDateTime), name: permit.receiver.fullName, signature: permit.receiver.closeSignature },
    { label: 'الإغلاق النهائي (المصدر)', dateTime: formatDateTimeShort(permit.closingSource.closeDateTime), name: permit.closingSource.fullName, signature: permit.closingSource.closeSignature }
  ];

  // ارتفاع أدنى ثابت موحّد لكل بطاقات الأطراف الأربع (نفس القيمة للصفّين معًا) بدل ارتفاع
  // حر يتفاوت حسب اكتمال البيانات - min-height فقط (وليس height مقصوصًا بـoverflow:hidden)
  // كي لا يُفقَد أي بيان حقيقي في حال نادر يتجاوز فيه المحتوى هذا الحد (نفس الدرس المستفاد
  // من حادثة قصّ "إغلاق المصدر النهائي" سابقًا هذه الجلسة) - عمليًا الحقول هنا قصيرة ومحدودة
  // الطول فتبدو البطاقة ثابتة المقاس في كل الحالات الواقعية تقريبًا.
  const PERSON_CARD_MIN_HEIGHT = 235;

  return (
    <div className="permit-print-root" data-pdf-ready={safetyItemsLoaded ? 'true' : 'false'}>
      <PrintPage pageNumber={1} totalPages={3} permit={permit} companyName={companyName} permitTitle={permitTitle}>
        <WorkDataSection permit={permit} />

        {/* رقم التصريح + QR مباشرة أسفل بيانات المهمة - أهم معلومة في المستند تظهر أولًا، قبل
            بيانات الأشخاص. يمين: رقم التصريح - يسار: QR (حسب النظام المعتمد)، بطاقة رسمية
            هادئة: حدود وظل موحّدان مع بقية بطاقات المستند، أخضر داكن ثابت، وخط سفلي خفيف جدًا
            أسفل الرقم بعرضه فقط (وليس عرض البطاقة) لتثبيته بصريًا بلمسة رسمية دون تشديد. */}
        <section style={{ marginTop: PRINT.space, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #DCE0E6', boxShadow: '0 2px 4px rgba(0,0,0,.06)', borderRadius: PRINT.radius, padding: 12, background: '#fff' }}>
          <div style={{ fontSize: 12, flex: 1, minWidth: 0 }}>
            {/* رقم التصريح بسطره الخاص بعرض كامل (اتجاه ثابت LTR بلا التفاف) - لا يُوضَع بجانب
                مدة العمل بنفس الصف، لأن خلط أرقام/فواصل إنجليزية مع محتوى عربي بمساحة ضيقة قد
                يُعيد ترتيب الأجزاء بصريًا (Bidi) بشكل مربك. مسافة أوضح بين تسمية "رقم التصريح"
                والرقم نفسه (بدل التصاقهما) لفصل بصري أهدأ. */}
            <div style={{ opacity: 0.75, fontSize: 12, fontWeight: 600 }}>{t('permitNumber', 'ar')}</div>
            <div style={{
              display: 'inline-block', fontWeight: 700, fontSize: 20, color: PRINT.permitGreen,
              direction: 'ltr', textAlign: 'right', whiteSpace: 'nowrap',
              borderBottom: '1px solid #CFE5D7', paddingBottom: 3, marginTop: 7
            }}>
              {permit.permitNumber || '—'}
            </div>
            <div style={{ opacity: 0.75, fontSize: 12, fontWeight: 600, marginTop: 8 }}>{t('workDuration', 'ar')}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{workDuration || '—'}</div>
          </div>
          <div style={{ padding: 8, background: '#fff', border: '0.5px solid ' + PRINT.border, borderRadius: 6, display: 'inline-flex', flexShrink: 0 }}>
            <QRCodeView link={permit.permitLink} size={64} />
          </div>
        </section>

        {/* بيانات المصدر/المستلم جنبًا إلى جنب (عمودان) بدل التتابع الرأسي - يقلّص الارتفاع
            الكلي للصفحة بمقدار كبير، مع إبقاء تخطيط داخلي لكل بطاقة يضمن ظهور كل بيان بوضوح
            رغم ضيق نصف العرض (انظر PersonSection). */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: PRINT.space }}>
          <PersonSection
            bg={PRINT.sourceBg} dividerColor={PRINT.sourceDivider} minHeight={PERSON_CARD_MIN_HEIGHT}
            stripColor={PRINT.red}
            title="بيانات المصدر / Issuer Data"
            employeeId={permit.source.employeeId}
            fullName={permit.source.fullName}
            mobile={permit.source.mobile}
            extraRows={[
              ['اسم مسؤول الجهة المعنية', permit.authorityOfficialName]
            ]}
            dateTime={permit.source.transferDateTime}
            signature={permit.source.transferSignature}
          />
          <PersonSection
            bg={PRINT.receiverBg} dividerColor={PRINT.receiverDivider} minHeight={PERSON_CARD_MIN_HEIGHT}
            stripColor={PRINT.yellow}
            title="بيانات المستلم / Receiver Data"
            employeeId={permit.receiver.employeeId}
            fullName={permit.receiver.fullName}
            mobile={permit.receiver.mobile}
            extraRows={[
              ['نوع الجهة المستلمة', permit.receiverEntityType]
            ]}
            dateTime={permit.receiver.receiveDateTime}
            signature={permit.receiver.receiveSignature}
          />
        </div>
        {/* إغلاق المستلم/إغلاق المصدر النهائي جنبًا إلى جنب بنفس المبدأ - أرقام أقفال السلامة
            لا تظهر في بطاقات الإغلاق (لا قفل فعلي يُذكر عند الإغلاق نفسه)، وتظهر بدلاً من ذلك
            ضمن "إجراءات التنفيذ" في الصفحة الثانية لمرحلتَي الإصدار/الاستلام فقط. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: PRINT.space }}>
          <PersonSection
            bg={PRINT.receiverBg} dividerColor={PRINT.receiverDivider} minHeight={PERSON_CARD_MIN_HEIGHT}
            stripColor={PRINT.yellow}
            title="إغلاق/إلغاء التصريح بواسطة المستلم / Closing or Cancelling by Receiver"
            employeeId={permit.receiver.employeeId}
            fullName={hadHandover ? undefined : closingReceiverName}
            extraRows={[
              ['نوع الجهة المستلمة', permit.receiverEntityType],
              ['الحالة', permit.status],
              permit.status === 'ملغي' ? ['سبب الإلغاء', permit.cancellationReason] : null,
              hadHandover ? ['المستلم', originalReceiverName] : null,
              hadHandover ? ['المستلم المغلق', closingReceiverName] : null
            ].filter(Boolean)}
            dateTime={permit.receiver.closeDateTime}
            signature={permit.receiver.closeSignature}
          />
          <PersonSection
            bg={PRINT.sourceBg} dividerColor={PRINT.sourceDivider} minHeight={PERSON_CARD_MIN_HEIGHT}
            stripColor={PRINT.red}
            title="إغلاق المصدر النهائي / Final Issuer Close-out"
            employeeId={permit.closingSource.employeeId}
            fullName={permit.closingSource.fullName}
            mobile={permit.closingSource.mobile}
            extraRows={[
              ['الجهة', permit.authorityOfficialName]
            ]}
            dateTime={permit.closingSource.closeDateTime}
            signature={permit.closingSource.closeSignature}
          />
        </div>
      </PrintPage>

      {/* الصفحة الثانية: "الدليل والإثبات" - كيف نُفِّذ التصريح؟ سجل رحلة التصريح (متى/من)
          ثم إجراءات التنفيذ الموقَّعة لكل مرحلة (ماذا نُفِّذ فعليًا - لم تكن تظهر في PDF
          إطلاقًا سابقًا، فقط في الشاشة الحية) ثم ملخص التواقيع الأربعة في نهاية الصفحة. */}
      <PrintPage pageNumber={2} totalPages={3} permit={permit} companyName={companyName} permitTitle={permitTitle}>
        <section style={{ marginTop: PRINT.space }}>
          <div style={{ fontWeight: 'bold', fontSize: 18, color: PRINT.blue }}>سجل رحلة التصريح</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: PRINT.gray, marginBottom: 6 }}>Audit Trail / Operations Log</div>
          <table className="app-table" style={{ fontSize: 13 }}>
            <thead>
              <tr><th>المرحلة</th><th>التاريخ والوقت</th><th>اسم المنفّذ</th></tr>
            </thead>
            <tbody>
              {journeyStages.map((stage) => (
                <tr key={stage.label}>
                  <td style={{ padding: '9px 6px' }}>{stage.label}</td>
                  <td style={{ padding: '9px 6px' }}>{stage.dateTime || '—'}</td>
                  <td style={{ padding: '9px 6px' }}>{stage.name || '—'}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '9px 6px' }}>مدة تنفيذ العمل</td>
                <td style={{ padding: '9px 6px' }} colSpan={2}>{workDuration || '—'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* إجراءات التنفيذ الموقَّعة - بطاقة واحدة تضمّ 4 مجموعات مطابقة تمامًا للمراحل الأربع
            الفعلية في SafetyChecklistSection (الشاشة الحية)، بالترتيب الزمني، بهوية لونية
            ثابتة (أحمر=مصدر دائمًا، أصفر=مستلم دائمًا) - تحوّل المستند لإثبات كامل لما نُفِّذ.
            رقم قفل السلامة انتقل إلى هنا (مجموعتَي الإصدار/الاستلام فقط - لا قفل يُذكر عند
            الإغلاق) بدل بطاقات الأطراف في الصفحة الأولى. خط فاصل رمادي رفيع منتصف الشبكة يفصل
            بصريًا بين عمود المصدر وعمود المستلم. */}
        <section style={{ marginTop: PRINT.space, background: '#fff', border: '1px solid ' + PRINT.border, boxShadow: PRINT.shadow, borderRadius: PRINT.radius, padding: 12 }}>
          <div style={{ fontWeight: 'bold', fontSize: 18, color: PRINT.blue }}>إجراءات التنفيذ</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: PRINT.gray, marginBottom: 6 }}>Execution Actions Confirmation</div>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, insetInlineStart: '50%', width: 1, background: PRINT.divider }} />
            <ActionConfirmationGroup
              title="إجراءات المصدر (عند الإصدار)" color={PRINT.red} lockNumber={permit.sourceLockNumber}
              items={actionsByStage('المصدر')} checklistState={permit.checklistState || {}}
            />
            <ActionConfirmationGroup
              title="إجراءات المستلم (عند الاستلام)" color={PRINT.yellow} lockNumber={permit.receiverLockNumber}
              items={actionsByStage('المستلم')} checklistState={permit.checklistState || {}}
            />
            <ActionConfirmationGroup
              title="إجراءات إغلاق المستلم" color={PRINT.yellow}
              items={actionsByStage('إغلاق المستلم')} checklistState={permit.checklistState || {}}
            />
            <ActionConfirmationGroup
              title="إجراءات إغلاق المصدر" color={PRINT.red}
              items={actionsByStage('إغلاق المصدر')} checklistState={permit.checklistState || {}}
            />
          </div>
        </section>

        {/* التواقيع الأربعة: 2×2 بدل صف واحد بأربعة أعمدة - نفس التصميم ونفس المقاس (ارتفاع
            أدنى موحّد) لكل بطاقة توقيع بصرف النظر عن طول الاسم/تسمية المرحلة. */}
        <section style={{ marginTop: PRINT.space }}>
          <div style={{ fontWeight: 'bold', fontSize: 18, color: PRINT.blue }}>ملخص التواقيع</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: PRINT.gray, marginBottom: 6 }}>Signatures Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {journeyStages.filter((s) => s.signature).map((stage) => (
              <div key={stage.label} style={{ minHeight: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid ' + PRINT.border, borderRadius: PRINT.radius, padding: 8, textAlign: 'center', boxShadow: PRINT.shadow }}>
                <img src={stage.signature} alt="توقيع" style={{ height: 35 }} />
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{stage.name || '—'}</div>
                <div style={{ fontSize: 11, color: PRINT.gray }}>{stage.label}</div>
              </div>
            ))}
          </div>
        </section>
      </PrintPage>

      {/* الصفحة الثالثة: "المرجع القانوني والإجرائي" - قواعد وتعليمات السلامة فقط، بلا أي
          بيانات متغيّرة (لا تواقيع، لا جداول) - صفحة ثابتة لا تتغيّر بين تصريح وآخر إلا إذا
          عدّلت الشركة التعليمات نفسها، مع جملة توثيقية تربطها رسميًا بالتصريح. لا بطاقة هنا
          (وثيقة رسمية مرجعية - جدول مباشر فقط). */}
      <PrintPage pageNumber={3} totalPages={3} permit={permit} companyName={companyName} permitTitle={permitTitle} isLast>
        <div style={{ marginTop: PRINT.space }}>
          <div style={{ fontWeight: 'bold', fontSize: 28, color: PRINT.blue, textAlign: 'center', margin: '0 0 8px' }}>
            {printLang === 'ar' ? 'قواعد وتعليمات السلامة الهامة' : 'Important Safety Instructions'}
          </div>
        </div>
        <SafetyInstructionsTable instructions={instructions} lang={printLang} onLangChange={() => {}} hideLanguageToggle />
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid ' + PRINT.divider, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7F1D1D' }}>
            تم إصدار هذا التصريح إلكترونيًا، وتشكّل هذه التعليمات جزءًا من تصريح العمل، ويُعتبر اعتماد التصريح إقرارًا بالاطلاع عليها والالتزام بها.
          </div>
          {/* خط قصير مركزي أسفل الجملة (ليس تسطيرًا كاملًا يمتد من بداية النص لنهايته) -
              عنصر زخرفي منفصل تحت الفقرة بعرض ثابت أضيق بكثير من عرض الجملة. */}
          <div style={{ width: 160, height: 2, background: '#7F1D1D', margin: '6px auto 0' }} />
        </div>
      </PrintPage>
    </div>
  );
}

/**
 * غلاف صفحة A4 مع رأس مصغّر متكرر (اسم الشركة/نوع التصريح/رقم التصريح/QR مصغّر/ترقيم
 * الصفحة) - يُكرَّر في كل صفحة عمدًا لتجميع الأوراق إن تفرّقت فعليًا عن بعضها. هوامش 8مم
 * ثابتة على كل الجهات (يمين/يسار/أعلى/أسفل) حسب النظام العام المعتمد. ارتفاع أدنى
 * (min-height) بدل ارتفاع ثابت مع إخفاء الزائد - تعليمات السلامة متغيّرة الطول وقد تتجاوز
 * صفحة واحدة، فإخفاء الزائد كان سيحذف محتوى فعليًا بدل مجرد إطالة الطباعة صفحة إضافية.
 */
function PrintPage({ pageNumber, totalPages, permit, companyName, permitTitle, isLast, children }) {
  return (
    <section className={'print-page' + (isLast ? ' print-page-last' : '')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid ' + PRINT.blue, paddingBottom: 6, fontSize: 10 }}>
        <div style={{ fontWeight: 'bold' }}>{companyName || ''}</div>
        <div>
          <span style={{ display: 'inline-block', background: permit.permitType === 'PTW' ? PRINT.blue : PRINT.green, color: '#fff', borderRadius: 999, padding: '1px 8px', fontSize: 9, fontWeight: 'bold', marginLeft: 6 }}>
            {permit.permitType}
          </span>
          {permitTitle}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ padding: 2, background: '#fff', border: '0.5px solid ' + PRINT.border, borderRadius: 4, display: 'inline-flex' }}>
            <QRCodeView link={permit.permitLink} size={26} />
          </div>
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

/**
 * مجموعة "إجراءات التنفيذ" لمرحلة واحدة - نفس نمط التأكيد المرئي المعتمَد في
 * SafetyChecklistSection (الشاشة الحية): مربّع مرسوم بالكود + علامة ✓ خضراء بدل
 * input[type=checkbox] حي، لأن محركات الالتقاط/الطباعة لا تُظهر accent-color بشكل موثوق.
 */
function ActionConfirmationGroup({ title, color, items, checklistState, lockNumber }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 4 }}>{title}</div>
      {lockNumber && (
        <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ color, fontWeight: 700 }}>🔐 رقم قفل السلامة:</span>
          <span style={{ display: 'inline-block', color: PRINT.red, fontWeight: 700, borderBottom: '1px solid ' + PRINT.red, paddingBottom: 1 }}>
            {lockNumber}
          </span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item) => {
          const checked = !!checklistState[item.row];
          return (
            <div key={item.row} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, fontWeight: 'bold' }}>
              <span style={{
                width: 10, height: 10, minWidth: 10, borderRadius: 2, display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', background: checked ? PRINT.green : '#fff',
                border: '1.2px solid ' + (checked ? PRINT.green : '#999'), color: '#fff', fontSize: 7, lineHeight: 1
              }}>
                {checked ? '✓' : ''}
              </span>
              <span>{item.textAr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** صف مزدوج (بيان|قيمة × 2) داخل جدول بيانات المهمة المختصر. */
function DualRow({ a, b }) {
  return (
    <tr>
      <td style={{ fontSize: 12, fontWeight: 600, opacity: 0.75, width: '17%' }}>{a[0]}</td>
      <td style={{ fontSize: 14, fontWeight: 700, width: '33%' }}>{a[1] || '—'}</td>
      <td style={{ fontSize: 12, fontWeight: 600, opacity: 0.75, width: '17%' }}>{b ? b[0] : ''}</td>
      <td style={{ fontSize: 14, fontWeight: 700, width: '33%' }}>{b ? (b[1] || '—') : ''}</td>
    </tr>
  );
}

/**
 * قسم "بيانات المهمة التشغيلية" - جدول مختصر (بيان|قيمة×2) بدل شبكة حقول رأسية، بخلفية زرقاء
 * فاتحة ثابتة وعرض كامل يطابق عرض بطاقات الأطراف بالأسفل. ارتفاع أدنى 72مم (بلا حد أقصى
 * صارم يقصّ المحتوى - وصف العمل نص حر متغيّر الطول، وقصّه كان سيفقد بيانات حقيقية، وهو خطأ
 * وقعنا فيه سابقًا هذه الجلسة وتقرّر تفاديه نهائيًا). نقاط العزل ومفاتيح المصدر تبقى Badges
 * منفصلة أسفل الجدول لأنها قوائم متغيّرة الطول لا تناسب خلية جدول ثابتة.
 */
function WorkDataSection({ permit }) {
  const isolationBadges = splitToBadgeItems(permit.isolationPoints);
  const sourceSwitchBadges = splitToBadgeItems(permit.sourceSwitches);
  const voltageOrTest = permit.permitType === PERMIT_TYPE.PTW
    ? [t('voltageLevel', 'ar'), permit.voltageLevel]
    : [t('testType', 'ar'), permit.testType];

  return (
    <section style={{ marginTop: PRINT.space, minHeight: '72mm', background: PRINT.blueLight, border: '1px solid ' + PRINT.border, boxShadow: PRINT.shadow, borderRadius: PRINT.radius, padding: 12, '--pp-row-divider': PRINT.blueDivider, '--pp-row-bg-even': 'transparent' }}>
      <div style={{ fontWeight: 'bold', fontSize: 28, color: PRINT.blue }}>بيانات المهمة التشغيلية</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: PRINT.gray, marginBottom: 8 }}>Task Data</div>

      <table className="app-table" style={{ fontSize: 13 }}>
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
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid ' + PRINT.divider }}>
          <BadgeField label={t('isolationPoints', 'ar')} items={isolationBadges} />
          <BadgeField label="مفاتيح المصدر" items={sourceSwitchBadges} />
        </div>
      )}
    </section>
  );
}

function BadgeField({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 6, fontSize: 13 }}>
      <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.75, marginBottom: 3 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {items.map((item, i) => (
          <span key={i} style={{ border: '1px solid ' + PRINT.blue, color: PRINT.blue, borderRadius: 999, padding: '2px 8px', fontWeight: 'bold' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * قسم بيانات طرف (مصدر/مستلم/إغلاق): هيدر صلب اللون بارتفاع ثابت (هوية الطرف فورًا، بلا رقم
 * تسلسل - أُزيل حسب الطلب)، يليه جسم البطاقة بخلفية فاتحة من نفس عائلة اللون - كل بيانات
 * الطرف (الهوية ثم البيانات الإضافية) داخل جدول واحد متصل، صف واحد لكل بيان/قيمة (بلا دمج
 * صفّين في صف واحد) حسب التوزيع المعتمد. فواصل الجدول الداخلية بلون مشتقّ من لون البطاقة
 * نفسها بدل الرمادي العام (عبر متغيّرَي CSS محليَّين "--pp-row-divider"/"--pp-row-bg-even"
 * يرثهما الجدول الداخلي فقط، بلا أي تأثير على جداول الموقع الحي الأخرى). ارتفاع أدنى موحّد
 * (minHeight) وليس ارتفاعًا مقصوصًا، فلا فقدان بيانات.
 */
function PersonSection({ bg, dividerColor, minHeight, title, stripColor, employeeId, fullName, mobile, extraRows, dateTime, signature }) {
  // العربي عنوان رئيسي والإنجليزي أسفله بخط أصغر - أقرب للنماذج الصناعية الاحترافية.
  const [titleAr, titleEn] = String(title).split(' / ');
  // صف واحد لكل بيان (الاسم/الرقم الوظيفي/الجوال ثم الحقول الإضافية الخاصة بكل بطاقة) -
  // بدل دمج بيانَين في صف واحد، حسب التوزيع المعتمد.
  const rows = [];
  if (fullName) rows.push([t('fullName', 'ar'), fullName]);
  if (employeeId) rows.push([t('employeeId', 'ar'), employeeId]);
  if (mobile) rows.push([t('mobile', 'ar'), mobile]);
  (extraRows || []).forEach((row) => rows.push(row));
  const dateLines = formatBilingualDateLines(dateTime);

  return (
    <section style={{ minWidth: 0, minHeight, background: bg, border: '1px solid ' + PRINT.border, boxShadow: PRINT.shadow, borderRadius: PRINT.radius, overflow: 'hidden', '--pp-row-divider': dividerColor, '--pp-row-bg-even': 'transparent' }}>
      {/* هيدر صلب اللون بارتفاع ثابت - يمنح البطاقة هويتها اللونية الواضحة فورًا (أحمر=مصدر
          دائمًا/أصفر=مستلم دائمًا) ومساحة "تنفّس" كافية للعنوانين العربي والإنجليزي. نفس
          الارتفاع الثابت لكل البطاقات الأربع يضمن محاذاة العناوين على خط أفقي واحد بينها. */}
      {stripColor && (
        <div style={{ minHeight: PRINT.headerHeight, background: stripColor, color: '#fff', padding: '6px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{titleAr}</div>
          {titleEn && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{titleEn}</div>}
        </div>
      )}
      <div style={{ padding: 10 }}>
      <table className="app-table" style={{ marginTop: 0, fontSize: 13 }}>
        <tbody>
          {rows.map(([label, value], idx) => (
            <tr key={idx}>
              <td style={{ fontSize: 12, fontWeight: 600, opacity: 0.75, width: '35%' }}>{label}</td>
              <td style={{ fontSize: 14, fontWeight: 700 }}>{value || '—'}</td>
            </tr>
          ))}
          {dateLines && (
            <tr>
              <td style={{ fontSize: 12, fontWeight: 600, opacity: 0.75 }}>{t('dateTime', 'ar')}</td>
              <td style={{ fontSize: 14, fontWeight: 700 }}>
                {dateLines.gregorian}
                <span style={{ opacity: 0.7, fontWeight: 500 }}> - {dateLines.hijri}</span>
              </td>
            </tr>
          )}
          <tr>
            <td style={{ fontSize: 12, fontWeight: 600, opacity: 0.75 }}>{t('signature', 'ar')}</td>
            <td>
              {signature ? <img src={signature} alt="توقيع" style={{ height: 30 }} /> : '—'}
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>
  );
}
