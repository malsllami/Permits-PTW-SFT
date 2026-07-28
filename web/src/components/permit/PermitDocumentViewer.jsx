import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFullPermitView, sendToReceiver, saveSourceWorkData, saveReceiverSection, approveBySource, closeOrCancelByReceiver, closeBySource,
  initiateReceiverHandover, confirmReceiverHandover, getSecretCodeForSource
} from '../../services/permitsService.js';
import { getAllSettings, getPublicSettings } from '../../services/settingsService.js';
import { useSession } from '../../hooks/useSession.js';
import { requestMandatoryGps } from '../../hooks/useGeolocation.js';
import { ACCESS_MODE, PERMIT_TYPE } from '../../config/constants.js';
import { t } from '../../config/permitLabels.js';
import { sanitizeDigitsOnly, normalizeMixedInput } from '../../hooks/useArabicIndicDigits.js';
import SignaturePad from '../common/SignaturePad.jsx';
import QRCodeView from '../common/QRCodeView.jsx';
import Icon from '../common/Icon.jsx';
import SafetyChecklistSection from './SafetyChecklistSection.jsx';
import SafetyInstructionsPage from './SafetyInstructionsPage.jsx';
import SafetyAcknowledgmentGate from './SafetyAcknowledgmentGate.jsx';
import PermitPrint from './PermitPrint.jsx';
import { computeWorkDurationLabel } from '../../utils/permitFormatting.js';
import { formatDateTimeShort } from '../../hooks/useHijriGregorianDate.js';
import { THEMES, WORK_FIELD_LABEL_BG, WORK_FIELD_LABEL_TEXT } from './permitTheme.js';
import { downloadPermitPdf } from '../../utils/pdfExport.js';
import { WorkField, WorkSelectField, BadgeChipField } from './PermitFormFields.jsx';
import PartySection from './PartySection.jsx';
import PostActionBanner from './PostActionBanner.jsx';
import { WizardStepper, LifecycleTimeline, WizardNav } from './PermitStepperNav.jsx';
import { SharePanel, SummaryTables } from './PermitSummary.jsx';

/**
 * المكوّن المحوري: عرض/تعبئة/توقيع التصريح بكامل بياناته في صفحة/بطاقة واحدة قابلة
 * للتكبير والتصغير وإعادة الضبط، متجاوبة مع اللابتوب والجوال، بلا تبويبات أو صفحات منفصلة.
 * كل قسم (مصدر/مستلم/إغلاق) يُعرض دائمًا ضمن نفس الصفحة، لكن التعديل فيه مقفل إلا
 * خلال مرحلته الفعلية من دورة حياة التصريح، مع ترميز لوني يوضح حالة كل قسم.
 */
