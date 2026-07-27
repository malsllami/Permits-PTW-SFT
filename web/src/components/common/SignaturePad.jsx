import React, { useEffect, useRef, useState } from 'react';

const CSS_WIDTH = 320;
const CSS_HEIGHT = 120;

/** لوحة توقيع بخط اليد (Canvas) - تُصدّر التوقيع كـ Data URL (Base64) عند الانتهاء. */
export default function SignaturePad({ onChange, disabled }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  // مصدر الحقيقة الفعلي لوجود رسم أم لا - يُحدَّث فورًا (وليس عبر حالة React التي قد
  // تتأخر تطبيقها حتى إعادة رسم لاحقة)، لأن "end" يحتاج قراءته لحظة رفع المؤشر مباشرة
  // (pointerup) دون انتظار أي دورة render، وإلا يُفوَّت توقيع سريع بضغطة واحدة فيبقى الحقل
  // فارغًا فعليًا رغم ظهور الرسم على الشاشة - ما كان يوقف تقدّم المستخدم عند خطوة الاعتماد.
  const hasDrawnRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const applyContextStyle_ = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#143A6B';
    return ctx;
  };

  // تحويل موضع اللمس/الفأرة إلى "فضاء منطقي" مقاسه الثابت CSS_WIDTH×CSS_HEIGHT (وليس
  // canvas.width/height الفعليين) - لأن ctx.setTransform(ratio,...) أدناه يُطبَّق على أي
  // إحداثيات تُمرَّر لأوامر الرسم، فلو ضُرب الموضع هنا بنسبة معامل الكثافة (ratio) مجددًا،
  // يُضرَب مرتين فعليًا (مرة هنا ومرة عبر التحويل) فيُرسَم الخط بعيدًا جدًا خارج حدود
  // الكانفاس المرئية تمامًا - يبدو "لا يرسم شيئًا" رغم أن hasDrawnRef يُسجَّل صحيحًا (خط
  // فعلي رُسم، فقط غير مرئي)، وهو ما كان يسمح بالمتابعة بتوقيع فارغ ظاهريًا.
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width ? CSS_WIDTH / rect.width : 1;
    const scaleY = rect.height ? CSS_HEIGHT / rect.height : 1;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.getContext('2d').clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    hasDrawnRef.current = false;
    setIsEmpty(true);
    if (onChange) onChange('');
  };

  /**
   * الاستماع لأحداث المؤشّر يُسجَّل هنا يدويًا عبر addEventListener مباشرة على عنصر
   * الكانفاس (وليس عبر onPointerDown/onPointerMove كخصائص JSX) - React يُلحق كل الأحداث
   * فعليًا عبر مستمع واحد مفوَّض عند جذر الصفحة، وبعض متصفحات الجوال (خصوصًا للأحداث
   * الصادرة من اللمس تحديدًا) تُعامل هذا النوع من الأحداث المفوَّضة كـ"سلبية" (passive)
   * بشكل افتراضي لأسباب أداء التمرير، فيُتجاهَل استدعاء preventDefault داخلها بصمت - يمنع
   * ذلك السحب المستمر من الاستمرار (المتصفح يبدأ تمرير/تكبير الصفحة بدل الرسم)، فيرسم
   * الفأرة (لا يمر بهذا المسار المفوَّض بنفس القيود) بينما لا يرسم اللمس على الجوال إطلاقًا.
   * التسجيل المباشر مع { passive: false } يضمن عمل preventDefault فعليًا في كل الحالات.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = CSS_WIDTH * ratio;
    canvas.height = CSS_HEIGHT * ratio;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    applyContextStyle_();

    const start = (e) => {
      if (disabledRef.current) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* يُتجاهَل - الرسم يعمل بدونه أيضًا */ }
      drawingRef.current = true;
      const ctx2 = applyContextStyle_();
      const pos = getPos(e);
      ctx2.beginPath();
      ctx2.moveTo(pos.x, pos.y);
    };

    const move = (e) => {
      if (!drawingRef.current || disabledRef.current) return;
      e.preventDefault();
      const ctx2 = canvas.getContext('2d');
      const pos = getPos(e);
      ctx2.lineTo(pos.x, pos.y);
      ctx2.stroke();
      hasDrawnRef.current = true;
      setIsEmpty(false);
    };

    const end = (e) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      try {
        if (e && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      } catch (err) { /* يُتجاهَل */ }
      // لا يُبلَّغ عن توقيع فارغ (كانفاس أبيض بالكامل) كتوقيع صالح - toDataURL يُعيد صورة
      // "فارغة" صالحة الصيغة حتى بلا أي رسم فعلي، فكان يمكن قبولها خطأً كتوقيع حقيقي.
      if (hasDrawnRef.current && onChange) onChange(canvas.toDataURL('image/png'));
    };

    canvas.addEventListener('pointerdown', start, { passive: false });
    canvas.addEventListener('pointermove', move, { passive: false });
    canvas.addEventListener('pointerup', end, { passive: false });
    canvas.addEventListener('pointercancel', end, { passive: false });
    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointercancel', end);
    };
    // eslint-disable-next-line
  }, [onChange]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          border: '1px dashed #b7bfca', borderRadius: 'var(--radius-md)',
          width: CSS_WIDTH, height: CSS_HEIGHT, maxWidth: '100%', touchAction: 'none', background: '#fff', display: 'block'
        }}
      />
      {!disabled && (
        <div style={{ marginTop: 6 }}>
          <button type="button" onClick={clear} style={{ background: '#eee', color: '#333', fontSize: 12 }}>
            مسح التوقيع
          </button>
        </div>
      )}
      {isEmpty && !disabled && <div style={{ fontSize: 11, color: '#888' }}>وقّع هنا بإصبعك أو الفأرة</div>}
    </div>
  );
}
