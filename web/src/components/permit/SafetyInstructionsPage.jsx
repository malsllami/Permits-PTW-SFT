import React, { useEffect, useState } from 'react';
import { getSafetyInstructions } from '../../services/settingsService.js';

/**
 * قواعد وتعليمات السلامة للاطلاع فقط - تُعرض بالعربية والإنجليزية معًا جنبًا إلى جنب
 * (مطابقة لصفحة "Important Instructions" في النماذج الورقية المرجعية)، تظهر بعد إغلاق/إلغاء التصريح.
 */
export default function SafetyInstructionsPage({ permitType }) {
  const [instructions, setInstructions] = useState([]);

  useEffect(() => {
    getSafetyInstructions(permitType).then(setInstructions).catch(() => {});
  }, [permitType]);

  if (instructions.length === 0) return null;

  return (
    <div className="app-card" style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 15, color: 'var(--color-primary)', textAlign: 'center' }}>
        قواعد وتعليمات السلامة الهامة / Important Safety Instructions
      </h3>
      <div className="table-scroll-wrap">
        <table className="app-table">
          <thead>
            <tr>
              <th>بالعربية</th>
              <th>English</th>
            </tr>
          </thead>
          <tbody>
            {instructions.map((item) => (
              <tr key={item.row}>
                <td style={{ textAlign: 'right' }}>{item.textAr}</td>
                <td style={{ textAlign: 'left', direction: 'ltr' }}>{item.textEn || item.textAr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
