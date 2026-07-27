import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { resolveAccessForPermitLink } from '../../services/permitsService.js';
import { sanitizeDigitsOnly } from '../../hooks/useArabicIndicDigits.js';
import { useSession } from '../../hooks/useSession.js';
import { setStoredSession } from '../../services/authService.js';
import OtpCodeInput from '../../components/common/OtpCodeInput.jsx';
import PermitDocumentViewer from '../../components/permit/PermitDocumentViewer.jsx';
import { ACCESS_MODE } from '../../config/constants.js';

const INTERACTIVE_MODES = [
  ACCESS_MODE.INTERACTIVE_SOURCE,
  ACCESS_MODE.INTERACTIVE_RECEIVER,
  ACCESS_MODE.INTERACTIVE_SOURCE_CLOSE,
  ACCESS_MODE.ADMIN_FULL
];

// تصريح مغلق/ملغي أصبح نهائيًا - لا معنى لمطالبة أي طرف برقم البرنامج التشغيلي أو
// الرمز السري بعد الآن (لن يُمنح أي وصول تفاعلي بعد الآن مهما أُدخل)؛ يُعرض للجميع
// كنسخة قراءة فقط مباشرة دون أي بوابة إضافية.
const FINISHED_STATUSES = ['مغلق', 'ملغي'];

/**
 * الصفحة التي يفتحها الرابط الدائم للتصريح أو مسح رمز QR (نفس المنطق تمامًا للحالتين).
 * تطبّق منطق التحكم بالوصول: زائر غير مسجل / مسجل غير معنيّ / طرف فعلي / مدير.
 * إن كان صاحب الجلسة الحالية طرفًا فعليًا في التصريح (مصدره أو مستلمه) يُفتح النموذج
 * التفاعلي مباشرة دون طلب إدخال يدوي. أما مستلم جديد غير مُكلَّف بعد فيُطلب منه إدخال
 * رقم البرنامج التشغيلي للتحقق من مطابقته لهذا العطل تحديدًا قبل منحه الوصول التفاعلي.
 */
