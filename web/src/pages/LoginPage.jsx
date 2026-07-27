import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmployeeId } from '../services/authService.js';
import { getPublicSettings, applyColorsFromSettings } from '../services/settingsService.js';
import { sanitizeDigitsOnly } from '../hooks/useArabicIndicDigits.js';

/**
 * شاشة تسجيل الدخول - بسيطة ومحايدة الهوية عمدًا (أزرق/أبيض/رمادي فقط، بلا أحمر مصدر
 * أو أصفر مستلم) حتى لا تُلمّح لدور معيّن قبل معرفة هوية المستخدم فعليًا بعد الدخول.
 */
export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemName, setSystemName] = useState('نظام تصاريح العمل الكهربائي');
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [companyNameEn, setCompanyNameEn] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getPublicSettings()
      .then((rows) => {
        applyColorsFromSettings(rows);
        const nameRow = rows.find((r) => r.key === 'SYSTEM NAME');
        if (nameRow) setSystemName(nameRow.valueAr);
        const companyRow = rows.find((r) => r.key === 'COMPANY NAME');
        if (companyRow) {
          setCompanyNameAr(companyRow.valueAr);
          setCompanyNameEn(companyRow.valueEn);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setEmployeeId(sanitizeDigitsOnly(e.target.value));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!employeeId) {
      setError('الرجاء إدخال الرقم الوظيفي.');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      // الشاشة الرئيسية موحّدة لكل الأدوار الآن (قسم 3/15 بدليل التصميم) - لا يوجد تحويل
      // مختلف حسب الدور بعد تسجيل الدخول، كل موظف يرى نفس الشاشة وتُظهر له البطاقات
      // المناسبة لدوره فقط.
      await loginWithEmployeeId(employeeId);
      navigate('/source/home');
    } catch (err) {
      setError(err.message || 'الرقم الوظيفي غير مسجل في النظام.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', padding: 16, boxSizing: 'border-box', background: '#F5F7FB'
    }}>
      <div style={{ width: '92%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src="/Permits-PTW-SFT/logo.png" alt="الشعار"
          style={{ width: 110, height: 110, objectFit: 'contain', margin: '0 auto 12px' }}
        />

        {/* بطاقة تعريف مصغّرة أسفل الشعار مباشرة - هوية النظام قبل نموذج الدخول نفسه. */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 36, fontWeight: 'bold', color: 'var(--color-primary)', margin: 0, lineHeight: 1.25 }}>{systemName}</h1>
          <div style={{ fontSize: 16, color: 'var(--color-text)', opacity: 0.7, marginTop: 4 }}>Electrical Permit To Work System</div>
          {companyNameAr && <div style={{ fontSize: 13, color: 'var(--color-text)', opacity: 0.55, marginTop: 6 }}>{companyNameAr}</div>}
        </div>

        {/* بطاقة تسجيل الدخول. */}
        <div style={{ width: '100%', background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,.08)', boxSizing: 'border-box' }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--color-text)', marginBottom: 16, textAlign: 'center' }}>تسجيل الدخول</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--color-text)', opacity: 0.75, display: 'block', marginBottom: 6 }}>الرقم الوظيفي</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="أدخل الرقم الوظيفي"
                value={employeeId}
                onChange={handleChange}
                autoFocus
                style={{
                  height: 52, borderRadius: 14, width: '100%', boxSizing: 'border-box',
                  border: error ? '1.5px solid var(--color-error)' : '1px solid var(--color-border)'
                }}
              />
              {error && <div style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 6 }}>{error}</div>}
            </div>
            <button
              type="submit" disabled={loading}
              className="login-submit-btn"
              style={{ height: 52, borderRadius: 14, width: '100%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading && <span className="spinner" />}
              {loading ? 'جارٍ التحقق...' : 'دخول'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {companyNameAr && <div style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--color-text)', opacity: 0.6 }}>{companyNameAr}</div>}
          {companyNameEn && <div style={{ fontSize: 12, color: 'var(--color-text)', opacity: 0.45 }}>{companyNameEn}</div>}
          <div style={{ fontSize: 11, color: 'var(--color-text)', opacity: 0.35, marginTop: 6 }}>Version 1.0.0</div>
        </div>
      </div>
    </div>
  );
}
