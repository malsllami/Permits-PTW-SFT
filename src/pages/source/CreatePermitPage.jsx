import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPermit } from '../../services/permitsService.js';
import { getAllSettings } from '../../services/settingsService.js';
import AppLayout from '../../components/common/AppLayout.jsx';

export default function CreatePermitPage() {
  const [permitType, setPermitType] = useState('PTW');
  const [voltageLevel, setVoltageLevel] = useState('');
  const [voltageOptions, setVoltageOptions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getAllSettings().then((rows) => {
      const options = rows.filter((r) => r.group === 'مستوى الجهد لتصريح PTW');
      setVoltageOptions(options);
      if (options[0]) setVoltageLevel(options[0].valueEn || options[0].valueAr);
    }).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await createPermit(permitType, permitType === 'PTW' ? voltageLevel : undefined);
      navigate('/permit?id=' + result.creationId);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="إنشاء تصريح جديد">
      <div className="app-card" style={{ maxWidth: 480, margin: '20px auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <label style={{ flex: 1, textAlign: 'center', border: '2px solid ' + (permitType === 'PTW' ? 'var(--color-primary)' : '#ddd'), borderRadius: 12, padding: 12, cursor: 'pointer' }}>
            <input type="radio" name="permitType" checked={permitType === 'PTW'} onChange={() => setPermitType('PTW')} style={{ display: 'none' }} />
            <div style={{ fontWeight: 'bold' }}>PTW</div>
            <div style={{ fontSize: 11 }}>تصريح العمل</div>
          </label>
          <label style={{ flex: 1, textAlign: 'center', border: '2px solid ' + (permitType === 'SFT' ? 'var(--color-secondary)' : '#ddd'), borderRadius: 12, padding: 12, cursor: 'pointer' }}>
            <input type="radio" name="permitType" checked={permitType === 'SFT'} onChange={() => setPermitType('SFT')} style={{ display: 'none' }} />
            <div style={{ fontWeight: 'bold' }}>SFT</div>
            <div style={{ fontSize: 11 }}>تصريح التعميد بالاختبار</div>
          </label>
        </div>

        {permitType === 'PTW' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 6 }}>مستوى الجهد</div>
            <select value={voltageLevel} onChange={(e) => setVoltageLevel(e.target.value)} style={{ width: '100%' }}>
              {voltageOptions.map((opt) => (
                <option key={opt.key} value={opt.valueEn || opt.valueAr}>{opt.valueAr}</option>
              ))}
            </select>
          </div>
        )}

        {error && <div style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <button className="primary" disabled={loading} onClick={handleCreate} style={{ width: '100%' }}>
          {loading ? 'جارٍ الإنشاء...' : 'إنشاء التصريح'}
        </button>
      </div>
    </AppLayout>
  );
}
