import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPermits } from '../../services/permitsService.js';
import { getMyProfile, getMyClosingStats } from '../../services/employeesService.js';
import AppLayout from '../../components/common/AppLayout.jsx';
import EmployeeInfoCard from '../../components/common/EmployeeInfoCard.jsx';
import CreatePermitCard from '../../components/source/CreatePermitCard.jsx';
import StatsCard from '../../components/common/StatsCard.jsx';
import { useSession } from '../../hooks/useSession.js';
import { hasRole } from '../../utils/roles.js';
import { getPermitStatusColor } from '../../utils/permitFormatting.js';

// تسمية "الإجراء المطلوب مني الآن" لكل حالة تصريح، حسب دور الموظف (مصدر/مستلم) - مطابقة
// لحرفية حالات التصريح الفعلية بالنظام (انظر gas/StatusHelpers.gs).
const SOURCE_ACTION_LABELS = {
  'مسودة': 'لم يكتمل إنشاؤه بعد - أكمل البيانات وشاركه مع المستلم',
  'بانتظار اعتماد المصدر': 'بانتظار مراجعتك واعتماد إصدار رقم التصريح',
  'بانتظار إغلاق المصدر': 'بانتظار إغلاقك النهائي للتصريح',
  'بانتظار تأكيد الإلغاء من المصدر': 'بانتظار تأكيدك لإلغاء التصريح'
};
const RECEIVER_ACTION_LABELS = {
  'بانتظار المستلم': 'بانتظار توقيعك على استلام التصريح',
  'نشط': 'العمل جارٍ - بانتظار إغلاقك عند الانتهاء'
};
// حالة "مؤرشف" فقط هي التي تُخفي التصريح نهائيًا من بطاقة "تصريحي" أدناه - أي حالة أخرى
// (بما فيها "مغلق"/"ملغي" حديثًا) تبقى ظاهرة وقابلة للفتح، قاعدة صريحة: التصريح لا يختفي من
// صفحة منشئه أو صفحة مستلمه إلا بعد إغلاقه النهائي فعليًا وانتقاله للأرشيف، حتى لو أغلقه
// مصدر آخر مداوم. بدون هذا، لا توجد طريقة لإعادة فتح رابط/رمز سري ضاعت رسالته (واتساب محذوفة
// مثلًا)، أو لتغيير المستلم قبل توقيعه، أو لمراجعة/تنزيل PDF تصريح أُغلق للتو.
const ARCHIVED_STATUS = 'مؤرشف';

/**
 * الشاشة الرئيسية - مُعاد تصميمها بالكامل لتكون شاشة "عمل" لا شاشة "متابعة": الموظف يفتحها
 * ليعرف ما يُطلب منه الآن وينفّذه، وليس ليقرأ إحصائيات/سجلات/آخر نشاط. الترتيب المعتمد:
 * ① بطاقة الموظف (بيانات مختصرة) → ② بطاقة إنشاء تصريح (مصدر فقط - بوابة العمل الفعلية) →
 * ③ بطاقة "بانتظار الإجراء" (الأكبر في الصفحة - إجرائية بحتة: فقط ما يحتاج فعلًا لإجراء من
 *    الموظف الآن) → ④ بطاقة "تصريحي" (نظرة عامة: كل تصريح مرتبط بالموظف لا يزال جاريًا أو
 *    أُغلق حديثًا ولم يُؤرشَف بعد - بصرف النظر عن الدور، لضمان عدم فقدان الوصول لرابط/رمز
 *    سري أو لمراجعة تصريح أُغلق للتو) → ⑤ بطاقة عدادات مختصرة جدًا في الأسفل (معلومة فقط،
 *    وليست عملاً). لا رسوم بيانية ولا سجل "آخر نشاط" ولا إشعارات/أخبار - كلها أُزيلت عمدًا.
 */
