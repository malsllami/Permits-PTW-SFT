import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession.js';

export default function AppLayout({ title, children }) {
  const { employee, logout } = useSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      {/* رأس الموقع (الشعار/التنقل/تسجيل الخروج) لا ينتمي لمستند الطباعة/PDF إطلاقًا - كان
          يُطبع سابقًا فوق كل صفحة لأنه لم يكن مُستثنى بـ no-print، بعكس مطلب التصميم الصريح
          بمنع ظهور أي عنصر من واجهة الموقع (Header/Sidebar/Buttons) داخل المستند المطبوع. */}
      <header className="no-print" style={{ position: 'relative', overflow: 'hidden', color: '#fff', padding: '12px 20px', display: 'flex', flexWrap: 'wrap', rowGap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
        {/* خلفية الهيدر بلوني شعار "السعودية للطاقة" (أزرق/أخضر مائل للتركواز) بشكل شريط
            منحنٍ يتدرّج قطريًا - أزرق سائد من الأعلى عند الطرف الأيمن، ينزلق تدريجيًا لأسفل
            كلما اتجهنا يسارًا حتى يصبح شريطًا رفيعًا أسفل الهيدر عند الطرف الأيسر (حيث يسود
            اللون الآخر معظم المساحة) - نفس حركة الانحناء/الالتفاف في شعار الشركة نفسه، عبر
            SVG مطلق الموضع خلف محتوى الهيدر (يتمدّد بحرية مع أي عرض/ارتفاع فعلي للهيدر). */}
        <svg
          viewBox="0 0 1440 100" preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
        >
          <defs>
            <linearGradient id="hdrTeal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1FAE9A" />
              <stop offset="100%" stopColor="#2FC6B4" />
            </linearGradient>
            <linearGradient id="hdrBlue" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0D4F8B" />
              <stop offset="55%" stopColor="#1668A8" />
              <stop offset="100%" stopColor="#1E88C7" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1440" height="100" fill="url(#hdrTeal)" />
          <path
            fill="url(#hdrBlue)"
            d="M1440,0 C1150,3 950,15 720,40 C490,65 290,78 0,82 L0,100 C290,96 490,84 720,58 C950,32 1150,15 1440,85 Z"
          />
        </svg>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', rowGap: 8, gap: 16, alignItems: 'center' }}>
          <img src="/Permits-PTW-SFT/logo.png" alt="الشعار" style={{ height: 32 }} />
          <strong>{title}</strong>
          {/* لا قوائم إطلاقًا للموظف العادي (مصدر/مستلم) - شاشة "الرئيسية" الموحّدة هي الصفحة
              الوحيدة له (بطاقة بياناته + بطاقات الإنشاء + بطاقات تصاريحه)، فلا حاجة لأي رابط
              تنقّل آخر. المدير وحده يحتفظ برابط "لوحة المدير" للوصول لأدوات الإدارة المنفصلة. */}
          {employee && employee.isAdmin && (
            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 13 }}>
              <Link to="/admin" style={{ color: '#fff', whiteSpace: 'nowrap' }}>لوحة المدير</Link>
            </nav>
          )}
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 13 }}>
          {employee && <span style={{ whiteSpace: 'nowrap' }}>{employee.fullName}</span>}
          {employee && <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', whiteSpace: 'nowrap' }}>خروج</button>}
        </div>
      </header>
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}
