/**
 * مدة تنفيذ العمل تُحسب آليًا (وليست حقلًا يُدخله المصدر يدويًا) من الفرق بين وقت
 * توليد رقم تصريح العمل (اعتماد المصدر) ووقت إغلاق المصدر النهائي - تبقى فارغة حتى
 * يُغلق التصريح فعليًا. مشتركة بين شاشة العرض التفاعلية ومستند الطباعة/PDF المستقل.
 */
export function computeWorkDurationLabel(startStr, endStr) {
  if (!startStr || !endStr) return '';
  const start = new Date(String(startStr).replace(' ', 'T'));
  const end = new Date(String(endStr).replace(' ', 'T'));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return '';
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days > 0) parts.push(days + ' يوم');
  if (hours > 0 || days > 0) parts.push(hours + ' ساعة');
  parts.push(minutes + ' دقيقة');
  return parts.join(' ');
}

// حالات ما بعد توليد رقم التصريح (بعد اعتماد المصدر) - أي شيء غير هذه المجموعة قبل التوليد.
const ISSUED_STATUSES = ['نشط', 'بانتظار إغلاق المصدر', 'بانتظار تأكيد الإلغاء من المصدر'];

/**
 * لون يدل على مرحلة التصريح الحالية - موحّد عبر الموقع (سجلاتي/تصريحي بالصفحة الرئيسية...)
 * بدل تكرار نفس منطق الألوان في أكثر من مكان: أخضر=مغلق (اكتمل)، أحمر=ملغي، برتقالي=جارٍ
 * العمل (رقم صادر بالفعل)، وردي/أصفر فاتحان=قبل توليد الرقم (حسب النوع PTW/SFT).
 */
export function getPermitStatusColor(status, permitType) {
  if (status === 'مغلق') return '#DFF5E1';
  if (status === 'ملغي') return '#F3D6D6';
  if (ISSUED_STATUSES.indexOf(status) !== -1) return '#FFE3C2';
  return permitType === 'PTW' ? '#FBE0EA' : '#FDF6D8';
}

/** يقسّم نصًا حرًا مفصولًا بفواصل/أسطر إلى عناصر منفصلة لعرضها كـ Badges بدل نص متصل. */
export function splitToBadgeItems(text) {
  if (!text) return [];
  return String(text)
    .split(/[\n,،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
