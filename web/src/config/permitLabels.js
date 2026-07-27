// تسميات ثابتة لواجهة نموذج التصريح (عربي/إنجليزي) - نصوص واجهة ثابتة وليست بيانات أعمال،
// لذا يجوز تعريفها هنا (على عكس بنود السلامة الفعلية التي تأتي من إعدادات السلامة في الشيت).
export const PERMIT_LABELS = {
  workData: { ar: 'بيانات العمل', en: 'Work Data' },
  location: { ar: 'الموقع', en: 'Location' },
  circuit: { ar: 'الدائرة', en: 'Circuit' },
  unit: { ar: 'الوحدة', en: 'Unit' },
  station: { ar: 'المحطة', en: 'Station/Substation' },
  feeder: { ar: 'المغذي', en: 'Feeder' },
  workDescription: { ar: 'وصف العمل', en: 'Description of Work' },
  isolationPoints: { ar: 'نقاط العزل', en: 'Isolation Points' },
  sourceSwitches: { ar: 'مفاتيح المصدر', en: 'Issuer Switches' },
  operationalProgramNumber: { ar: 'رقم البرنامج التشغيلي', en: 'Switching Program No.' },
  voltageLevel: { ar: 'مستوى الجهد', en: 'Voltage Level' },
  sourceData: { ar: 'بيانات المصدر', en: 'Issuer Data' },
  receiverData: { ar: 'بيانات المستلم', en: 'Receiver Data' },
  closingData: { ar: 'بيانات الإغلاق', en: 'Closing Data' },
  employeeId: { ar: 'الرقم الوظيفي', en: 'ID No.' },
  fullName: { ar: 'الاسم', en: 'Name' },
  mobile: { ar: 'رقم الجوال', en: 'Mobile No.' },
  signature: { ar: 'التوقيع', en: 'Signature' },
  dateTime: { ar: 'التاريخ والوقت', en: 'Date/Time' },
  gps: { ar: 'الموقع الجغرافي', en: 'GPS' },
  safetyItems: { ar: 'بنود السلامة', en: 'Safety Items' },
  permitNumber: { ar: 'رقم التصريح', en: 'Permit No.' },
  status: { ar: 'الحالة', en: 'Status' },
  workDuration: { ar: 'مدة تنفيذ العمل', en: 'Duration of Work' },
  // الأسماء مختصرة عمدًا (بلا "المصدر"/"المستلم"/"المعنية") - سياق البطاقة نفسها (بطاقة
  // المصدر أو بطاقة المستلم) يوضّح صاحب الحقل أصلًا، فلا حاجة لتطويل التسمية بتكرار ذلك.
  sourceLockNumber: { ar: 'رقم الأقفال', en: 'Lock No.' },
  receiverLockNumber: { ar: 'رقم الأقفال', en: 'Lock No.' },
  authorityOfficialName: { ar: 'الجهة المسؤولة', en: 'Responsible Party' },
  authorityType: { ar: 'الجهة', en: 'Entity' },
  receiverEntityType: { ar: 'الجهة', en: 'Entity' },
  testType: { ar: 'نوع الاختبار', en: 'Type of Test' },
  testEquipmentName: { ar: 'اسم المعدة المراد اختبارها', en: 'Equipment to be Tested' },
  cancellationReason: { ar: 'سبب الإلغاء', en: 'Reason for Cancellation' },
  handoverTitle: { ar: 'نقل التصريح لمستلم آخر', en: 'Transfer to Another Receiver' },
  newReceiverId: { ar: 'الرقم الوظيفي للمستلم الجديد', en: 'New Receiver ID' },
  handoverHistory: { ar: 'سجل نقل المستلم بين الورديات', en: 'Receiver Shift Handover Log' },
  outgoingReceiver: { ar: 'المستلم المغادر', en: 'Outgoing Receiver' },
  incomingReceiver: { ar: 'المستلم الجديد', en: 'Incoming Receiver' },
  shareWithReceiver: { ar: 'مشاركة التصريح مع المستلم', en: 'Share Permit with Receiver' },
  shareWithSourceForClosing: { ar: 'مشاركة التصريح مع المصدر للإغلاق', en: 'Share Permit with Issuer for Closing' },
  permitLink: { ar: 'رابط التصريح', en: 'Permit Link' },
  copyLink: { ar: 'نسخ الرابط', en: 'Copy Link' },
  linkCopied: { ar: 'تم النسخ', en: 'Copied' }
};

export function t(key, lang) {
  const entry = PERMIT_LABELS[key];
  if (!entry) return key;
  return entry[lang] || entry.ar;
}
