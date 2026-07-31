import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../hooks/useSession.js';

export default function AppLayout({ title, children }) {
  const { employee, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const isInAdmin = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      {/* رأس الموقع (الشعار/التنقل/تسجيل الخروج) لا ينتمي لمستند الطباعة/PDF إطلاقًا - كان
          يُطبع سابقًا فوق كل صفحة لأنه لم يكن مُستثنى بـ no-print، بعكس مطلب التصميم الصريح
          بمنع ظهور أي عنصر من واجهة الموقع (Header/Sidebar/Buttons) داخل المستند المطبوع. */}
      <header className="no-print" style={{ position: 'relative', overflow: 'hidden', color: '#fff', padding: '12px 20px' }}>
        {/* خلفية الهيدر بلوني شعار "السعودية للطاقة" (أزرق/تركوازي) - مزيج متدرّج واحد متصل
            بلا أي خط فاصل بين اللونين: أزرق خالص عند الطرف الأيمن يمتد كخط رفيع نحو الوسط
            حيث يبدأ التركوازي بالتشكّل تدريجيًا حتى يسيطر عند الطرف الأيسر (والعكس تمامًا
            للأزرق). تركوازي بدرجة أهدأ (أقل تشبّعًا) بدل الدرجة الصارخة السابقة، وبلا أي خط
            زخرفي إضافي فوق التدرّج (كان يشوّه الهيدر بلا داعٍ). */}
        <svg
          viewBox="0 0 1440 100" preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
        >
          <defs>
            <linearGradient id="hdrBlend" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#1668A8" />
              <stop offset="33%" stopColor="#1668A8" />
              <stop offset="50%" stopColor="#2B7D82" />
              <stop offset="67%" stopColor="#348C86" />
              <stop offset="100%" stopColor="#348C86" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1440" height="100" fill="url(#hdrBlend)" />
        </svg>
        {/* صفّان واضحان بدل تدفّق حر واحد - كان يُكدِّس كل العناصر عند الحافة اليمنى فور ضيق
            الشاشة (الجوال) لأن عنصرَي flex الرئيسيَين يلتفّان لسطرين منفصلين بدل توزيع كل
            سطر بين طرفَي الهيدر، فيتضخّم ارتفاع الهيدر بلا داعٍ. الصف الأول: الشعار والعنوان
            (يمين) مقابل رابط لوحة المدير (يسار، للمدير فقط). الصف الثاني: اسم الموظف (يمين)
            مقابل زر الخروج (يسار) - كل صف يوزَّع بين طرفيه دائمًا مهما ضاق العرض. */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/Permits-PTW-SFT/logo.png" alt="الشعار" style={{ height: 32 }} />
            <strong>{title}</strong>
          </div>
          {/* لا قوائم إطلاقًا للموظف العادي (مصدر/مستلم) - شاشة "الرئيسية" الموحّدة هي الصفحة
              الوحيدة له (بطاقة بياناته + بطاقات الإنشاء + بطاقات تصاريحه)، فلا حاجة لأي رابط
              تنقّل آخر. المدير وحده يحتفظ برابط تنقّل، لكنه يتبدّل حسب مكانه الحالي: "لوحة
              المدير" وهو خارجها، أو "الرئيسية" وهو داخلها بالفعل - بدل تكرار رابط يوصله لنفس
              الصفحة التي هو فيها أصلًا. */}
          {employee && employee.isAdmin && (
            <nav style={{ display: 'flex', gap: 10, fontSize: 13 }}>
              {isInAdmin ? (
                <Link to="/source/home" className="header-link" style={{ whiteSpace: 'nowrap' }}>الرئيسية</Link>
              ) : (
                <Link to="/admin" className="header-link" style={{ whiteSpace: 'nowrap' }}>لوحة المدير</Link>
              )}
            </nav>
          )}
        </div>
        {employee && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 13 }}>
            <span style={{ whiteSpace: 'nowrap' }}>{employee.fullName}</span>
            <button onClick={handleLogout} className="header-btn" style={{ whiteSpace: 'nowrap' }}>خروج</button>
          </div>
        )}
      </header>
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}