export default function PermitLinkPage() {
  const [params] = useSearchParams();
  const creationId = params.get('id');
  const { employee: sessionEmployee } = useSession();

  const [employeeIdInput, setEmployeeIdInput] = useState(sessionEmployee ? sessionEmployee.employeeId : '');
  const [programNumberInput, setProgramNumberInput] = useState('');
  const [secretCodeInput, setSecretCodeInput] = useState('');
  const [access, setAccess] = useState(null);
  const [pendingReadOnlyAccess, setPendingReadOnlyAccess] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const resolve = async (idToCheck, programNumber, secretCode) => {
    setLoading(true);
    setError('');
    try {
      const result = await resolveAccessForPermitLink(idToCheck || null, creationId, programNumber, secretCode);
      // يُخزَّن توكن الجلسة الذي يُصدره الخادم عند التحقق من الرقم الوظيفي هنا - بدونه
      // تفشل أي إجراءات كتابة لاحقة (تأكيد الاستلام، الإغلاق...) بخطأ "توكن جلسة غير صالح"
      // لأن من فتح الرابط مباشرة (بدون المرور بصفحة تسجيل الدخول) لا يملك توكن أصلًا.
      if (result.token && result.employee) {
        setStoredSession({ token: result.token, employee: result.employee });
      }
      if (INTERACTIVE_MODES.indexOf(result.mode) !== -1) {
        setAccess(result);
        setChecked(true);
      } else if (FINISHED_STATUSES.indexOf(result.status) !== -1) {
        // التصريح مغلق/ملغي نهائيًا - عرض مباشر كقراءة فقط دون أي بوابة أو مطالبة برقم
        // برنامج تشغيلي/رمز سري (لا يوجد أي مسار يمنح وصولًا تفاعليًا بعد الإغلاق أصلًا).
        setAccess(result);
        setChecked(true);
      } else {
        // نتيجة للقراءة فقط: نُبقي البوابة ظاهرة لإتاحة فرصة إدخال رقم البرنامج التشغيلي
        // (في حال كان هذا مستلمًا جديدًا لم يُكلَّف بعد)، مع خيار المتابعة كقراءة فقط مباشرة.
        setPendingReadOnlyAccess(result);
      }
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

  // لصاحب جلسة حالية (مسجَّل دخول)، التحقق التلقائي الأول يتم بصمت دون عرض بوابة
  // إدخال الرقم الوظيفي كاملة - يظهر فقط تحميل بسيط بدل ومضة نموذج إدخال مربكة.
  if (!checked && sessionEmployee && loading && !pendingReadOnlyAccess && !error) {
    return <div style={{ padding: 30, textAlign: 'center' }}>جارٍ فتح التصريح...</div>;
  }

  if (!checked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 16 }}>
        <div className="app-card" style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontSize: 15 }}>الرجاء إدخال الرقم الوظيفي لعرض هذا التصريح</h2>
          <input
            type="text"
            inputMode="numeric"
            placeholder="الرقم الوظيفي (اتركه فارغًا للعرض كزائر)"
            value={employeeIdInput}
            onChange={(e) => setEmployeeIdInput(sanitizeDigitsOnly(e.target.value))}
            style={{ width: '100%', marginTop: 12 }}
          />

          {pendingReadOnlyAccess && pendingReadOnlyAccess.employee && (
            <>
              <div style={{ fontSize: 12, color: '#888', marginTop: 10 }}>
                إن كنت المستلم المُكلَّف بهذا التصريح، أدخل رقم البرنامج التشغيلي والرمز السري الذي أرسله لك المصدر:
              </div>
              <input
                type="text"
                placeholder="رقم البرنامج التشغيلي"
                value={programNumberInput}
                onChange={(e) => setProgramNumberInput(sanitizeDigitsOnly(e.target.value))}
                style={{ width: '100%', marginTop: 6 }}
              />
              <div style={{ marginTop: 10 }}>
                <OtpCodeInput value={secretCodeInput} onChange={setSecretCodeInput} length={6} />
              </div>
            </>
          )}

          {error && <div style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 8 }}>{error}</div>}

          <button className="primary" disabled={loading} onClick={() => resolve(employeeIdInput, programNumberInput, secretCodeInput)} style={{ width: '100%', marginTop: 12 }}>
            {loading ? 'جارٍ التحقق...' : 'متابعة'}
          </button>

          {pendingReadOnlyAccess && (
            <button
              disabled={loading}
              onClick={() => { setAccess(pendingReadOnlyAccess); setChecked(true); }}
              style={{ width: '100%', marginTop: 8, background: '#eee', color: '#333' }}
            >
              المتابعة كعرض للقراءة فقط
            </button>
          )}

          {sessionEmployee && (
            <div style={{ marginTop: 12 }}>
              <Link to="/source/records" style={{ fontSize: 12 }}>العودة إلى سجلاتي</Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    // بدون شريط تنقّل/رجوع علوي منفصل هنا عمدًا - هيدر PermitDocumentViewer نفسه (سهم
    // الرجوع المدمج) يكفي وحده الآن، بدل تكرار عنصر "رجوع" قديم فوقه من واجهة سابقة.
    // بلا حشوة علوية إطلاقًا (فقط Safe Area الفعلية للجهاز) كي يلامس الهيدر الملوّن أعلى
    // الشاشة تمامًا بلا فراغ أبيض فوقه، وحشوة أفقية مصغّرة (12px بدل 24px) لاستغلال أوسع
    // لعرض الشاشة على الجوال - الحشوة الداخلية لكل بطاقة تبقى سخية (20px) بلا تغيير.
    <div className="permit-link-page-wrap" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 16, paddingLeft: 12, paddingRight: 12 }}>
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
