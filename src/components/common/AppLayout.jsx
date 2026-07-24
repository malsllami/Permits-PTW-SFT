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
      <header style={{ background: 'var(--color-primary)', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <img src="/Permits-PTW-SFT/logo.png" alt="الشعار" style={{ height: 32 }} />
          <strong>{title}</strong>
          {employee && (
            <nav style={{ display: 'flex', gap: 10, fontSize: 13 }}>
              <Link to="/source/create" style={{ color: '#fff' }}>إنشاء تصريح</Link>
              <Link to="/source/records" style={{ color: '#fff' }}>سجلاتي</Link>
              {employee.isAdmin && <Link to="/admin" style={{ color: '#fff' }}>لوحة المدير</Link>}
            </nav>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
          {employee && <span>{employee.fullName}</span>}
          {employee && <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>خروج</button>}
        </div>
      </header>
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}
