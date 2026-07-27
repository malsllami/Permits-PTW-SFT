const HIJRI_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

/** تحويل تقريبي (حسابي) من ميلادي إلى هجري - كافٍ للعرض الإرشادي بجانب التاريخ الميلادي. */
export function gregorianToHijri(date) {
  const jd = Math.floor(date.getTime() / 86400000) + 2440587.5 + 0.5 | 0;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day, label: day + ' ' + HIJRI_MONTHS[month - 1] + ' ' + year + 'هـ' };
}

export function formatGregorian(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return d + '/' + m + '/' + date.getFullYear() + 'م';
}

/** التاريخ الميلادي والهجري كسطرين منفصلين (لعرضهما تحت بعض داخل إطار واحد). */
export function formatBilingualDateLines(dateInput) {
  if (!dateInput) return null;
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return { gregorian: String(dateInput), hijri: '' };
  return { gregorian: formatGregorian(date), hijri: gregorianToHijri(date).label };
}

/**
 * تاريخ + وقت مختصر بسطر واحد (مثال: "27/07/2026 03:13 م") - للجداول/البطاقات المصغّرة
 * التي لا تحتمل مساحة صندوق التاريخ الثنائي اللغة الكامل. يتجاهل القيم التالفة القادمة أحيانًا
 * من خلايا فارغة بالشيت (تُقرأ أحيانًا كتاريخ ملحمي قديم جدًا مثل سنة 1899) كأنها فارغة.
 */
export function formatDateTimeShort(dateInput) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const h24 = date.getHours();
  const period = h24 < 12 ? 'ص' : 'م';
  const h12 = String(h24 % 12 === 0 ? 12 : h24 % 12).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return d + '/' + mo + '/' + date.getFullYear() + ' ' + h12 + ':' + mi + ' ' + period;
}

/**
 * يدمج حقل "تاريخ" منفصل (قد يحمل جزء وقت مضلِّلًا - مثلًا منتصف الليل محليًا يظهر
 * كالساعة 21:00 اليوم السابق بتوقيت UTC) مع حقل "وقت" منفصل (قد يحمل جزء تاريخ تالفًا -
 * عادة تاريخ ملحمي 1899 من خلية "وقت فقط" بجوجل شيتس) في تاريخ واحد صحيح بأخذ يوم/شهر/سنة
 * من الأول وساعة/دقيقة من الثاني، بدل عرض النصين الخامّين متجاورين كما يُخزَّنان.
 */
export function combineDateAndTime(dateValue, timeValue) {
  if (!dateValue) return null;
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(d.getTime())) return null;
  if (!timeValue) return d;
  const t = timeValue instanceof Date ? timeValue : new Date(timeValue);
  if (isNaN(t.getTime())) return d;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.getHours(), t.getMinutes(), t.getSeconds());
}

/**
 * لقيم "نصية" من الإعدادات العامة (مثل "SAFETY RULES UPDATED AT") يُفترض أنها نص عادي
 * (dd-MM-yyyy) لكن جوجل شيتس قد يحوّل الخلية تلقائيًا لتاريخ حقيقي فيُعاد نص ISO خام
 * ("...T21:00:00.000Z") بدل النص المتوقَّع - يكتشف الحالتين ويعرض تاريخًا نظيفًا دائمًا
 * (dd-MM-yyyy) بغض النظر عن الصيغة الفعلية المخزَّنة فعليًا في الخلية.
 */
export function formatMaybeIsoDateOnly(value) {
  if (!value) return '';
  const str = String(value);
  if (!str.includes('T') && !str.includes('Z')) return str;
  const date = new Date(str);
  if (isNaN(date.getTime())) return str;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return d + '-' + m + '-' + date.getFullYear();
}

/** تاريخ ووقت كسطرين منفصلين (وليس نصًا واحدًا طويلًا قد يلتفّ بشكل عشوائي داخل صندوق ضيّق). */
export function formatDateTimeTwoLines(dateInput) {
  if (!dateInput) return null;
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) return null;
  const d = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const h24 = date.getHours();
  const period = h24 < 12 ? 'ص' : 'م';
  const h12 = String(h24 % 12 === 0 ? 12 : h24 % 12).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return { date: d + '/' + mo + '/' + date.getFullYear(), time: h12 + ':' + mi + ' ' + period };
}

export function formatTimeOnly(dateInput) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return h + ':' + m + ':' + s;
}