export default function PermitDocumentViewer({ creationId, accessMode, currentUser, onRefreshNeeded }) {
  const navigate = useNavigate();
  const { employee } = useSession();
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [formData, setFormData] = useState({});
  const [signature, setSignature] = useState('');
  const [checkedMap, setCheckedMap] = useState({});
  const [sourceChecklistComplete, setSourceChecklistComplete] = useState(false);
  const [receiverChecklistComplete, setReceiverChecklistComplete] = useState(false);
  const [receiverCloseChecklistComplete, setReceiverCloseChecklistComplete] = useState(false);
  const [sourceCloseChecklistComplete, setSourceCloseChecklistComplete] = useState(false);
  // لغة عرض كل بطاقة طرف مستقلة تمامًا عن غيرها (مصدر/مستلم/إغلاق مستلم/إغلاق مصدر) -
  // يختار كل طرف لغته أثناء تعبئة قسمه فقط، دون التأثير على بقية الأقسام؛ تشمل بنود "تأكيد
  // الإجراءات" وتسميات/أزرار بقية بطاقة نفس الطرف (بيانات الموظف والاعتماد والتوقيع).
  const [sourceLang, setSourceLang] = useState('ar');
  const [receiverLang, setReceiverLang] = useState('ar');
  const [receiverCloseLang, setReceiverCloseLang] = useState('ar');
  const [sourceCloseLang, setSourceCloseLang] = useState('ar');
  // إقرار الاطلاع على تعليمات السلامة - بوابة مستقلة لكل مرحلة (مصدر/مستلم/إغلاق مستلم/
  // إغلاق مصدر) تسبق فتح نموذج تلك المرحلة، ولا تُحفظ في الخادم (مجرد بوابة واجهة محلية
  // تُطلب مجددًا عند كل تحميل جديد للصفحة، وليست جزءًا من بيانات التصريح الفعلية).
  const [ackSource, setAckSource] = useState(false);
  const [ackReceiver, setAckReceiver] = useState(false);
  const [ackReceiverClose, setAckReceiverClose] = useState(false);
  const [ackSourceClose, setAckSourceClose] = useState(false);
  const [authorityTypeOptions, setAuthorityTypeOptions] = useState([]);
  const [receiverEntityOptions, setReceiverEntityOptions] = useState([]);
  const [voltageOptions, setVoltageOptions] = useState([]);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [handoverNewReceiverId, setHandoverNewReceiverId] = useState('');
  const [handoverSignature, setHandoverSignature] = useState('');
  const [showHandoverForm, setShowHandoverForm] = useState(false);
  const [sentSecretCode, setSentSecretCode] = useState('');
  const [sentCloseSecretCode, setSentCloseSecretCode] = useState('');
  // أعلام محلية (تخص هذه الجلسة/التحميل فقط، لا تُقرأ من حالة التصريح) لإظهار بانر تأكيد +
  // عودة للرئيسية فور إنجاز إجراء رئيسي لا يستلزم مشاركة رمز سري - لا تُشغَّل عند مجرد إعادة
  // فتح نفس الرابط لاحقًا (خطوة الإغلاق تُفتح مباشرة حينها عبر initialStepSetRef بدل ذلك).
  const [justApprovedNumber, setJustApprovedNumber] = useState(false);
  const [justReceived, setJustReceived] = useState(false);
  const [justClosedFinal, setJustClosedFinal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [companyName, setCompanyName] = useState('');
  // مدة العد التنازلي (ثوانٍ) للعودة التلقائية للرئيسية - قيمة افتراضية 4 ثوانٍ (نفس افتراضي
  // "POST ACTION REDIRECT SECONDS" بالإعدادات) لحين وصول القيمة الفعلية من الخادم؛ 0 يعطّلها.
  const [redirectSeconds, setRedirectSeconds] = useState(4);
  const [shareSecretLoading, setShareSecretLoading] = useState(false);
  // لغة صفحة تعليمات السلامة النهائية - تُضبط فقط عبر زر التبديل في SafetyInstructionsPage
  // نفسها أثناء العرض الفعلي (لا بوابة اختيار منفصلة عند التصدير) - ملف PDF يُصدَّر مباشرة
  // بأي لغة كانت مضبوطة حينها.
  const [printLang, setPrintLang] = useState('ar');
  const [pdfExporting, setPdfExporting] = useState(false);
  // شاشة الإدخال التفاعلية تُقسَّم إلى خطوات (Wizard): بيانات العمل → المصدر → المستلم →
  // مراجعة وإصدار → الإغلاق - كل خطوة تظهر بمفردها بدل استمرار طويل متمرر. تُستخدم فقط
  // أثناء دورة حياة التصريح؛ بعد الإغلاق يُعرض التصريح كاملًا دفعة واحدة (شاشة العرض/الطباعة).
  const [currentStep, setCurrentStep] = useState(0);
  const initialStepSetRef = useRef(false);
  // بعد إغلاق/إلغاء التصريح: شاشة العرض النهائية أيضًا مقسَّمة إلى 4 "صفحات" للتصفح (مطابقة
  // لهيكلة مستند الطباعة PermitPrint) بدل استمرار واحد طويل: 1) بيانات المهمة+المصدر+المستلم
  // 2) الإغلاق  3) رحلة التصريح  4) تعليمات السلامة.
  const [viewPage, setViewPage] = useState(0);

  useEffect(() => {
    getAllSettings().then((rows) => {
      setAuthorityTypeOptions(rows.filter((r) => r.group === 'أنواع الجهة المعنية'));
      setReceiverEntityOptions(rows.filter((r) => r.group === 'أنواع الجهة المستلمة'));
      setVoltageOptions(rows.filter((r) => r.group === 'مستوى الجهد لتصريح PTW'));
    }).catch(() => {});
    // اسم الشركة يُقرأ من "الإعدادات العامة" (وليس نصًا ثابتًا بالكود) ليظهر في رسالة
    // مشاركة واتساب بنفس الاسم المعتمد من لوحة إعدادات المدير.
    getPublicSettings().then((rows) => {
      const row = rows.filter((r) => r.group === 'معلومات النظام' && r.key === 'COMPANY NAME')[0];
      if (row) setCompanyName(row.valueAr);
      const redirectRow = rows.filter((r) => r.group === 'معلومات النظام' && r.key === 'POST ACTION REDIRECT SECONDS')[0];
      if (redirectRow) {
        const n = Number(redirectRow.valueAr);
        setRedirectSeconds(isNaN(n) ? 0 : n);
      }
    }).catch(() => {});
  }, []);


  const load = () => {
    setLoading(true);
    getFullPermitView(creationId)
      .then(setPermit)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [creationId]);

  // مزامنة بنود السلامة المحفوظة فعليًا في الخادم مع الحالة المحلية عند كل تحميل/تحديث -
  // بنود السلامة لم تكن تُرسل للخادم إطلاقًا سابقًا فتُفقد فور تحديث الصفحة أو إغلاق
  // التصريح؛ الدمج (وليس الاستبدال) يحافظ على أي تأشير محلي لم يُحفَظ بعد في نفس الجلسة.
  useEffect(() => {
    if (!permit) return;
    setCheckedMap((prev) => ({ ...(permit.checklistState || {}), ...prev }));
  }, [permit]);

  // يُحسب موضع الخطوة الافتراضي مرة واحدة فقط عند أول تحميل فعلي للتصريح (وليس عند كل
  // إعادة تحميل لاحقة بعد كل إجراء) - حتى لا يُعاد المستخدم قسرًا لخطوة أخرى بعد كل حفظ.
  useEffect(() => {
    if (!permit || initialStepSetRef.current) return;
    initialStepSetRef.current = true;
    const isRecvEditableNow = accessMode === ACCESS_MODE.INTERACTIVE_RECEIVER || accessMode === ACCESS_MODE.ADMIN_FULL;
    let step = 0;
    if (permit.status === 'بانتظار اعتماد المصدر') {
      step = 3; // STEP_ISSUE - مراجعة وتوليد الرقم
    } else if (permit.status === 'بانتظار إغلاق المصدر' || permit.status === 'بانتظار تأكيد الإلغاء من المصدر') {
      step = 4; // STEP_CLOSE - للمصدر إجراء إغلاق نهائي فعلي هنا
    } else if (permit.status === 'نشط') {
      // المستلم لديه إجراء إغلاق/إلغاء فعلي فورًا بمجرد "نشط" فيفتح مباشرة على الإغلاق؛
      // غيره (المصدر مثلًا، قبل أن يُغلق المستلم قسمه) لا إجراء فعلي له بعد، فيبقى بخطوة
      // المراجعة (حيث يظهر رقم التصريح بوضوح) بدل قسم إغلاق فارغ غير قابل للتعديل.
      step = isRecvEditableNow ? 4 : 3;
    } else if (permit.source && permit.source.transferDateTime) {
      step = isRecvEditableNow ? 2 : 3;
    }
    setCurrentStep(step);
  }, [permit, accessMode]);

  // حفظ تلقائي (Autosave) لبيانات العمل أثناء كتابة المصدر لها - قبل الضغط على "مشاركة".
  // بدون هذا كانت البيانات المكتوبة تبقى في الذاكرة فقط وتُفقد لو أُعيد فتح نفس الرابط
  // قبل أن يضغط المصدر زر المشاركة (كانت تُحفظ سابقًا فقط عند sendToReceiver).
  useEffect(() => {
    if (!permit) return;
    const editableNow = (accessMode === ACCESS_MODE.INTERACTIVE_SOURCE || accessMode === ACCESS_MODE.ADMIN_FULL) && !permit.source.transferDateTime;
    if (!editableNow) return;
    if (Object.keys(formData).length === 0) return;
    const timer = setTimeout(() => {
      saveSourceWorkData(creationId, formData).catch(() => {});
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [formData, permit, accessMode, creationId]);

  const isSourceEditable = accessMode === ACCESS_MODE.INTERACTIVE_SOURCE || accessMode === ACCESS_MODE.ADMIN_FULL;
  const isReceiverEditable = accessMode === ACCESS_MODE.INTERACTIVE_RECEIVER || accessMode === ACCESS_MODE.ADMIN_FULL;
  const isSourceCloseEditable = accessMode === ACCESS_MODE.INTERACTIVE_SOURCE_CLOSE || accessMode === ACCESS_MODE.ADMIN_FULL;

  const showFinalInstructions = permit && (permit.status === 'مغلق' || permit.status === 'ملغي');
  // إتاحة تصدير PDF أوسع من "تعليمات السلامة/رحلة التصريح" على الشاشة (التي تبقى خاصة
  // بالتصريح المغلق فعليًا فقط) - أي شخص يفتح رابط/QR التصريح بمجرد توليد رقم التصريح
  // (قبل الإغلاق الكامل) يمكنه تنزيل نسخة PDF كاملة البنية، بأقسام الإغلاق فارغة طبيعيًا
  // (PermitPrint.jsx يعرض "—" لكل حقل غير مكتمل بعد دون أي تعديل مطلوب فيه).
  const canExportPdf = !!(permit && permit.permitNumber);

  async function withGpsAction(action) {
    setBusy(true);
    setError('');
    try {
      const gps = await requestMandatoryGps();
      const result = await action(gps);
      // يُصفَّر التوقيع بعد كل إجراء ناجح - لو بقي توقيع مرحلة سابقة في الذاكرة، كان يمكن
      // الضغط على زر مرحلة لاحقة (مثل الاعتماد) فيُعاد استخدام نفس التوقيع القديم بدل
      // إجبار المستخدم على التوقيع فعليًا في هذه المرحلة الجديدة.
      setSignature('');
      load();
      if (onRefreshNeeded) onRefreshNeeded();
      return result;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const handleSendToReceiver = async () => {
    const result = await withGpsAction((gps) => sendToReceiver(creationId, formData, signature, gps, checkedMap));
    if (result && result.secretCode) setSentSecretCode(result.secretCode);
  };

  // زر "مشاركة" يبقى متاحًا للمصدر في أي وقت لاحق (حتى بعد إغلاق/تحديث الصفحة) - يُعيد
  // جلب الرمز السري الحالي من الخادم بدل الاعتماد فقط على القيمة اللحظية المُعادة عند
  // الإرسال، والتي كانت تختفي نهائيًا بمجرد تحديث الصفحة.
  const handleShowShareInfo = async () => {
    setShareSecretLoading(true);
    setError('');
    try {
      const result = await getSecretCodeForSource(creationId);
      if (result.secretCode) setSentSecretCode(result.secretCode);
      if (result.closeSecretCode) setSentCloseSecretCode(result.closeSecretCode);
    } catch (e) {
      setError(e.message);
    } finally {
      setShareSecretLoading(false);
    }
  };

  /** نص رسالة المشاركة عبر واتساب - الرمز السري لا يُدرج فيه أبدًا (يُبلَّغ شفهيًا فقط). */
  function buildWhatsAppMessage() {
    const lines = [
      (companyName || '') + ' - قسم التصاريح',
      '',
      'نوع التصريح: ' + (permit.permitType === 'PTW' ? 'تصريح العمل (Permit To Work)' : 'تصريح الفحص (Sanction For Testing)'),
      '',
      'بيانات العطل:',
      'الموقع: ' + (permit.location || '—'),
      'الدائرة: ' + (permit.circuit || '—'),
      'الوحدة: ' + (permit.unit || '—'),
      'المحطة: ' + (permit.station || '—'),
      'المغذي: ' + (permit.feeder || '—'),
      'وصف العمل: ' + (permit.workDescription || '—'),
      '',
      'بيانات المصدر:',
      'الرقم الوظيفي: ' + (permit.source.employeeId || '—'),
      'الاسم: ' + (permit.source.fullName || '—'),
      'رقم الجوال: ' + (permit.source.mobile || '—'),
      '',
      'رابط التصريح: ' + permit.permitLink,
      '',
      'تاريخ الإرسال والوقت: ' + (formatDateTimeShort(permit.source.transferDateTime) || '—')
    ];
    return lines.join('\n');
  }

  // بعد إغلاق/إلغاء التصريح (أو لزائر مسح رمز QR لتصريح مغلق) لا يوجد أي زر خروج واضح من
  // شاشة العرض النهائية - موظف مسجَّل دخوله يعود لشاشته الرئيسية، أما زائر مجهول (بلا جلسة،
  // فتح الرابط مباشرة من كاميرا الجوال) فلا "رئيسية" له، فتُغلَق التبويبة نفسها إن أمكن
  // (تعمل غالبًا لتبويبة فتحها المسح مباشرة)، وإلا يُعاد لشاشة الدخول كحل بديل.
  const handleCloseAndReturn = () => {
    if (employee) { navigate('/source/home'); return; }
    window.close();
    navigate('/login');
  };

  const handleShareWhatsApp = () => {
    window.open('https://wa.me/?text=' + encodeURIComponent(buildWhatsAppMessage()), '_blank');
  };
  const handleReceiverSubmit = () => withGpsAction((gps) => saveReceiverSection(creationId, formData, signature, gps, checkedMap)).then(() => setJustReceived(true));
  // توقيع واحد فقط للمصدر طوال دورة حياة التصريح (يُرسم عند التحويل للمستلم) - عند عودة
  // التصريح للمصدر للاعتماد لا يُطلب توقيع جديد، بل يُعاد استخدام نفس التوقيع المحفوظ.
  // بعد الاعتماد وتوليد رقم التصريح يبقى المصدر ظاهريًا على خطوة المراجعة (حيث يظهر رقم
  // التصريح بوضوح) - بانر تأكيد + عودة تلقائية للرئيسية (PostActionBanner) بدل القفز الفوري
  // لقسم إغلاق غير قابل للتعديل بعد (لا صلاحية INTERACTIVE_SOURCE_CLOSE قبل أن يُغلق المستلم قسمه).
  const handleApprove = () => withGpsAction((gps) => approveBySource(creationId, permit.source.transferSignature, gps)).then(() => setJustApprovedNumber(true));
  const handleReceiverClose = async (action) => {
    const result = await withGpsAction((gps) => closeOrCancelByReceiver(creationId, action, signature, gps, action === 'CANCEL' ? cancelReason : '', checkedMap));
    if (result && result.secretCode) setSentCloseSecretCode(result.secretCode);
  };
  const copyPermitLink = () => {
    navigator.clipboard.writeText(permit.permitLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };
  const handleSourceClose = () => withGpsAction((gps) => closeBySource(creationId, signature, gps, checkedMap)).then(() => setJustClosedFinal(true));
  const handleInitiateHandover = () => withGpsAction((gps) => initiateReceiverHandover(creationId, handoverNewReceiverId, handoverSignature, gps));
  const handleConfirmHandover = () => withGpsAction((gps) => confirmReceiverHandover(permit.pendingHandover.transferId, handoverSignature, gps));

  // تنزيل PDF مباشر بلا أي بوابة اختيار لغة عند التصدير - العرض هو نفسه دائمًا (لا تغيير
  // بصري حقيقي عند تبديل اللغة سوى نص تعليمات السلامة النهائية)، وتغيير اللغة يبقى متاحًا
  // فقط أثناء سير مراحل التصريح نفسه (زر تبديل مستقل لكل قسم - انظر SafetyChecklistSection/
  // SafetyInstructionsPage)، فيُصدَّر الملف مباشرة بأي لغة كانت مضبوطة حينها (printLang).
  const handleDownloadPdf = async () => {
    setPdfExporting(true);
    setError('');
    try {
      const fileName = 'تصريح-' + (permit.permitNumber || permit.creationId) + '.pdf';
      await downloadPermitPdf(fileName);
    } catch (e) {
      setError('تعذّر تصدير ملف PDF: ' + e.message);
    } finally {
      setPdfExporting(false);
    }
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>جارٍ التحميل...</div>;
  if (!permit) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-error)' }}>{error || 'تعذّر تحميل التصريح.'}</div>;

  const sourceSectionEditable = isSourceEditable && !permit.source.transferDateTime;
  // قسم المصدر يبقى أحمر دائمًا كلون مميّز ثابت لهذا القسم (كما في النموذج الورقي) - لا
  // يتحول لأخضر كامل حتى بعد اكتمال البيانات؛ فقط بنود السلامة وزر الإجراء يتحولان
  // لأخضر عند اكتمالها (انظر SafetyChecklistSection وأزرار القسم أدناه).
  const sourceTheme = THEMES.red;

  const receiverReceiveEditable = isReceiverEditable && !permit.receiver.receiveDateTime;
  // يظهر القسم فقط بعد أن يُحوّل المصدر التصريح فعليًا - وليس بمجرد كون accessMode
  // تفاعليًا (كان هذا يُظهر قسم المستلم قبل أوانه للمدير Admin_FULL أثناء مرحلة المصدر).
  const showReceiverReceiveSection = !!permit.source.transferDateTime;

  const receiverCloseEditable = isReceiverEditable && permit.status === 'نشط' && !permit.receiver.closeDateTime;
  const showReceiverCloseSection = permit.receiver.receiveDateTime && (
    permit.status === 'نشط' ||
    permit.status === 'بانتظار إغلاق المصدر' ||
    permit.status === 'بانتظار تأكيد الإلغاء من المصدر' ||
    permit.status === 'مغلق' ||
    permit.status === 'ملغي'
  );

  const sourceCloseEditable = isSourceCloseEditable && !permit.closingSource.closeDateTime;
  const showSourceCloseSection = permit.status === 'بانتظار إغلاق المصدر' || permit.status === 'بانتظار تأكيد الإلغاء من المصدر' || permit.closingSource.closeDateTime;
  // إغلاق المصدر النهائي بنفس الأحمر الثابت لهوية "المصدر" دائمًا (وليس أخضر مستقل) - طلب
  // صريح: الهوية اللونية تتبع الطرف الذي يتصرف (مصدر=أحمر دائمًا، مستلم=أصفر فاتح دائمًا)
  // بغض النظر عن كون الإجراء إصدارًا أو إغلاقًا.
  const sourceCloseTheme = THEMES.red;

  // شاشة الإدخال التفاعلية (Wizard) تظهر فقط لصاحب دور تفاعلي حقيقي (مصدر/مستلم/مدير) أثناء
  // دورة حياة التصريح - أي زائر آخر (بلا رقم وظيفي، أو مسجَّل لكن غير مخوَّل لهذه المرحلة/بلا
  // الرمز السري الصحيح) يبقى READ_ONLY ويرى شاشة العرض الكاملة (شكل مستند) بغض النظر عن حالة
  // التصريح، فتُظهر له في أي مرحلة يقف التصريح دون منحه واجهة تفاعلية لا يملك صلاحية إجراء فيها.
  const isInteractiveRole = (
    accessMode === ACCESS_MODE.INTERACTIVE_SOURCE ||
    accessMode === ACCESS_MODE.INTERACTIVE_RECEIVER ||
    accessMode === ACCESS_MODE.INTERACTIVE_SOURCE_CLOSE ||
    accessMode === ACCESS_MODE.ADMIN_FULL
  );
  const wizardMode = isInteractiveRole && !showFinalInstructions;
  const STEP_WORK = 0, STEP_SOURCE = 1, STEP_RECEIVER = 2, STEP_ISSUE = 3, STEP_CLOSE = 4;
  const showStep = (n) => !wizardMode || currentStep === n;
  // مسؤولية التصريح تنتقل فعليًا من المصدر للمستلم بمجرد توليد رقم التصريح (خطوة المراجعة
  // تصبح أصفر بدل أحمر)، وتبقى أصفر طوال خطوة الإغلاق أيضًا لأن المستلم هو أول من يُغلق/
  // يُلغي قسمه - تتحول أحمر فقط في اللحظة التي يصل فيها الدور فعليًا للمصدر لإتمام
  // الإغلاق النهائي (بانتظار إغلاق المصدر/تأكيد الإلغاء، أو بعد الإغلاق الكامل).
  const closeStepIsSourceTurn = permit.status === 'بانتظار إغلاق المصدر' || permit.status === 'بانتظار تأكيد الإلغاء من المصدر' ||
    permit.status === 'مغلق' || permit.status === 'ملغي';
  const STEP_DEFS = [
    { key: STEP_WORK, label: t('workData', 'ar'), color: 'var(--color-primary)' },
    { key: STEP_SOURCE, label: 'المصدر', color: THEMES.red.border },
    { key: STEP_RECEIVER, label: 'المستلم', color: THEMES.yellow.border },
    { key: STEP_ISSUE, label: 'مراجعة', color: permit.permitNumber ? THEMES.yellow.border : THEMES.red.border },
    { key: STEP_CLOSE, label: 'الإغلاق', color: closeStepIsSourceTurn ? THEMES.red.border : THEMES.yellow.border }
  ];
  // لون الهيدر العلوي الملوّن بالكامل - بلون خطوة الويزار الحالية أثناء دورة الحياة، أو
  // بلون الأزرق الأساسي بعد الإغلاق (شاشة العرض/الطباعة النهائية لا ترتبط بخطوة معيّنة).
  const headerColor = wizardMode ? STEP_DEFS[currentStep].color : 'var(--color-navbar)';
  // عنوان الهيدر يواكب رحلة التصريح الفعلية بدل نص ثابت طوال الوقت - ثلاث حالات فقط: إنشاء
  // (قبل توليد الرقم) ← جاري تنفيذ العمل (بعد التوليد، قبل الوصول فعليًا لخطوة الإغلاق) ←
  // إغلاق التصريح (بمجرد الدخول لخطوة الإغلاق، سواء من المستلم أو المصدر).
  const wizardTitle = currentStep === STEP_CLOSE
    ? 'إغلاق التصريح'
    : permit.permitNumber
      ? 'جاري تنفيذ العمل'
      : (permit.permitType === 'PTW' ? 'إنشاء تصريح عمل كهربائي' : 'إنشاء تصريح تعميد بالاختبار');
  // سهم الرجوع بالهيدر: خطوة سابقة إن أمكن، وإلا رجوع فعلي في المتصفح (للوصول من الرابط
  // المباشر/QR دون تاريخ تصفح داخل الموقع، بدل توجيه ثابت لصفحة واحدة قد لا تناسب السياق).
  const handleHeaderBack = () => {
    if (wizardMode && currentStep > 0) { setCurrentStep(currentStep - 1); return; }
    if (!wizardMode && viewPage > 0) { setViewPage(viewPage - 1); return; }
    navigate(-1);
  };

  // تصفح 4 صفحات لشاشة العرض النهائية (بعد الإغلاق/الإلغاء فقط) - في وضع الويزار
  // (أثناء دورة الحياة) تبقى كل الصفحات "ظاهرة" دومًا (showView تُعيد true) لأن التصفح
  // هنا غير ذي معنى؛ التقسيم الفعلي يُطبَّق فقط عندما !wizardMode.
  const VIEW_PAGE_WORK = 0, VIEW_PAGE_CLOSE = 1, VIEW_PAGE_JOURNEY = 2, VIEW_PAGE_SAFETY = 3;
  // زائر غير مخوَّل (بلا رقم وظيفي، أو مسجَّل لكن غير المصدر/المستلم المعنيَّين) يفتح الرابط
  // قبل توليد رقم تصريح العمل فعليًا (أي قبل اعتماد المصدر) - لا يوجد بعد مستند فعلي ذو معنى
  // ليُعرَض له، فتُظهر له بطاقة حالة مختصرة فقط ("قيد الإنشاء") بدل قسم بقسم فارغ/غير مكتمل.
  const showCreationPendingCard = !wizardMode && !isInteractiveRole && !permit.permitNumber;
  const showView = (n) => !showCreationPendingCard && (wizardMode || viewPage === n);
  const VIEW_PAGE_DEFS = [
    { key: VIEW_PAGE_WORK, label: 'بيانات المهمة', color: 'var(--color-primary)' },
    { key: VIEW_PAGE_CLOSE, label: 'الإغلاق', color: THEMES.red.border },
    { key: VIEW_PAGE_JOURNEY, label: 'رحلة التصريح', color: 'var(--color-secondary)' },
    { key: VIEW_PAGE_SAFETY, label: 'تعليمات السلامة', color: THEMES.neutral.border }
  ];

  return (
    <>
    {/* الشاشة التفاعلية/شاشة العرض بالكامل لا تنتمي لمستند الطباعة/PDF إطلاقًا - "screen-only"
        تُخفيها تمامًا عند الطباعة (بدل الاعتماد على تنسيقات طباعة مبعثرة داخلها)، بينما
        مستند الطباعة الفعلي هو PermitPrint وحده أدناه، مكوّن مستقل تمامًا بذاته. */}
    {/* شاشة الإدخال/الاستلام/الإغلاق تبقى بعرض جوال ثابت دائمًا (Mobile First حرفيًا، بلا
        نمو مع الشاشات الكبيرة) - أما شاشة العرض النهائية بعد الإغلاق فمتجاوبة بالكامل
        (responsive-shell) لأن كثيرًا من المشرفين يفتحونها من اللابتوب، حسب القرار المعتمد. */}
    {/* شاشة الإنشاء/الاستلام/الإغلاق التفاعلية أصبحت تتوسّع على الشاشات الكبيرة أيضًا
        (إلغاء للقرار السابق بإبقائها Mobile First دائمًا، بطلب صريح لاحق) - نفس صنف
        "responsive-shell" المستخدَم في شاشة العرض النهائية، بلا أي تكبير لمقاسات العناصر
        نفسها (الأزرار/الحقول تبقى بنفس الارتفاع الثابت دائمًا) - فقط عرض الحاوية يكبر. */}
    <div className="screen-only responsive-shell">
      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', background: '#fff' }}>
        {/* هيدر ملوّن بالكامل حسب الخطوة الحالية - سهم رجوع + عنوان التصريح + مستوى الجهد +
            دوائر خطوات الويزار مدمجة بداخله (شاشة تطبيق جوال حقيقية، بدل مستند A4 مصغّر).
            يظهر فقط أثناء دورة الحياة التفاعلية (الإصدار/الاستلام/الإغلاق). */}
        {wizardMode && (
          <div style={{ background: headerColor, color: '#fff', padding: '10px 14px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button" onClick={handleHeaderBack} className="no-print"
                style={{ background: 'transparent', color: '#fff', fontSize: 20, padding: '0 4px', minHeight: 0, lineHeight: 1 }}
                aria-label="رجوع"
              >‹</button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                {/* شارة نوع التصريح - أزرق لـPTW وتركواز لـSFT، هوية بصرية ثابتة في كل الشاشات (قسم 11/15 بدليل التصميم) */}
                <div style={{ fontSize: 10, fontWeight: 'bold', opacity: 0.85, letterSpacing: 0.5 }}>{permit.permitType}</div>
                <div style={{ fontWeight: 'bold', fontSize: 15, lineHeight: 1.3 }}>
                  {wizardTitle}
                  {permit.voltageLevel && <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.9 }}> · {permit.voltageLevel}</span>}
                </div>
              </div>
              <span style={{ width: 20 }} />
            </div>
            <WizardStepper steps={STEP_DEFS} currentStep={currentStep} onStepClick={(s) => { if (s <= currentStep) setCurrentStep(s); }} light />
          </div>
        )}

        {/* هيدر شاشة العرض النهائي (بعد الإغلاق/الإلغاء) - خلفية بيضاء محايدة بلا سهم رجوع
            ولا تلوين بلون دور معيّن (المستند مكتمل، يخص الجميع)، يضم الشعار وعنوان التصريح
            والجهد، ثم شريط QR/رقم التصريح/رقم البرنامج/مدة العمل مدمجًا داخله مباشرة، ثم
            مؤشر تصفح الصفحات الأربع (حسب المواصفة المعتمدة لشاشة العرض النهائي فقط). */}
        {!wizardMode && (
          <div style={{ background: '#fff', padding: '18px 16px 14px', boxSizing: 'border-box', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/Permits-PTW-SFT/logo.png" alt="الشعار" style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--color-primary)', opacity: 0.85, letterSpacing: 0.5 }}>{permit.permitType}</div>
                <div style={{ fontWeight: 'bold', fontSize: 18, lineHeight: 1.3, color: 'var(--color-text)' }}>
                  {permit.permitType === 'PTW' ? 'تصريح عمل كهربائي' : 'تصريح تعميد بالاختبار'}
                  {permit.voltageLevel && <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.75 }}> · {permit.voltageLevel}</span>}
                </div>
              </div>
            </div>

            {!showCreationPendingCard && (permit.operationalProgramNumber || permit.permitNumber) && (
              <div style={{ marginTop: 14 }}>
                {/* رقم التصريح بعرض كامل بسطره الخاص (لا يتشارك المساحة مع QR) - يتسع للرقم
                    كاملًا بلا اقتطاع بصري حتى مع الصيغة الأطول (تاريخ+رموز مفصولة بـ|). رقم
                    البرنامج التشغيلي لم يعد يظهر هنا (مكانه فقط داخل "بيانات المهمة" أدناه
                    لتفادي التكرار)، فيتبقى QR ومدة العمل فقط أسفل صندوق الرقم. */}
                <div style={{ background: 'var(--color-bg-permit-number)', color: 'var(--color-success)', border: '1.5px solid var(--color-success)', borderRadius: 8, padding: '4px 8px' }}>
                  <div style={{ fontWeight: 'bold', opacity: 0.85, fontSize: 11 }}>{t('permitNumber', 'ar')}</div>
                  <strong style={{ display: 'block', fontSize: 12, direction: 'ltr', whiteSpace: 'nowrap', overflowX: 'auto' }}>{permit.permitNumber || '—'}</strong>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
                  <QRCodeView link={permit.permitLink} size={64} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 11 }}>
                    <div style={{ opacity: 0.65 }}>{t('workDuration', 'ar')}</div>
                    <div style={{ fontWeight: 'bold' }}>{computeWorkDurationLabel(permit.source.approvalDateTime, permit.closingSource.closeDateTime) || '—'}</div>
                  </div>
                </div>
              </div>
            )}

            {!showCreationPendingCard && (
              <div style={{ marginTop: 14 }}>
                <WizardStepper steps={VIEW_PAGE_DEFS} currentStep={viewPage} onStepClick={(s) => setViewPage(s)} freeNav />
              </div>
            )}
          </div>
        )}

        <div style={{ padding: 14, background: 'var(--color-background)' }}>
          {/* بطاقة "قيد الإنشاء" - لزائر غير مخوَّل يفتح الرابط قبل توليد رقم التصريح فعليًا؛
              تحل محل كل أقسام المستند (المخفية جميعها تلقائيًا عبر showView أعلاه) ببطاقة
              حالة مختصرة واحدة فقط، بدل صفحة شبه فارغة بأقسام متفرقة غير مكتملة بعد. */}
          {showCreationPendingCard && (
            <div className="app-card" style={{ textAlign: 'center', padding: 24 }}>
              <Icon name="hourglass_top" size={36} color="var(--color-primary)" />
              <div style={{ fontWeight: 'bold', fontSize: 15, marginTop: 10 }}>التصريح غير صالح للاستخدام حالياً</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="lock" size={14} /> لم يتم إصدار رقم تصريح العمل حتى الآن.
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>لا يمكن التحقق من هذا التصريح قبل إصدار رقم التصريح واعتماده رسميًا.</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 12, color: 'var(--color-primary)' }}>الحالة الحالية: قيد الإنشاء</div>
            </div>
          )}

          {/* شريط المعلومات (QR + رقم البرنامج التشغيلي + مدة العمل + رقم التصريح) أثناء
              دورة الحياة التفاعلية فقط - في شاشة العرض النهائي أصبح مدمجًا داخل الهيدر
              الأبيض أعلاه مباشرة (بدل تكراره مرتين). */}
          {wizardMode && (permit.operationalProgramNumber || permit.permitNumber) && (
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 10, marginBottom: 14, boxSizing: 'border-box' }}>
              {/* رقم التصريح بعرض كامل بسطره الخاص - لا يتشارك المساحة مع QR (انظر الملاحظة
                  المطابقة أعلى هيدر شاشة العرض النهائي). رقم البرنامج التشغيلي لم يعد يظهر
                  هنا (مكانه فقط داخل "بيانات المهمة" أدناه). */}
              <div style={{ background: 'var(--color-bg-permit-number)', color: 'var(--color-success)', border: '1.5px solid var(--color-success)', borderRadius: 8, padding: '4px 8px' }}>
                <div style={{ fontWeight: 'bold', opacity: 0.85, fontSize: 11 }}>{t('permitNumber', 'ar')}</div>
                <strong style={{ display: 'block', fontSize: 12, direction: 'ltr', whiteSpace: 'nowrap', overflowX: 'auto' }}>{permit.permitNumber || '—'}</strong>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
                <QRCodeView link={permit.permitLink} size={64} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 11 }}>
                  <div style={{ opacity: 0.65 }}>{t('workDuration', 'ar')}</div>
                  <div style={{ fontWeight: 'bold' }}>{computeWorkDurationLabel(permit.source.approvalDateTime, permit.closingSource.closeDateTime) || '—'}</div>
                </div>
              </div>
            </div>
          )}
          {/* مراحل حياة التصريح - شريط زمني بالأيقونات والتواريخ، يظهر في كل الأحوال */}
          {/* بعد الإغلاق تصبح "رحلة حياة التصريح" جزءًا من صفحة العرض الثالثة تحديدًا (رحلة
              التصريح) بدل ظهورها دومًا فوق كل الصفحات؛ أثناء الويزار التفاعلي تبقى ظاهرة
              دائمًا كما كانت (showView تُعيد true تلقائيًا عندما wizardMode). */}
          {showView(VIEW_PAGE_JOURNEY) && <LifecycleTimeline permit={permit} />}

          {/* 1) بيانات العمل - تظهر في خطوتها أثناء الويزار، وكتذكير عند خطوة المراجعة، أو في
              "صفحة 1" من شاشة العرض النهائية بعد الإغلاق. */}
          <section style={{ marginTop: 8, background: 'var(--color-bg-work)', border: 'var(--border-width) solid #A9C8F2', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: (wizardMode ? (showStep(STEP_WORK) || showStep(STEP_ISSUE)) : showView(VIEW_PAGE_WORK)) ? undefined : 'none' }}>
            {/* هيدر صلب موحّد مع بطاقات الأطراف (المصدر/المستلم/الإغلاق) - نفس الارتفاع/الأيقونة/
                نمط العنوان، بلون النظام الأزرق الأساسي بدل عنوان نصي عادي على خلفية القسم فقط. */}
            <div className="party-section-title" style={{
              background: 'var(--color-primary)', color: '#fff', minHeight: 'var(--size-card-header-height)',
              padding: '0 20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 10, boxSizing: 'border-box'
            }}>
              <Icon name="assignment" size={22} />
              <div style={{ fontSize: 'var(--fs-card-title)' }}>{t('workData', 'ar')}</div>
            </div>
            <div style={{ padding: 20 }}>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <WorkField
                label={t('operationalProgramNumber', 'ar')}
                value={permit.operationalProgramNumber}
                editable={sourceSectionEditable}
                onChange={(v) => setFormData((f) => ({ ...f, operationalProgramNumber: v }))}
                full
              />
            </div>
            {permit.permitType === PERMIT_TYPE.SFT && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8, marginTop: 8, fontSize: 12 }}>
                <WorkField label={t('testType', 'ar')} value={permit.testType} editable={sourceSectionEditable} onChange={(v) => setFormData((f) => ({ ...f, testType: v }))} />
                <WorkField label={t('testEquipmentName', 'ar')} value={permit.testEquipmentName} editable={sourceSectionEditable} onChange={(v) => setFormData((f) => ({ ...f, testEquipmentName: v }))} />
              </div>
            )}
            {/* مستوى الجهد (PTW فقط) - يُدخَل هنا ضمن بيانات العمل بدل اختياره مسبقًا عند
                الإنشاء، فلا يظهر شيء لم يُدخله المصدر بعد (قسم 10 بدليل التصميم). */}
            {permit.permitType === PERMIT_TYPE.PTW && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <WorkSelectField
                  label={t('voltageLevel', 'ar')}
                  value={permit.voltageLevel}
                  editable={sourceSectionEditable}
                  onChange={(v) => setFormData((f) => ({ ...f, voltageLevel: v }))}
                  options={voltageOptions}
                />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, fontSize: 12 }}>
              <WorkField label={t('location', 'ar')} value={permit.location} editable={sourceSectionEditable} onChange={(v) => setFormData((f) => ({ ...f, location: v }))} />
              <WorkField label={t('circuit', 'ar')} value={permit.circuit} editable={sourceSectionEditable} onChange={(v) => setFormData((f) => ({ ...f, circuit: v }))} />
              <WorkField label={t('unit', 'ar')} value={permit.unit} editable={sourceSectionEditable} onChange={(v) => setFormData((f) => ({ ...f, unit: v }))} />
              <WorkField label={t('station', 'ar')} value={permit.station} editable={sourceSectionEditable} onChange={(v) => setFormData((f) => ({ ...f, station: v }))} />
              <WorkField label={t('feeder', 'ar')} value={permit.feeder} editable={sourceSectionEditable} onChange={(v) => setFormData((f) => ({ ...f, feeder: v }))} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <WorkField label={t('workDescription', 'ar')} value={permit.workDescription} editable={sourceSectionEditable} onChange={(v) => setFormData((f) => ({ ...f, workDescription: v }))} full />
              {/* نقاط العزل ومفاتيح المصدر تُعرض كـ Badges منفصلة (وليس نصًا حرًا متصلًا في
                  حقل واحد) حسب دليل التصميم - كل نقطة/مفتاح عنصر مستقل يُضاف ويُحذف بمفرده. */}
              <BadgeChipField label={t('isolationPoints', 'ar')} value={permit.isolationPoints} editable={sourceSectionEditable} onChange={(v) => setFormData((f) => ({ ...f, isolationPoints: v }))} full />
            </div>
            </div>
          </section>
          {wizardMode && showStep(STEP_WORK) && (
            <WizardNav onNext={() => setCurrentStep(STEP_SOURCE)} />
          )}

          {/* قسما المصدر والمستلم يظهران جنبًا إلى جنب من عرض اللابتوب فأعلى - في شاشة العرض
              النهائية دائمًا، أو أثناء الويزار تحديدًا فقط بخطوة "مراجعة" (STEP_ISSUE) حيث
              يظهر القسمان معًا فعليًا كتذكير؛ في بقية خطوات الويزار يظهر قسم واحد فقط في كل
              مرة فيبقى عمودًا واحدًا (لا فائدة من شبكة عمودين وأحدهما فارغ/مخفي). */}
          <div className={(!wizardMode || currentStep === STEP_ISSUE) ? 'responsive-grid-2col-lg' : undefined}>
          {/* 2) قسم المصدر: أحمر حتى تُستكمل بنود السلامة ثم يتحول أخضر - بوابة إقرار الاطلاع
              على تعليمات السلامة تسبق فتح القسم فعليًا لأول مرة، وتختفي بعد تأكيدها لهذا القسم. */}
          <div style={{ display: (wizardMode ? (showStep(STEP_SOURCE) || showStep(STEP_ISSUE)) : showView(VIEW_PAGE_WORK)) ? undefined : 'none' }}>
          {sourceSectionEditable && !ackSource ? (
            <SafetyAcknowledgmentGate permitType={permit.permitType} onAcknowledge={() => setAckSource(true)} />
          ) : (
          <PartySection
            title="بيانات المصدر / Issuer Data"
            theme={sourceTheme}
            lang={sourceLang}
            /* بنود السلامة تظهر فقط عند الإصدار الفعلي (خطوة المصدر) وعند الإغلاق - لا تُعاد
               بلا داعٍ كبطاقة تذكيرية عند خطوة "مراجعة واعتماد" (STEP_ISSUE) حيث كل ما
               يحتاجه المصدر هناك هو توليد الرقم فقط، لا مراجعة بنود سبق تأكيدها بالفعل. */
            checklist={wizardMode && currentStep === STEP_ISSUE ? null : (
              <SafetyChecklistSection
                permitType={permit.permitType}
                stage="المصدر"
                checkedMap={checkedMap}
                readOnly={!sourceSectionEditable}
                onToggle={(row, v) => setCheckedMap((m) => ({ ...m, [row]: v }))}
                onCompletionChange={setSourceChecklistComplete}
                lang={sourceLang}
                onLangChange={setSourceLang}
                forceOpen={!wizardMode}
              />
            )}
            employeeId={permit.source.employeeId}
            fullName={permit.source.fullName}
            mobile={permit.source.mobile}
            cardRemainingDays={permit.source.cardRemainingDays}
            cardExpiry={permit.source.cardExpiry}
            dateTime={permit.source.transferDateTime}
            gps={permit.source.transferGps}
            savedSignature={permit.source.transferSignature}
            editable={sourceSectionEditable}
            signature={signature}
            onSignatureChange={setSignature}
            extraFields={[
              { label: t('sourceLockNumber', sourceLang), value: permit.sourceLockNumber, onChange: (v) => setFormData((f) => ({ ...f, sourceLockNumber: v })), icon: <Icon name="lock" size={12} /> },
              { label: t('authorityOfficialName', sourceLang), value: permit.authorityOfficialName, onChange: (v) => setFormData((f) => ({ ...f, authorityOfficialName: v })), icon: <Icon name="person" size={12} /> },
              {
                label: t('authorityType', sourceLang), value: permit.authorityType,
                onChange: (v) => setFormData((f) => ({ ...f, authorityType: v })),
                type: 'select', options: authorityTypeOptions, icon: <Icon name="domain" size={12} />
              }
            ]}
          >
            {sourceSectionEditable && (
              <button
                disabled={busy || !signature || !sourceChecklistComplete} onClick={handleSendToReceiver}
                style={{ marginTop: 10, color: '#fff', background: sourceChecklistComplete ? 'var(--color-secondary)' : 'var(--color-primary)' }}
              >
                {/* الزر يبقى معطّلًا لثوانٍ فعليًا أثناء تحديد GPS الدقيق (إلزامي، بلا تخزين
                    مؤقت - قرار صريح) - نص "جارٍ..." يوضّح أن الضغطة سُجِّلت وأن العملية قيد
                    التنفيذ فعلًا، بدل أن يبدو الزر بلا أي استجابة أثناء الانتظار. لا يُفعَّل
                    إطلاقًا قبل اكتمال كل بنود "تأكيد الإجراءات" الإلزامية. */}
                {busy ? t('locatingAndSending', sourceLang) : (!sourceChecklistComplete ? t('completeActionsFirst', sourceLang) : t('shareWithReceiver', sourceLang))}
              </button>
            )}
            {/* زر دائم لإعادة عرض بيانات المشاركة (الرابط + الرمز السري) في أي وقت لاحق -
                حتى بعد إغلاق/تحديث الصفحة، بعكس البانر اللحظي الذي يظهر مرة واحدة فقط
                عند الإرسال ثم يختفي نهائيًا إن أُغلقت الصفحة. */}
            {!sourceSectionEditable && permit.source.transferDateTime && !sentSecretCode && (isSourceEditable || accessMode === ACCESS_MODE.ADMIN_FULL) && (
              <button disabled={shareSecretLoading} onClick={handleShowShareInfo} className="no-print secondary" style={{ marginTop: 10 }}>
                {shareSecretLoading ? t('processing', sourceLang) : t('showShareInfo', sourceLang)}
              </button>
            )}
            {sentSecretCode && (
              <>
                <SharePanel
                  permitLink={permit.permitLink}
                  secretCode={sentSecretCode}
                  secretNote="لا تُرسل هذا الرمز ولا رقم البرنامج التشغيلي ضمن رسالة المشاركة - أبلغهما للمستلم الفعلي شفهيًا (هاتفيًا) فقط، وليس ضمن الرابط نفسه."
                  onCopy={copyPermitLink}
                  copied={linkCopied}
                />
                <button onClick={handleShareWhatsApp} className="no-print" style={{ marginTop: 8, background: '#25D366', color: '#fff' }}>
                  {t('shareViaWhatsapp', sourceLang)}
                </button>
                {/* بعد مشاركة الرمز السري، لا يبقى المصدر عالقًا هنا - زر رئيسية يدوي فقط
                    (بلا عدّاد تلقائي) حتى يتمكّن من نسخ/مشاركة الرمز فعليًا قبل المغادرة. */}
                <PostActionBanner message="تم تحويل التصريح للمستلم بنجاح." autoRedirectSeconds={0} />
              </>
            )}
            {isSourceEditable && permit.status === 'بانتظار اعتماد المصدر' && (
              <button className="primary" disabled={busy || !permit.source.transferSignature} onClick={handleApprove} style={{ marginTop: 10 }}>{busy ? t('processing', sourceLang) : t('reviewApproveGenerate', sourceLang)}</button>
            )}
            {justApprovedNumber && (
              <PostActionBanner message="تم توليد رقم التصريح بنجاح." autoRedirectSeconds={redirectSeconds} />
            )}
          </PartySection>
          )}
          </div>

          {/* 3) قسم استلام المستلم - أصفر، يظهر فقط بعد تحويل المصدر للتصريح أو لمن هو مستلم/مدير */}
          <div style={{ display: (wizardMode ? (showStep(STEP_RECEIVER) || showStep(STEP_ISSUE)) : showView(VIEW_PAGE_WORK)) ? undefined : 'none' }}>
          {showReceiverReceiveSection && (
            receiverReceiveEditable && !ackReceiver ? (
              <SafetyAcknowledgmentGate permitType={permit.permitType} onAcknowledge={() => setAckReceiver(true)} />
            ) : (
            <PartySection
              title="بيانات المستلم (الاستلام) / Receiver Data"
              theme={THEMES.yellow}
              lang={receiverLang}
              checklist={wizardMode && currentStep === STEP_ISSUE ? null : (
                <SafetyChecklistSection
                  permitType={permit.permitType}
                  stage="المستلم"
                  checkedMap={checkedMap}
                  readOnly={!receiverReceiveEditable}
                  onToggle={(row, v) => setCheckedMap((m) => ({ ...m, [row]: v }))}
                  onCompletionChange={setReceiverChecklistComplete}
                  lang={receiverLang}
                  onLangChange={setReceiverLang}
                  forceOpen={!wizardMode}
                />
              )}
              /* قبل تأكيد الاستلام فعليًا، سجلّ "المستلم" بالتصريح نفسه لا يزال فارغًا في
                 الخادم (لم يُكتب بعد) - تُعرض بيانات المستخدم الحالي (currentUser، من
                 جلسة الوصول للرابط) بدلًا منها مؤقتًا، وإلا تظهر بطاقة الموظف فارغة تمامًا
                 حتى لو كان المستلم موظفًا حقيقيًا معروفًا (وحتى لو كان نفس شخص المصدر). */
              employeeId={receiverReceiveEditable ? (currentUser ? currentUser.employeeId : '') : permit.receiver.employeeId}
              fullName={receiverReceiveEditable ? (currentUser ? currentUser.fullName : '') : permit.receiver.fullName}
              mobile={receiverReceiveEditable ? (currentUser ? currentUser.mobile : '') : permit.receiver.mobile}
              cardRemainingDays={receiverReceiveEditable ? (currentUser ? currentUser.receiverCardRemainingDays : '') : permit.receiver.cardRemainingDays}
              cardExpiry={receiverReceiveEditable ? (currentUser ? currentUser.receiverCardExpiry : '') : permit.receiver.cardExpiry}
              dateTime={permit.receiver.receiveDateTime}
              gps={permit.receiver.receiveGps}
              savedSignature={permit.receiver.receiveSignature}
              editable={receiverReceiveEditable}
              signature={signature}
              onSignatureChange={setSignature}
              extraFields={[
                { label: t('receiverLockNumber', receiverLang), value: permit.receiverLockNumber, onChange: (v) => setFormData((f) => ({ ...f, receiverLockNumber: v })), icon: <Icon name="lock" size={12} /> },
                {
                  label: t('receiverEntityType', receiverLang), value: permit.receiverEntityType,
                  onChange: (v) => setFormData((f) => ({ ...f, receiverEntityType: v })),
                  type: 'select', options: receiverEntityOptions, icon: <Icon name="domain" size={12} />
                }
              ]}
            >
              {receiverReceiveEditable && (
                <button className="primary" disabled={busy || !signature || !receiverChecklistComplete} onClick={handleReceiverSubmit} style={{ marginTop: 10 }}>
                  {busy ? t('processing', receiverLang) : (!receiverChecklistComplete ? t('completeActionsFirst', receiverLang) : t('confirmReceiveSign', receiverLang))}
                </button>
              )}
              {justReceived && (
                <PostActionBanner message="تم تأكيد الاستلام بنجاح." autoRedirectSeconds={redirectSeconds} />
              )}
            </PartySection>
            )
          )}
          </div>
          </div>
          {wizardMode && showStep(STEP_SOURCE) && (
            <WizardNav onBack={() => setCurrentStep(STEP_WORK)} />
          )}
          {wizardMode && showStep(STEP_RECEIVER) && (
            <WizardNav onBack={() => setCurrentStep(STEP_SOURCE)} />
          )}
          {wizardMode && showStep(STEP_ISSUE) && (
            <WizardNav onBack={() => setCurrentStep(STEP_RECEIVER)} />
          )}
          {/* تنقّل صفحات شاشة العرض النهائية: من "صفحة 1: بيانات المهمة" إلى "صفحة 2: الإغلاق" */}
          {!wizardMode && showView(VIEW_PAGE_WORK) && (
            <WizardNav onNext={() => setViewPage(VIEW_PAGE_CLOSE)} />
          )}

          {/* تأكيد نقل التصريح لمستلم جديد (وردية) - يظهر فقط للمستلم الجديد المُسمّى في طلب نقل بانتظار التأكيد */}
          {permit.pendingHandover && currentUser && String(permit.pendingHandover['الرقم الوظيفي للمستلم الجديد']) === String(currentUser.employeeId) && (
            <section className="no-print" style={{ marginTop: 16, border: '2px solid ' + THEMES.yellow.border, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ background: THEMES.yellow.headerBg, color: THEMES.yellow.headerText, padding: '8px 12px', fontWeight: 'bold', fontSize: 13 }}>
                تأكيد استلام التصريح كمستلم جديد (نقل وردية)
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 12, marginBottom: 8 }}>تم تسمية رقمك الوظيفي كمستلم جديد لهذا التصريح من قبل المستلم الحالي. وقّع لتأكيد استلامك.</div>
                <SignaturePad onChange={setHandoverSignature} />
                <button className="primary" disabled={busy || !handoverSignature} onClick={handleConfirmHandover} style={{ marginTop: 10 }}>تأكيد الاستلام</button>
              </div>
            </section>
          )}

          {/* رأس "صفحة الإغلاق" في شاشة العرض النهائية المُقسَّمة (صفحة 2 من 4) - تذكير
              سريع ببيانات المهمة قبل عرض تفاصيل الإغلاق نفسها. فاصل شاشة فقط، لا علاقة له
              بالطباعة/PDF الفعلية (مكوّن مستقل بذاته PermitPrint بصفحاته الأربع الثابتة). */}
          {(showReceiverCloseSection && !wizardMode && showView(VIEW_PAGE_CLOSE)) && (
            <div style={{ marginTop: 24, paddingTop: 14, borderTop: '3px dashed #bbb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 8 }}>
                <span>{permit.permitNumber || permit.creationId}</span>
                <span>الصفحة 2 من 4</span>
              </div>
              <div style={{ background: WORK_FIELD_LABEL_BG, borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 'bold', fontSize: 12, color: WORK_FIELD_LABEL_TEXT }}>بيانات العمل (تذكير)</div>
                <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 6 }}>Work Data (Recap)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, fontSize: 11, fontWeight: 'bold' }}>
                  <div>{t('location', 'ar')}: {permit.location || '—'}</div>
                  <div>{t('circuit', 'ar')}: {permit.circuit || '—'}</div>
                  <div>{t('unit', 'ar')}: {permit.unit || '—'}</div>
                  <div>{t('station', 'ar')}: {permit.station || '—'}</div>
                  <div>{t('feeder', 'ar')}: {permit.feeder || '—'}</div>
                  <div>{t('permitNumber', 'ar')}: {permit.permitNumber || '—'}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 'bold', marginTop: 6 }}>{t('workDescription', 'ar')}: {permit.workDescription || '—'}</div>
              </div>
            </div>
          )}

          {/* 4) قسم إغلاق/إلغاء المستلم - منفصل، يظهر فقط بعد اعتماد المصدر وتوليد رقم التصريح،
              وفي وضع الويزار تحديدًا فقط عند الوصول لخطوة الإغلاق (لا يظهر مبكرًا ضمن خطوات
              العمل/المصدر/المستلم/المراجعة حتى لو كانت الحالة تسمح تقنيًا بالتعديل). */}
          {showReceiverCloseSection && (wizardMode ? showStep(STEP_CLOSE) : showView(VIEW_PAGE_CLOSE)) && (
            receiverCloseEditable && !ackReceiverClose ? (
              <SafetyAcknowledgmentGate permitType={permit.permitType} onAcknowledge={() => setAckReceiverClose(true)} />
            ) : (
            <PartySection
              title="إغلاق/إلغاء التصريح بواسطة المستلم / Closing or Cancelling by Receiver"
              theme={THEMES.yellow}
              lang={receiverCloseLang}
              checklist={(
                <SafetyChecklistSection
                  permitType={permit.permitType}
                  stage="إغلاق المستلم"
                  checkedMap={checkedMap}
                  readOnly={!receiverCloseEditable}
                  onToggle={(row, v) => setCheckedMap((m) => ({ ...m, [row]: v }))}
                  onCompletionChange={setReceiverCloseChecklistComplete}
                  lang={receiverCloseLang}
                  onLangChange={setReceiverCloseLang}
                  forceOpen={!wizardMode}
                />
              )}
              employeeId={permit.receiver.employeeId}
              fullName={permit.receiver.fullName}
              mobile={receiverCloseEditable ? (currentUser ? currentUser.mobile : '') : permit.receiver.mobile}
              cardRemainingDays={receiverCloseEditable ? (currentUser ? currentUser.receiverCardRemainingDays : '') : permit.receiver.cardRemainingDays}
              cardExpiry={receiverCloseEditable ? (currentUser ? currentUser.receiverCardExpiry : '') : permit.receiver.cardExpiry}
              dateTime={permit.receiver.closeDateTime}
              gps={permit.receiver.closeGps}
              savedSignature={permit.receiver.closeSignature}
              editable={receiverCloseEditable}
              signature={signature}
              onSignatureChange={setSignature}
            >
              {receiverCloseEditable && !showCancelReason && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="primary" disabled={busy || !signature || !receiverCloseChecklistComplete} onClick={() => handleReceiverClose('CLOSE')}>
                    {busy ? t('closingInProgress', receiverCloseLang) : (!receiverCloseChecklistComplete ? t('completeActionsFirst', receiverCloseLang) : t('closePermitAction', receiverCloseLang))}
                  </button>
                  <button disabled={busy || !receiverCloseChecklistComplete} onClick={() => setShowCancelReason(true)} style={{ background: 'var(--color-error)', color: '#fff' }}>{t('cancelPermitAction', receiverCloseLang)}</button>
                </div>
              )}
              {receiverCloseEditable && showCancelReason && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>{t('cancellationReason', receiverCloseLang)}</div>
                  <input type="text" style={{ width: '100%' }} value={cancelReason} onChange={(e) => setCancelReason(normalizeMixedInput(e.target.value))} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button disabled={busy || !cancelReason || !signature} onClick={() => handleReceiverClose('CANCEL')} style={{ background: 'var(--color-error)', color: '#fff' }}>{t('confirmCancellation', receiverCloseLang)}</button>
                    <button className="secondary" disabled={busy} onClick={() => setShowCancelReason(false)}>{t('goBack', receiverCloseLang)}</button>
                  </div>
                </div>
              )}
              {sentCloseSecretCode && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 10 }}>{t('shareWithSourceForClosing', receiverCloseLang)}</div>
                  <SharePanel
                    permitLink={permit.permitLink}
                    secretCode={sentCloseSecretCode}
                    secretNote="لا تُرسل هذا الرمز ولا رقم البرنامج التشغيلي ضمن رسالة المشاركة - أبلغهما للمصدر الفعلي الذي سيتولى الإغلاق شفهيًا (هاتفيًا) فقط، إن لم يكن هو المصدر الأصلي."
                    onCopy={copyPermitLink}
                    copied={linkCopied}
                  />
                  {/* رمز سري يجب مشاركته - زر رئيسية يدوي فقط بلا عدّاد تلقائي حتى تُتاح
                      الفرصة الكاملة لمشاركته أولًا. */}
                  <PostActionBanner message="تم إغلاق قسم المستلم بنجاح." autoRedirectSeconds={0} />
                </>
              )}
            </PartySection>
            )
          )}

          {/* نقل التصريح لمستلم آخر (تبديل وردية) - زر مطوي بدل قسم دائم الظهور، لأن أغلب
              التصاريح لا تحتاج نقل وردية إطلاقًا؛ يفتح النموذج فقط عند الاستخدام الفعلي.
              مخفي تمامًا عند الطباعة/PDF (إجراء إدخال حي وليس جزءًا من السجل النهائي -
              سجل النقل الفعلي إن حدث يظهر في الجدول التاريخي أدناه بغض النظر عن هذا الزر). */}
          {receiverCloseEditable && !permit.pendingHandover && (wizardMode ? showStep(STEP_CLOSE) : showView(VIEW_PAGE_CLOSE)) && (
            <div className="no-print" style={{ marginTop: 16 }}>
              {!showHandoverForm ? (
                <button onClick={() => setShowHandoverForm(true)} style={{ background: THEMES.neutral.badgeBg, color: THEMES.neutral.badgeText }}>
                  {t('handoverTitle', 'ar')}
                </button>
              ) : (
                <section style={{ border: '2px solid ' + THEMES.neutral.border, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div style={{ background: THEMES.neutral.headerBg, color: THEMES.neutral.headerText, padding: '8px 12px', fontWeight: 'bold', fontSize: 13 }}>
                    {t('handoverTitle', 'ar')}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 12 }}>{t('newReceiverId', 'ar')}</div>
                    <input
                      type="text" inputMode="numeric" style={{ width: '100%' }}
                      value={handoverNewReceiverId}
                      onChange={(e) => setHandoverNewReceiverId(sanitizeDigitsOnly(e.target.value))}
                    />
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>{t('signature', 'ar')}</div>
                      <SignaturePad onChange={setHandoverSignature} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="primary" disabled={busy || !handoverNewReceiverId || !handoverSignature} onClick={handleInitiateHandover}>
                        تسليم التصريح للمستلم الجديد
                      </button>
                      <button className="secondary" disabled={busy} onClick={() => setShowHandoverForm(false)}>تراجع</button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
          {permit.pendingHandover && (wizardMode ? showStep(STEP_CLOSE) : showView(VIEW_PAGE_CLOSE)) && (
            <div className="app-card no-print" style={{ marginTop: 12, fontSize: 12, textAlign: 'center' }}>
              بانتظار تأكيد استلام المستلم الجديد (الرقم الوظيفي: {permit.pendingHandover['الرقم الوظيفي للمستلم الجديد']})
            </div>
          )}

          {/* سجل نقل المستلم بين الورديات - مطابق لجدول Out Going/In Coming الورقي */}
          {permit.receiverHandovers && permit.receiverHandovers.length > 0 && (wizardMode ? showStep(STEP_CLOSE) : showView(VIEW_PAGE_CLOSE)) && (
            <section style={{ marginTop: 16 }}>
              <strong style={{ fontSize: 13, color: 'var(--color-primary)' }}>{t('handoverHistory', 'ar')}</strong>
              <div className="table-scroll-wrap" style={{ marginTop: 6 }}>
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>{t('outgoingReceiver', 'ar')}</th>
                      <th>{t('dateTime', 'ar')}</th>
                      <th>{t('incomingReceiver', 'ar')}</th>
                      <th>{t('dateTime', 'ar')}</th>
                      <th>{t('status', 'ar')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permit.receiverHandovers.map((h) => (
                      <tr key={h.transferId}>
                        <td>{h.outgoingName} ({h.outgoingEmployeeId})</td>
                        <td>{formatDateTimeShort(h.outgoingDateTime)}</td>
                        <td>{h.incomingName} ({h.incomingEmployeeId})</td>
                        <td>{formatDateTimeShort(h.incomingDateTime) || '—'}</td>
                        <td>{h.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 5) إغلاق المصدر النهائي - يُفتح فقط بعد إغلاق/إلغاء المستلم */}
          {showSourceCloseSection && (wizardMode ? showStep(STEP_CLOSE) : showView(VIEW_PAGE_CLOSE)) && (
            sourceCloseEditable && !ackSourceClose ? (
              <SafetyAcknowledgmentGate permitType={permit.permitType} onAcknowledge={() => setAckSourceClose(true)} />
            ) : (
            // قبل تنفيذ الإغلاق فعليًا permit.closingSource ما زال فارغًا (لا يُعبَّأ إلا بعد
            // closeBySource) - تُعرض هوية المستخدم الحالي (currentUser) بدلًا منه أثناء
            // التعبئة، وبيانات closingSource المحفوظة فعليًا بعد الإغلاق.
            <PartySection
              title="إغلاق المصدر النهائي / Final Issuer Close-out"
              theme={sourceCloseTheme}
              lang={sourceCloseLang}
              checklist={(
                <SafetyChecklistSection
                  permitType={permit.permitType}
                  stage="إغلاق المصدر"
                  checkedMap={checkedMap}
                  readOnly={!sourceCloseEditable}
                  onToggle={(row, v) => setCheckedMap((m) => ({ ...m, [row]: v }))}
                  onCompletionChange={setSourceCloseChecklistComplete}
                  lang={sourceCloseLang}
                  onLangChange={setSourceCloseLang}
                  forceOpen={!wizardMode}
                />
              )}
              employeeId={sourceCloseEditable ? (currentUser ? currentUser.employeeId : '') : permit.closingSource.employeeId}
              fullName={sourceCloseEditable ? (currentUser ? currentUser.fullName : '') : permit.closingSource.fullName}
              mobile={sourceCloseEditable ? (currentUser ? currentUser.mobile : '') : permit.closingSource.mobile}
              cardRemainingDays={sourceCloseEditable ? (currentUser ? currentUser.issuerCardRemainingDays : '') : permit.closingSource.cardRemainingDays}
              cardExpiry={sourceCloseEditable ? (currentUser ? currentUser.issuerCardExpiry : '') : permit.closingSource.cardExpiry}
              dateTime={permit.closingSource.closeDateTime}
              gps={permit.closingSource.closeGps}
              savedSignature={permit.closingSource.closeSignature}
              editable={sourceCloseEditable}
              signature={signature}
              onSignatureChange={setSignature}
              extraFields={[
                { label: t('authorityOfficialName', sourceCloseLang), value: permit.authorityOfficialName, onChange: () => {}, icon: <Icon name="person" size={12} /> }
              ]}
            >
              {sourceCloseEditable && (
                <button className="primary" disabled={busy || !signature || !sourceCloseChecklistComplete} onClick={handleSourceClose} style={{ marginTop: 10 }}>
                  {busy ? t('closingInProgress', sourceCloseLang) : (!sourceCloseChecklistComplete ? t('completeActionsFirst', sourceCloseLang) : t('finalCloseoutAction', sourceCloseLang))}
                </button>
              )}
              {justClosedFinal && (
                <PostActionBanner message="تم الإغلاق النهائي للتصريح بنجاح." autoRedirectSeconds={redirectSeconds} />
              )}
            </PartySection>
            )
          )}
          {/* زر "السابق" في خطوة الإغلاق يعود لمراجعة بيانات المستلم فقط للاطلاع - قسم الإغلاق
              نفسه يبقى بحالته (مفتوح/مغلق) بحسب حالة التصريح الفعلية بغض النظر عن التنقل. */}
          {wizardMode && showStep(STEP_CLOSE) && (
            <WizardNav onBack={() => setCurrentStep(STEP_ISSUE)} />
          )}
          {/* تنقّل صفحات شاشة العرض النهائية: من "صفحة 2: الإغلاق" إلى "صفحة 3: رحلة التصريح" */}
          {!wizardMode && showView(VIEW_PAGE_CLOSE) && (
            <WizardNav onBack={() => setViewPage(VIEW_PAGE_WORK)} onNext={() => setViewPage(VIEW_PAGE_JOURNEY)} />
          )}

          {/* جدولا الملخص النهائي (هوية/تواقيع + جدول زمني) - جزء من "صفحة 3: رحلة التصريح"
              في شاشة العرض النهائية المُقسَّمة، يظهران فقط بعد إغلاق/إلغاء التصريح فعليًا. */}
          {showFinalInstructions && showView(VIEW_PAGE_JOURNEY) && <SummaryTables permit={permit} />}
          {!wizardMode && showView(VIEW_PAGE_JOURNEY) && (
            <WizardNav onBack={() => setViewPage(VIEW_PAGE_CLOSE)} onNext={() => setViewPage(VIEW_PAGE_SAFETY)} />
          )}

          {error && <div style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 10 }}>{error}</div>}
        </div>
      </div>

      {/* تصدير PDF متاح بمجرد توليد رقم التصريح (canExportPdf) - وليس فقط بعد إغلاق/إلغاء
          التصريح فعليًا - أي شخص يفتح الرابط/QR يمكنه تنزيل نسخة كاملة البنية (أقسام
          الإغلاق تظهر فيها فارغة طبيعيًا لحين حدوثها). تنزيل مباشر لملف PDF حقيقي - بدون
          المرور بنافذة طباعة المتصفح إطلاقًا (انظر utils/pdfExport.js). ثابت أسفل الشاشة
          (sticky) بدل الاختفاء مع التمرير عند وصول المستخدم لنهاية الصفحة. */}
      {canExportPdf && (
        <div
          className="no-print"
          style={{
            position: 'sticky', bottom: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8,
            padding: '10px 0', marginTop: 8, background: 'linear-gradient(to top, var(--color-background) 70%, transparent)'
          }}
        >
          <button disabled={pdfExporting} onClick={handleDownloadPdf} style={{ background: 'var(--color-secondary)', color: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
            {pdfExporting ? 'جارٍ تجهيز الملف...' : '📄 تنزيل نسخة PDF الرسمية'}
          </button>
          <button onClick={handleCloseAndReturn} className="secondary" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            {employee ? 'إغلاق والعودة للرئيسية' : 'إغلاق'}
          </button>
        </div>
      )}

      {/* صفحة تعليمات السلامة النهائية (على الشاشة فقط الآن) - "صفحة 4" في شاشة العرض
          النهائية المُقسَّمة. نسخة الطباعة/PDF منها تعيش داخل PermitPrint (الصفحة 4) حصرًا،
          وليست هذه النسخة الشاشية. */}
      {showFinalInstructions && showView(VIEW_PAGE_SAFETY) && (
        <>
          <SafetyInstructionsPage permitType={permit.permitType} lang={printLang} onLangChange={setPrintLang} />
          <div className="no-print" style={{ maxWidth: 700, margin: '0 auto' }}>
            <WizardNav onBack={() => setViewPage(VIEW_PAGE_JOURNEY)} />
          </div>
        </>
      )}
    </div>

    {/* مستند الطباعة/PDF الفعلي - مكوّن مستقل تمامًا (صفحتا A4 ثابتتان)، مخفي بالكامل على
        الشاشة (screen:none) ولا يظهر إلا عند الطباعة الفعلية (@media print). يُركَّب في
        الـDOM بمجرد canExportPdf (توليد رقم التصريح) وليس فقط بعد الإغلاق الكامل. */}
    {canExportPdf && (
      <PermitPrint permit={permit} companyName={companyName} printLang={printLang} />
    )}
    </>
  );
}

