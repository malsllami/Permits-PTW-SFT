import React from 'react';
import { formatBilingualDate } from '../../hooks/useHijriGregorianDate.js';

/** يعرض أي تاريخ/وقت ميلادي وهجري معًا في نفس الحقل - مطلوب في كل تواريخ النظام. */
export default function BilingualDateField({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ fontSize: 12 }}>
      {label && <span style={{ fontWeight: 'bold' }}>{label}: </span>}
      <span>{formatBilingualDate(value)}</span>
    </div>
  );
}
