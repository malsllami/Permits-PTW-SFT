import React from 'react';
import { formatBilingualDateLines, formatTimeOnly } from '../../hooks/useHijriGregorianDate.js';
import Icon from './Icon.jsx';

/**
 * يعرض أي تاريخ/وقت: التاريخان الميلادي والهجري سطرين تحت بعض داخل إطار واحد، وبطاقة
 * التوقيت في نفس الصف بجانب الإطار (وليس أسفله). مطلوب في كل تواريخ النظام.
 */
export default function BilingualDateField({ label, value }) {
  if (!value) return null;
  const dateLines = formatBilingualDateLines(value);
  const timeLabel = formatTimeOnly(value);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 }}>
      {label && <strong style={{ fontSize: 12 }}>{label}:</strong>}
      {dateLines && (
        <div style={{ border: '1px solid #d5d9e0', borderRadius: 12, padding: '4px 12px', fontSize: 12, fontWeight: 'bold', lineHeight: 1.7 }}>
          <div>{dateLines.gregorian}</div>
          {dateLines.hijri && <div>{dateLines.hijri}</div>}
        </div>
      )}
      {timeLabel && (
        <div style={{ border: '1px solid #d5d9e0', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="schedule" size={14} /> {timeLabel}
        </div>
      )}
    </div>
  );
}
