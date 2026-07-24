import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** يولّد رمز QR Client-side من الرابط الدائم مباشرة (بدون تخزين أي صورة في الشيت). */
export default function QRCodeView({ link, size = 140 }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { width: size, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [link, size]);

  if (!link) return null;
  return dataUrl ? (
    <img src={dataUrl} alt="رمز الاستجابة السريعة QR" width={size} height={size} style={{ borderRadius: 8 }} />
  ) : null;
}
