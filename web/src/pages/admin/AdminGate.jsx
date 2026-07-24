import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useSession.js';
import { hasLocalWebAuthnCredential, registerDeviceBiometric, authenticateDeviceBiometric } from '../../services/webauthnService.js';

const ADMIN_VERIFIED_KEY = 'admin_verified_this_session';

/**
 * بوابة الدخول للوحة المدير: تطلب "بصمة الجهاز" (WebAuthn). أول مرة على هذا الجهاز
 * تبدأ دورة تسجيل، والمرات التالية دورة مصادقة. عند الفشل يبقى المستخدم في لوحة المصدر.
 */
export default function AdminGate({ children }) {
  const { employee } = useSession();
  const [status, setStatus] = useState('checking'); // checking | prompt | verifying | verified | denied
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_VERIFIED_KEY) === 'true') {
      setStatus('verified');
    } else {
      setStatus('prompt');
    }
  }, []);

  if (!employee || !employee.isAdmin) {
    return (
      <div style={{ padding: 30, textAlign: 'center' }}>
        هذه الصفحة متاحة فقط للمدير. <Link to="/source/create">العودة</Link>
      </div>
    );
  }

  const handleVerify = async () => {
    setStatus('verifying');
    setError('');
    try {
      if (hasLocalWebAuthnCredential(employee.employeeId)) {
        await authenticateDeviceBiometric(employee.employeeId);
      } else {
        await registerDeviceBiometric(employee.employeeId, navigator.platform);
      }
      sessionStorage.setItem(ADMIN_VERIFIED_KEY, 'true');
      setStatus('verified');
    } catch (e) {
      setError(e.message);
      setStatus('denied');
    }
  };

  if (status === 'verified') return children;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="app-card" style={{ maxWidth: 360, textAlign: 'center' }}>
        <h2 style={{ fontSize: 15 }}>مطلوب التحقق ببصمة الجهاز للدخول للوحة المدير</h2>
        {error && <div style={{ color: 'var(--color-error)', fontSize: 13, margin: '10px 0' }}>{error}</div>}
        <button className="primary" onClick={handleVerify} disabled={status === 'verifying'} style={{ width: '100%', marginTop: 10 }}>
          {status === 'verifying' ? 'جارٍ التحقق...' : 'المتابعة ببصمة الجهاز'}
        </button>
        {status === 'denied' && (
          <div style={{ marginTop: 10 }}>
            <Link to="/source/create">العودة للوحة المصدر</Link>
          </div>
        )}
      </div>
    </div>
  );
}
