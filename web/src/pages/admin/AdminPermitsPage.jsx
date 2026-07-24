import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPermits, reopenPermit, cancelPermitByAdmin, manualArchiveByAdmin } from '../../services/permitsService.js';
import StickyHeaderTable from '../../components/common/StickyHeaderTable.jsx';

export default function AdminPermitsPage() {
  const [permits, setPermits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const load = () => searchPermits({ status: statusFilter || undefined }).then(setPermits).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const columns = [
    { key: 'type', label: 'النوع' }, { key: 'status', label: 'الحالة' },
    { key: 'creator', label: 'منشئ التصريح' }, { key: 'date', label: 'تاريخ الإنشاء' }, { key: 'actions', label: 'إجراءات' }
  ];

  return (
    <div className="app-card">
      <div style={{ marginBottom: 10 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="نشط">نشط</option>
          <option value="مغلق">مغلق</option>
          <option value="ملغي">ملغي</option>
        </select>
      </div>
      <StickyHeaderTable
        columns={columns}
        rows={permits}
        renderRow={(p) => (
          <>
            <td>{p['نوع التصريح']}</td>
            <td>{p['حالة التصريح']}</td>
            <td>{p['الرقم الوظيفي لمنشئ التصريح']}</td>
            <td>{p['تاريخ الانشاء']}</td>
            <td style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/permit?id=' + p['معرف انشاء التصريح'])} style={{ fontSize: 11 }}>فتح</button>
              <button onClick={() => reopenPermit(p['معرف انشاء التصريح']).then(load)} style={{ fontSize: 11 }}>إعادة فتح</button>
              <button onClick={() => cancelPermitByAdmin(p['معرف انشاء التصريح'], 'إلغاء إداري').then(load)} style={{ fontSize: 11, background: 'var(--color-error)', color: '#fff' }}>إلغاء</button>
              <button onClick={() => manualArchiveByAdmin(p['معرف انشاء التصريح'], 'أرشفة يدوية مبكرة').then(load)} style={{ fontSize: 11, background: 'var(--color-secondary)', color: '#fff' }}>أرشفة</button>
            </td>
          </>
        )}
      />
    </div>
  );
}
