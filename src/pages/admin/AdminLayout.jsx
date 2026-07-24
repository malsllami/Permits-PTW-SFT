import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import AppLayout from '../../components/common/AppLayout.jsx';
import AdminGate from './AdminGate.jsx';

const links = [
  { to: '/admin', label: 'لوحة التحكم', end: true },
  { to: '/admin/employees', label: 'الموظفون' },
  { to: '/admin/permits', label: 'التصاريح' },
  { to: '/admin/operations-log', label: 'سجل العمليات' },
  { to: '/admin/settings', label: 'الإعدادات' }
];

export default function AdminLayout() {
  return (
    <AppLayout title="لوحة المدير">
      <AdminGate>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              style={({ isActive }) => ({
                padding: '8px 14px', borderRadius: 999, fontSize: 13, textDecoration: 'none',
                background: isActive ? 'var(--color-primary)' : '#eef0f3',
                color: isActive ? '#fff' : 'var(--color-text)'
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </AdminGate>
    </AppLayout>
  );
}
