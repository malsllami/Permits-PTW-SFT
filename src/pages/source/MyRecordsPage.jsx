import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPermits } from '../../services/permitsService.js';
import AppLayout from '../../components/common/AppLayout.jsx';
import StickyHeaderTable from '../../components/common/StickyHeaderTable.jsx';

export default function MyRecordsPage() {
  const [permits, setPermits] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const navigate = useNavigate();

  const load = () => {
    searchPermits({ permitType: typeFilter || undefined }).then(setPermits).catch(() => {});
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [typeFilter]);

  const filtered = permits.filter((p) =>
    !query || (p['معرف انشاء التصريح'] || '').includes(query) || (p['نوع التصريح'] || '').includes(query)
  );

  const columns = [
    { key: 'type', label: 'النوع' },
    { key: 'status', label: 'الحالة' },
    { key: 'date', label: 'تاريخ الإنشاء' },
    { key: 'open', label: 'التفاصيل' }
  ];

  return (
    <AppLayout title="سجلاتي">
      <div className="app-card" style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input placeholder="بحث بالمعرّف أو النوع" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">كل الأنواع</option>
          <option value="PTW">PTW</option>
          <option value="SFT">SFT</option>
        </select>
      </div>

      <div className="app-card">
        <StickyHeaderTable
          columns={columns}
          rows={filtered}
          renderRow={(p) => (
            <>
              <td>{p['نوع التصريح']}</td>
              <td>{p['حالة التصريح']}</td>
              <td>{p['تاريخ الانشاء']}</td>
              <td>
                <button onClick={() => navigate('/permit?id=' + p['معرف انشاء التصريح'])} style={{ background: 'var(--color-primary)', color: '#fff', fontSize: 11 }}>
                  فتح
                </button>
              </td>
            </>
          )}
        />
      </div>
    </AppLayout>
  );
}
