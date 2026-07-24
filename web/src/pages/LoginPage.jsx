import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmployeeId } from '../services/authService.js';
import { getPublicSettings, applyColorsFromSettings } from '../services/settingsService.js';
import { sanitizeDigitsOnly } from '../hooks/useArabicIndicDigits.js';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemName, setSystemName] = useState('نظام تصاريح العمل');
  const navigate = useNavigate();

  useEffect(() => {
    getPublicSettings()
      .then((rows) => {
        applyColorsFromSettings(rows);
        const nameRow = rows.find((r) => r.key === 'SYSTEM NAME');
        if (nameRow) setSystemName(nameRow.valueAr);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setEmployeeId(sanitizeDigitsOnly(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!employeeId) {
      setError('الرجاء إدخال الرقم الوظيفي.');
      return;
    }
    setLoading(true);
    try {
      const result = await loginWithEmployeeId(employeeId);
      if (result.employee.role === 'مصدر' || result.employee.isAdmin) {
        navigate('/source/create');
      } else {
        navigate('/source/records');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 16 }}>
      <div className="app-card" style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <img src="/Permits-PTW-SFT/logo.png" alt="الشعار" style={{ width: 96, height: 96, objectFit: 'contain', margin: '0 auto 12px' }} />
        <h1 style={{ fontSize: 18, color: 'var(--color-primary)' }}>{systemName}</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="الرقم الوظيفي"
            value={employeeId}
            onChange={handleChange}
            autoFocus
          />
          {error && <div style={{ color: 'var(--color-error)', fontSize: 13 }}>{error}</div>}
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
