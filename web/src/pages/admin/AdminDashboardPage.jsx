import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../../services/settingsService.js';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {});
  }, []);

  if (!stats) return <div style={{ padding: 20 }}>جارٍ تحميل الإحصائيات...</div>;

  const tiles = [
    { label: 'تصاريح اليوم', value: stats.permitsToday },
    { label: 'النشطة', value: stats.active },
    { label: 'المغلقة', value: stats.closed },
    { label: 'الملغاة', value: stats.cancelled },
    { label: 'بانتظار المستلم', value: stats.waitingReceiver },
    { label: 'بانتظار المصدر', value: stats.waitingIssuerApproval },
    { label: 'بانتظار إغلاق المصدر', value: stats.waitingIssuerClose },
    { label: 'متوسط زمن الإصدار (دقيقة)', value: stats.avgIssueMinutes },
    { label: 'عدد الموظفين', value: stats.employeesCount }
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {tiles.map((tile) => (
          <div key={tile.label} className="app-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-primary)' }}>{tile.value}</div>
            <div style={{ fontSize: 12 }}>{tile.label}</div>
          </div>
        ))}
      </div>

      <div className="app-card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14 }}>آخر العمليات</h3>
        <div className="table-scroll-wrap">
          <table className="app-table">
            <thead>
              <tr><th>العملية</th><th>الاسم</th><th>الدور</th><th>التاريخ والوقت</th></tr>
            </thead>
            <tbody>
              {stats.recentOperations.map((op, idx) => (
                <tr key={idx}>
                  <td>{op['العملية']}</td>
                  <td>{op['الاسم']}</td>
                  <td>{op['الدور']}</td>
                  <td>{op['التاريخ والوقت']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
