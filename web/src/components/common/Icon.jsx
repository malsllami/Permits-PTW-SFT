import React from 'react';

/**
 * أيقونة موحّدة من مكتبة واحدة فقط (Material Symbols Rounded) - بدل خلط Emoji/رموز متفاوتة
 * الأسلوب عبر الموقع. "name" هو الاسم البرمجي للأيقونة (مثال: "shield", "person", "lock").
 */
export default function Icon({ name, size = 18, color, style }) {
  return (
    <span
      className="material-symbols-rounded"
      style={{ fontSize: size, color: color || 'currentColor', verticalAlign: 'middle', ...style }}
    >
      {name}
    </span>
  );
}