export default function SourceHomePage() {
  const [permits, setPermits] = useState([]);
  const [profile, setProfile] = useState(null);
  const [closingStats, setClosingStats] = useState(null);
  const navigate = useNavigate();
  const { employee } = useSession();

  useEffect(() => {
    searchPermits({}).then(setPermits).catch(() => {});
    getMyProfile().then(setProfile).catch(() => {});
    getMyClosingStats().then(setClosingStats).catch(() => {});
  }, []);

  const isSource = !!employee && (hasRole(employee.role, 'مصدر') || employee.isAdmin);
  const isReceiver = !!employee && hasRole(employee.role, 'مستلم');

  // "أنشأها" تحديدًا (وليس كل ما يظهر له من searchPermits) - تُستخدَم فقط لعداد الإنشاء.
  const createdPermits = employee ? permits.filter((p) => String(p['الرقم الوظيفي لمنشئ التصريح']) === String(employee.employeeId)) : [];
  const ptwCreatedCount = createdPermits.filter((p) => p['نوع التصريح'] === 'PTW').length;
  const sftCreatedCount = createdPermits.filter((p) => p['نوع التصريح'] === 'SFT').length;
  const ptwReceivedCount = permits.filter((p) => p['نوع التصريح'] === 'PTW').length;
  const sftReceivedCount = permits.filter((p) => p['نوع التصريح'] === 'SFT').length;

  // بطاقة "بانتظار الإجراء" - إجرائية بحتة: فقط ما يحتاج فعلًا لإجراء من الموظف الآن.
  const pendingItems = [];
  permits.forEach((p) => {
    const status = p['حالة التصريح'];
    const base = { id: p['معرف انشاء التصريح'], type: p['نوع التصريح'] };
    if (isSource && SOURCE_ACTION_LABELS[status]) {
      pendingItems.push({ ...base, label: SOURCE_ACTION_LABELS[status], color: 'var(--color-role-source-border)' });
    } else if (isReceiver && RECEIVER_ACTION_LABELS[status]) {
      pendingItems.push({ ...base, label: RECEIVER_ACTION_LABELS[status], color: 'var(--color-role-receiver-border)' });
    }
  });

  // بطاقة "تصريحي" - نظرة عامة: كل تصريح مرتبط بالموظف (منشئ كمصدر أو مُكلَّف كمستلم - نفس
  // منطق الرؤية الذي تطبّقه searchPermits أصلًا) لم يُؤرشَف بعد، بصرف النظر عن الدور أو
  // الحالة (بما فيها "مغلق"/"ملغي" حديثًا) - تسمية كل سطر هي نص الحالة الحقيقي من الشيت
  // مباشرة (بلا صياغة موجّهة) لأن هذه بطاقة معلوماتية وليست إجرائية.
  const myPermitItems = permits
    .filter((p) => p['حالة التصريح'] !== ARCHIVED_STATUS)
    .map((p) => ({ id: p['معرف انشاء التصريح'], type: p['نوع التصريح'], status: p['حالة التصريح'] }));

  return (
    <AppLayout title="الرئيسية">
      <div className="responsive-shell">
        <EmployeeInfoCard profile={profile} />

        {isSource && (
          <section style={{ marginBottom: 16 }}>
            <CreatePermitCard />
          </section>
        )}

        {/* ③ بطاقة "بانتظار الإجراء" - أكبر بطاقة في الصفحة عمدًا، إجرائية بحتة: فقط ما يحتاج
            فعلًا لإجراء من هذا الموظف الآن. */}
        <section className="app-card" style={{ marginBottom: 16, minHeight: 160 }}>
          <strong style={{ fontSize: 16, color: 'var(--color-primary)' }}>بانتظار الإجراء</strong>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingItems.length === 0 && (
              <div style={{ fontSize: 13, opacity: 0.65, textAlign: 'center', padding: '20px 0' }}>
                لا توجد إجراءات مطلوبة حاليًا.
              </div>
            )}
            {pendingItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate('/permit?id=' + item.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                  background: '#fff', border: '1px solid #eef0f3', borderInlineStart: '4px solid ' + item.color,
                  borderRadius: 'var(--radius-md)', padding: '12px 14px', textAlign: 'right', width: '100%'
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 'bold' }}>{item.label}</span>
                <span style={{ fontSize: 11, fontWeight: 'bold', opacity: 0.6, whiteSpace: 'nowrap' }}>{item.type}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ④ بطاقة "تصريحي" - نظرة عامة، وليست إجرائية: كل تصريح مرتبط بالموظف لا يزال جاريًا
            أو أُغلق حديثًا ولم يُؤرشَف بعد، بصرف النظر عن الدور - يبقى ظاهرًا وقابلًا للفتح
            (لإعادة الوصول للرابط/الرمز السري مثلًا لو ضاعت رسالة مشاركته، أو لتغيير المستلم
            قبل توقيعه، أو لمراجعة/تنزيل PDF تصريح أُغلق للتو) حتى ينتقل فعليًا للأرشيف. */}
        <section className="app-card" style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 16, color: 'var(--color-primary)' }}>تصريحي</strong>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myPermitItems.length === 0 && (
              <div style={{ fontSize: 13, opacity: 0.65, textAlign: 'center', padding: '20px 0' }}>
                لا توجد تصاريح جارية حاليًا.
              </div>
            )}
            {myPermitItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate('/permit?id=' + item.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                  background: getPermitStatusColor(item.status, item.type), border: '1px solid #eef0f3',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px', textAlign: 'right', width: '100%'
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>{item.status}</span>
                <span style={{ fontSize: 11, fontWeight: 'bold', opacity: 0.6, whiteSpace: 'nowrap' }}>{item.type}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ⑤ بطاقة عدادات - معلومة فقط (وليست عملاً)، لذا صغيرة وفي أسفل الصفحة، مطويّة
            افتراضيًا (سطر واحد: PTW/SFT الإجمالي) ولا تتوسّع إلا بضغطة لعرض التفصيل الكامل. */}
        <StatsCard
          totalPtw={ptwCreatedCount + ptwReceivedCount}
          totalSft={sftCreatedCount + sftReceivedCount}
        >
          {isSource && <span>PTW أنشأتها: {ptwCreatedCount}</span>}
          {isSource && <span>SFT أنشأتها: {sftCreatedCount}</span>}
          {isReceiver && <span>PTW استلمتها: {ptwReceivedCount}</span>}
          {isReceiver && <span>SFT استلمتها: {sftReceivedCount}</span>}
          {closingStats && <span>مغلقة: {closingStats.totalClosed}</span>}
        </StatsCard>
      </div>
    </AppLayout>
  );
}
