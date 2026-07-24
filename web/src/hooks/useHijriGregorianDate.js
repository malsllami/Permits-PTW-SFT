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

export function formatBilingualDate(dateInput) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  return formatGregorian(date) + ' - ' + gregorianToHijri(date).label;
}
