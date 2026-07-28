import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPermits } from '../../services/permitsService.js';
import AppLayout from '../../components/common/AppLayout.jsx';
import StickyHeaderTable from '../../components/common/StickyHeaderTable.jsx';
import { convertArabicDigitsToEnglish } from '../../hooks/useArabicIndicDigits.js';
import { formatDateTimeShort, combineDateAndTime } from '../../hooks/useHijriGregorianDate.js';

// حالات ما بعد توليد رقم التصريح (بعد اعتماد المصدر) - أي شيء غير هذه المجموعة قبل التوليد.
const ISSUED_STATUSES = ['نشط', 'بانتظار إغلاق المصدر', 'بانتظار تأكيد الإلغاء من المصدر'];

/** لون خلفية الصف حسب مرحلة التصريح - يسمح بمسح سريع للحالة دون فتح كل تصريح على حدة. */
function getRowColor(p) {
  const status = p['حالة التصريح'];
  if (status === 'مغلق') return '#DFF5E1'; // أخضر فاتح - مكتمل
  if (status === 'ملغي') return '#F3D6D6'; // أحمر فاتح - ملغي
  if (ISSUED_STATUSES.indexOf(status) !== -1) return '#FFE3C2'; // برتقالي فاتح - جاري العمل (رقم صادر)
  // قبل توليد رقم التصريح: تمييز حسب النوع
  return p['نوع التصريح'] === 'PTW' ? '#FBE0EA' : '#FDF6D8'; // PTW زهري فاتح / SFT أصفر فاتح
}

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
      <div className="app-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="بحث بالمعرّف أو النوع" value={query} onChange={(e) => setQuery(convertArabicDigitsToEnglish(e.target.value))} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">كل الأنواع</option>
            <option value="PTW">PTW</option>
            <option value="SFT">SFT</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 14, rowGap: 8, fontSize: 12, fontWeight: 'bold', flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: '1px solid #eef0f3' }}>
          <LegendDot color="#FBE0EA" label="PTW قبل الإصدار" />
          <LegendDot color="#FDF6D8" label="SFT قبل الإصدار" />
          <LegendDot color="#FFE3C2" label="جاري العمل (صدر رقم)" />
          <LegendDot color="#DFF5E1" label="مغلق" />
          <LegendDot color="#F3D6D6" label="ملغي" />
        </div>
      </div>

      <div className="app-card">
        <StickyHeaderTable
          columns={columns}
          rows={filtered}
          getRowStyle={(p) => ({ background: getRowColor(p) })}
          renderRow={(p) => (
            <>
              <td>{p['نوع التصريح']}</td>
              <td>{p['حالة التصريح']}</td>
              <td>{formatDateTimeShort(combineDateAndTime(p['تاريخ الانشاء'], p['وقت الانشاء']))}</td>
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

function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'inline-block', border: '1px solid #0003', flexShrink: 0 }} />
      {label}
    </span>
  );
}
