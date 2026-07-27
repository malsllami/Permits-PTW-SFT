import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPermits, listMyOperations } from '../../services/permitsService.js';
import { getMyProfile, getMyClosingStats } from '../../services/employeesService.js';
import AppLayout from '../../components/common/AppLayout.jsx';
import EmployeeInfoCard from '../../components/common/EmployeeInfoCard.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import CreatePermitCard from '../../components/source/CreatePermitCard.jsx';
import { useSession } from '../../hooks/useSession.js';
import { hasRole } from '../../utils/roles.js';
import { formatDateTimeShort } from '../../hooks/useHijriGregorianDate.js';

/**
 * الشاشة الرئيسية - موحّدة لكل الأدوار (قسم 3/15 بدليل التصميم): بطاقة بيانات الموظف، ثم
 * بطاقة الإنشاء (مصدر/مدير فقط) بعدد PTW/SFT المُنشأ فقط (وليس حالتها - قسم 5)، ثم بطاقة
 * الاستلام (مستلم فقط)، ثم بطاقة الإغلاق (الجميع) بإجمالي المغلق/المؤرشف/سلة المحذوفات،
 * وأخيرًا آخر التصاريح والعمليات - كل الأرقام محسوبة من بيانات حقيقية (searchPermits/
 * getMyClosingStats)، بلا أي عدد ثابت بالكود.
 */
export default function SourceHomePage() {
  const [permits, setPermits] = useState([]);
  const [operations, setOperations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [closingStats, setClosingStats] = useState(null);
  const navigate = useNavigate();
  const { employee } = useSession();

  useEffect(() => {
    searchPermits({}).then(setPermits).catch(() => {});
    listMyOperations().then(setOperations).catch(() => {});
    getMyProfile().then(setProfile).catch(() => {});
    getMyClosingStats().then(setClosingStats).catch(() => {});
  }, []);

  const isSource = !!employee && (hasRole(employee.role, 'مصدر') || employee.isAdmin);
  const isReceiver = !!employee && hasRole(employee.role, 'مستلم');

  // "أنشأها" تحديدًا (وليس كل ما يظهر له من searchPermits، التي تضم أيضًا ما أغلقه كمصدر
  // مداوم حتى لو لم يُنشئه هو) - مطابقةً لتعريف بطاقة الإنشاء في قسم 5 بدليل التصميم.
  const createdPermits = employee ? permits.filter((p) => String(p['الرقم الوظيفي لمنشئ التصريح']) === String(employee.employeeId)) : [];
  const ptwCreatedCount = createdPermits.filter((p) => p['نوع التصريح'] === 'PTW').length;
  const sftCreatedCount = createdPermits.filter((p) => p['نوع التصريح'] === 'SFT').length;

  // للمستلم: searchPermits تُعيد أصلًا فقط التصاريح المُكلَّف بها المستلم نفسه (مُصفّاة من
  // الخادم)، فلا حاجة لتصفية إضافية هنا حسب الرقم الوظيفي.
  const ptwReceivedCount = permits.filter((p) => p['نوع التصريح'] === 'PTW').length;
  const sftReceivedCount = permits.filter((p) => p['نوع التصريح'] === 'SFT').length;

  const recentPermits = permits.slice(0, 10);

  return (
    <AppLayout title="الرئيسية">
      {/* responsive-shell: عرض أقصى يكبر تدريجيًا مع حجم الشاشة (تابلت/لابتوب/شاشات كبيرة)
          بدل الامتداد بلا حدود على الشاشات العريضة جدًا - العناصر نفسها لا تتغير مقاساتها. */}
      <div className="responsive-shell">
      <EmployeeInfoCard profile={profile} />

      {isSource && (
        <section style={{ marginBottom: 20 }}>
          <strong style={{ fontSize: 14, color: 'var(--color-primary)' }}>إنشاء تصريح</strong>
          <div style={{ marginTop: 10 }}>
            <CreatePermitCard />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginTop: 12 }}>
            <StatCard label="تصاريح PTW أنشأتها" value={ptwCreatedCount} color="var(--color-ptw)" bg="var(--color-bg-work)" />
            <StatCard label="تصاريح SFT أنشأتها" value={sftCreatedCount} color="var(--color-sft)" bg="var(--color-bg-closing)" />
          </div>
        </section>
      )}

      {isReceiver && (
        <section style={{ marginBottom: 20 }}>
          <strong style={{ fontSize: 14, color: 'var(--color-primary)' }}>الاستلام</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginTop: 10 }}>
            <StatCard label="تصاريح PTW استلمتها" value={ptwReceivedCount} color="var(--color-ptw)" bg="var(--color-bg-work)" />
            <StatCard label="تصاريح SFT استلمتها" value={sftReceivedCount} color="var(--color-sft)" bg="var(--color-bg-closing)" />
          </div>
        </section>
      )}

      {(isSource || isReceiver) && closingStats && (
        <section style={{ marginBottom: 20 }}>
          <strong style={{ fontSize: 14, color: 'var(--color-primary)' }}>الإغلاق</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginTop: 10 }}>
            <StatCard label="إجمالي المغلقة" value={closingStats.totalClosed} color="var(--color-success)" bg="var(--color-bg-closing)" />
            <StatCard label="مؤرشفة" value={closingStats.archivedCount} color="var(--color-status-archived)" bg="#F1F3F6" />
            <StatCard label="سلة المحذوفات" value={closingStats.trashCount} color="var(--color-status-trash)" bg="#FDECEC" />
          </div>
        </section>
      )}

      <section className="app-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <strong style={{ fontSize: 14, color: 'var(--color-primary)' }}>آخر التصاريح</strong>
          <button onClick={() => navigate('/source/records')} style={{ fontSize: 11 }}>عرض الكل</button>
        </div>
        {recentPermits.length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>لا توجد تصاريح بعد.</div>}
        {recentPermits.map((p) => (
          <div key={p['معرف انشاء التصريح']} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eef0f3', fontSize: 12 }}>
            <span style={{ fontWeight: 'bold' }}>{p['نوع التصريح']} - {p['حالة التصريح']}</span>
            <span>{formatDateTimeShort(p['تاريخ الانشاء'])}</span>
            <button onClick={() => navigate('/permit?id=' + p['معرف انشاء التصريح'])} style={{ background: 'var(--color-primary)', color: '#fff', fontSize: 11 }}>فتح</button>
          </div>
        ))}
      </section>

      <section className="app-card">
        <strong style={{ fontSize: 14, color: 'var(--color-primary)' }}>آخر العمليات</strong>
        <div style={{ marginTop: 10 }}>
          {operations.length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>لا توجد عمليات بعد.</div>}
          {operations.map((op) => (
            <div key={op['معرف العملية']} style={{ padding: '8px 0', borderBottom: '1px solid #eef0f3', fontSize: 12 }}>
              <strong>{op['العملية']}</strong> - {op['المرحلة']} ({op['رقم تصريح العمل'] || op['معرف إنشاء التصريح']})
              <div style={{ opacity: 0.7 }}>{formatDateTimeShort(op['التاريخ والوقت'])}</div>
            </div>
          ))}
        </div>
      </section>
      </div>
    </AppLayout>
  );
}
