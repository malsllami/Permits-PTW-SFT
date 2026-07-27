/**
 * تصدير مستند التصريح (PermitPrint) كملف PDF مباشر يُنزَّل فورًا على جهاز المستخدم - بدون
 * المرور بنافذة طباعة المتصفح إطلاقًا. يلتقط كل صفحة (.print-page) بدقة عالية عبر
 * html2canvas ثم يجمعها في مستند PDF بمقاس A4 حقيقي عبر jsPDF (صفحة تقابل صفحة تمامًا).
 * مستند PermitPrint نفسه يبقى مخفيًا خارج نطاق الرؤية طوال العملية (انظر .pdf-export-active
 * في rtl.css) فلا يظهر أي وميض على شاشة المستخدم.
 *
 * jsPDF/html2canvas تُستورَدان ديناميكيًا (import() وليس import ثابت بأعلى الملف) - مكتبتان
 * ثقيلتان لا يحتاجهما أي مستخدم إلا عند تصدير تصريح مغلق فعليًا كـPDF (حالة نادرة نسبيًا)،
 * فتحميلهما فقط عند الاستخدام الفعلي يمنع تضخيم حزمة الموقع الأساسية لكل زائر.
 */
export async function downloadPermitPdf(fileName) {
  const root = document.querySelector('.permit-print-root');
  if (!root) throw new Error('تعذّر العثور على مستند الطباعة.');

  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);

  // الخطوط المخصّصة (IBM Plex Sans Arabic/Inter) يجب أن تكون محمّلة فعليًا قبل الالتقاط،
  // وإلا قد تُلتقط الصفحة بخط احتياطي مؤقت قبل اكتمال تحميل الخط الحقيقي.
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) { /* تجاهل - ليست حرجة */ }
  }

  root.classList.add('pdf-export-active');
  // مهلة قصيرة لضمان إعادة رسم المتصفح فعليًا للتخطيط الجديد (display:block) قبل الالتقاط.
  await new Promise((resolve) => setTimeout(resolve, 60));

  try {
    const pages = Array.from(root.querySelectorAll('.print-page'));
    if (pages.length === 0) throw new Error('لا توجد صفحات لتصديرها.');

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) pdf.addPage();
      // الصورة تُمدَّد بالضبط على مقاس A4 كامل (210×297مم) - نفس أبعاد ".print-page" الحقيقية
      // التي التُقطت منها، فلا تشويه في النسب.
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    pdf.save(fileName || 'permit.pdf');
  } finally {
    root.classList.remove('pdf-export-active');
  }
}
