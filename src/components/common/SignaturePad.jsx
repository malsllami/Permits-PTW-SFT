import React, { useEffect, useRef, useState } from 'react';

/** لوحة توقيع بخط اليد (Canvas) - تُصدّر التوقيع كـ Data URL (Base64) عند الانتهاء. */
export default function SignaturePad({ onChange, disabled }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#143A6B';
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e) => {
    if (disabled) return;
    drawingRef.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const move = (e) => {
    if (!drawingRef.current || disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (onChange) onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    if (onChange) onChange('');
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={320}
        height={120}
        style={{ border: '1px dashed #b7bfca', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: 320, touchAction: 'none', background: '#fff' }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
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
