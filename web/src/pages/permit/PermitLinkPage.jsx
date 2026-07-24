import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resolveAccessForPermitLink } from '../../services/permitsService.js';
import { sanitizeDigitsOnly } from '../../hooks/useArabicIndicDigits.js';
import { useSession } from '../../hooks/useSession.js';
import PermitDocumentViewer from '../../components/permit/PermitDocumentViewer.jsx';
import { ACCESS_MODE } from '../../config/constants.js';

/**
 * الصفحة التي يفتحها الرابط الدائم للتصريح أو مسح رمز QR (نفس المنطق تمامًا للحالتين).
 * تطبّق منطق التحكم بالوصول: زائر غير مسجل / مسجل غير معنيّ / طرف فعلي / مدير.
 */
export default function PermitLinkPage() {
  const [params] = useSearchParams();
  const creationId = params.get('id');
  const { employee: sessionEmployee } = useSession();

  const [employeeIdInput, setEmployeeIdInput] = useState(sessionEmployee ? sessionEmployee.employeeId : '');
  const [access, setAccess] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const resolve = async (idToCheck) => {
    setLoading(true);
    setError('');
    try {
      const result = await resolveAccessForPermitLink(idToCheck || null, creationId);
      setAccess(result);
      setChecked(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionEmployee) {
      resolve(sessionEmployee.employeeId);
    }
    // eslint-disable-next-line
  }, []);

  if (!creationId) {
    return <div style={{ padding: 30, textAlign: 'center' }}>رابط التصريح غير صالح.</div>;
  }

  if (!checked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 16 }}>
        <div className="app-card" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontSize: 15 }}>الرجاء إدخال الرقم الوظيفي لعرض هذا التصريح</h2>
          <input
            type="text"
            inputMode="numeric"
            placeholder="الرقم الوظيفي (اتركه فارغًا للعرض كزائر)"
            value={employeeIdInput}
            onChange={(e) => setEmployeeIdInput(sanitizeDigitsOnly(e.target.value))}
            style={{ width: '100%', marginTop: 12 }}
          />
          {error && <div style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 8 }}>{error}</div>}
          <button className="primary" disabled={loading} onClick={() => resolve(employeeIdInput)} style={{ width: '100%', marginTop: 12 }}>
            {loading ? 'جارٍ التحقق...' : 'متابعة'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      {access.mode === ACCESS_MODE.READ_ONLY_UNREGISTERED && (
        <div className="app-card no-print" style={{ maxWidth: 700, margin: '0 auto 12px', textAlign: 'center', fontSize: 13 }}>
          أنت تشاهد نسخة للقراءة فقط من هذا التصريح (رقم وظيفي غير مسجّل بالنظام).
        </div>
      )}
      {access.mode === ACCESS_MODE.READ_ONLY && (
        <div className="app-card no-print" style={{ maxWidth: 700, margin: '0 auto 12px', textAlign: 'center', fontSize: 13 }}>
          أنت تشاهد نسخة للقراءة فقط من هذا التصريح.
        </div>
      )}
      <PermitDocumentViewer creationId={creationId} accessMode={access.mode} currentUser={access.employee} />
    </div>
  );
}
