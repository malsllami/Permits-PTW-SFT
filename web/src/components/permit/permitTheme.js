// ألوان كل مرحلة: أحمر = المصدر (ثابت)، أخضر = مكتمل/معتمد، أصفر = دور المستلم، محايد = افتراضي.
// fieldLightBg: خلفية أخف بضع درجات للحقول المُدخلة يدويًا/من الجداول (تمييزها عن بطاقة
// البيانات الثابتة التي تستخدم badgeBg الأقوى)، مع نص غامق (headerText) لوضوح القراءة.
// veryLightBg: خلفية فاتحة جدًا (أخف من fieldLightBg) لقيم صفوف بطاقة تعريف الموظف -
// تبقى تسمية الحقل بلون القسم القوي بينما القيمة نفسها فاتحة جدًا، لإتاحة مساحة
// كافية لألوان تحذيرية مستقلة (مثل مدة بطاقة الصلاحية) أن تظهر وتُلاحَظ بوضوح.
// bg: خلفية جسم القسم بالكامل (وليس فقط شريط العنوان) - قيمها من "ألوان النظام" حسب دليل
// التصميم المعتمد (بيانات المصدر/المستلم/الإغلاق لكل منها خلفية فاتحة مميزة عبر كامل القسم).
export const THEMES = {
  red: { border: 'var(--color-role-source-border)', headerBg: '#FDECEC', headerText: '#B71C1C', badgeBg: 'var(--color-role-source-border)', badgeText: '#fff', fieldLightBg: '#FCE8E8', veryLightBg: '#FDF3F3', bg: 'var(--color-bg-source)' },
  green: { border: '#66BB6A', headerBg: '#EAF7EE', headerText: '#1B5E20', badgeBg: '#66BB6A', badgeText: '#fff', fieldLightBg: '#E7F6EB', veryLightBg: '#F2FAF4', bg: 'var(--color-bg-closing)' },
  yellow: { border: 'var(--color-role-receiver-border)', headerBg: '#FFF8E1', headerText: '#8D6E00', badgeBg: 'var(--color-role-receiver-border)', badgeText: '#5C4400', fieldLightBg: '#FFF6D9', veryLightBg: '#FFFCF0', bg: 'var(--color-bg-receiver)' },
  neutral: { border: '#d5d9e0', headerBg: '#F5F7FA', headerText: 'var(--color-text)', badgeBg: '#d5d9e0', badgeText: '#333', fieldLightBg: '#F1F3F6', veryLightBg: '#FAFBFC', bg: '#F5F7FA' }
};
// اسم مستعار لقسمَي "الإغلاق" (إغلاق المستلم/إغلاق المصدر) - لون مستقل (أخضر فاتح) حسب
// دليل التصميم، بدل إعادة استخدام لون المستلم (أصفر) أو المصدر (أحمر) لقسم الإغلاق.
THEMES.closing = THEMES.green;

/** لون تحذيري مستقل حسب المدة المتبقية لبطاقة الصلاحية - أحمر (خطر) / أصفر (تنبيه) / أخضر (جيد). */
export function remainingDaysTone(days) {
  const n = Number(days);
  if (isNaN(n)) return null;
  if (n <= 0) return { bg: '#E5E7EB', text: '#4B5563', label: 'انتهت' };
  if (n <= 15) return { bg: '#F8D7D7', text: '#B71C1C', label: 'قاربت على الانتهاء' };
  if (n <= 45) return { bg: '#FFF3CD', text: '#8D6E00', label: 'قاربت على الانتهاء' };
  return { bg: '#DFF5E1', text: '#1B5E20', label: 'سارية' };
}

// حقول "بيانات العمل" تُعرض كبطاقات بيضاء صغيرة داخل قسم بيانات العمل نفسه (خلفيته الزرقاء
// الفاتحة من "ألوان النظام") - أبيض بدل نفس اللون الأزرق حتى تبرز كل بطاقة حقل عن خلفية
// القسم المحيطة بها بدل الاندماج معها.
export const WORK_FIELD_LABEL_BG = '#fff';
export const WORK_FIELD_LABEL_TEXT = '#0D3C61';
export const WORK_FIELD_VALUE_BG = '#EEF1F5';
