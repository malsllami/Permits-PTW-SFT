import React from 'react';

/** جدول عام: صف أول ثابت وملوّن، محتوى محاذى للوسط بخط عريض حجم 12 (معيار الواجهة الموحّد). */
export default function StickyHeaderTable({ columns, rows, renderRow, maxHeight = 480 }) {
  return (
    <div className="table-scroll-wrap" style={{ maxHeight, overflowY: 'auto' }}>
      <table className="app-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || idx}>{renderRow(row, idx)}</tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: 20, color: '#888' }}>لا توجد بيانات لعرضها</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
