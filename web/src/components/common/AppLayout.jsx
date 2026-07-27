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
      <header className="no-print" style={{ background: 'var(--color-navbar)', color: '#fff', padding: '12px 20px', display: 'flex', flexWrap: 'wrap', rowGap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 8, gap: 16, alignItems: 'center' }}>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 13 }}>
          {employee && <span style={{ whiteSpace: 'nowrap' }}>{employee.fullName}</span>}
          {employee && <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', whiteSpace: 'nowrap' }}>خروج</button>}
        </div>
      </header>
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}
