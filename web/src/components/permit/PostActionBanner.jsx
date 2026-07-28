import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';

/**
 * بانر تأكيد يظهر فقط في نفس الجلسة التي أُنجز فيها إجراء رئيسي (توليد رقم/استلام/إغلاق) -
 * زر "الرئيسية" يدوي دائم الظهور، مع عدّاد تنازلي وعودة تلقائية اختيارية (autoRedirectSeconds
 * أكبر من صفر) مدتها يتحكم بها المدير من "الإعدادات العامة" > POST ACTION REDIRECT SECONDS.
 * تمرير 0 يعطّل العدّاد التلقائي تمامًا - يبقى الزر اليدوي فقط (يُستخدم للحالات التي يجب
 * على المستخدم فيها مشاركة رمز سري قبل المغادرة، فلا يجوز تحويله بعيدًا قسرًا).
 */
export default function PostActionBanner({ message, autoRedirectSeconds }) {
  const navigate = useNavigate();
  const seconds = Number(autoRedirectSeconds) > 0 ? Number(autoRedirectSeconds) : 0;
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!seconds) return;
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((r) => (r > 1 ? r - 1 : 0));
    }, 1000);
    const timer = setTimeout(() => navigate('/source/home'), seconds * 1000);
    return () => { clearInterval(interval); clearTimeout(timer); };
    // eslint-disable-next-line
  }, [seconds]);

  return (
    <div className="no-print" style={{ background: '#EAF7EE', border: '1.5px solid var(--color-success)', borderRadius: 'var(--radius-lg)', padding: 12, marginTop: 10, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 'bold', fontSize: 13, color: '#1B5E20' }}>
        <Icon name="check_circle" size={18} /> {message}
      </div>
      {seconds > 0 && (
        <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>سيتم التحويل للرئيسية تلقائيًا خلال {remaining} ثانية</div>
      )}
      <button className="primary" onClick={() => navigate('/source/home')} style={{ marginTop: 8, width: '100%' }}>الرئيسية</button>
    </div>
  );
}
