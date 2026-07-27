import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPermits, reopenPermit, cancelPermitByAdmin } from '../../services/permitsService.js';
import StickyHeaderTable from '../../components/common/StickyHeaderTable.jsx';
import QRCodeView from '../../components/common/QRCodeView.jsx';
import { formatDateTimeShort } from '../../hooks/useHijriGregorianDate.js';

export default function AdminPermitsPage() {
  const [permits, setPermits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [shareLink, setShareLink] = useState('');
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
            <td>{formatDateTimeShort(p['تاريخ الانشاء'])}</td>
            <td style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/permit?id=' + p['معرف انشاء التصريح'])} style={{ fontSize: 11 }}>فتح</button>
              <button onClick={() => setShareLink(p['رابط التصريح'])} style={{ fontSize: 11, background: 'var(--color-primary)', color: '#fff' }}>مشاركة</button>
              <button onClick={() => reopenPermit(p['معرف انشاء التصريح']).then(load)} style={{ fontSize: 11 }}>إعادة فتح</button>
              <button onClick={() => cancelPermitByAdmin(p['معرف انشاء التصريح'], 'إلغاء إداري').then(load)} style={{ fontSize: 11, background: 'var(--color-error)', color: '#fff' }}>إلغاء</button>
            </td>
          </>
        )}
      />
      {/* الأرشفة تلقائية بالكامل (28 ساعة بعد إغلاق المصدر) - لا يوجد زر أرشفة يدوي بقصد. */}

      {shareLink && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setShareLink('')}
        >
          <div className="app-card" style={{ maxWidth: 320, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 14 }}>مشاركة رابط التصريح</h3>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
              <QRCodeView link={shareLink} size={160} />
            </div>
            <div style={{ fontSize: 11, wordBreak: 'break-all', background: '#f5f7fa', padding: 8, borderRadius: 8 }}>{shareLink}</div>
            <button className="primary" onClick={() => navigator.clipboard.writeText(shareLink)} style={{ width: '100%', marginTop: 10 }}>نسخ الرابط</button>
            <button onClick={() => setShareLink('')} style={{ width: '100%', marginTop: 8, background: '#eee', color: '#333' }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
