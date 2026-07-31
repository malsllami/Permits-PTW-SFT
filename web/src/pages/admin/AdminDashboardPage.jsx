import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../../services/settingsService.js';
import { formatDateTimeShort } from '../../hooks/useHijriGregorianDate.js';
import Icon from '../../components/common/Icon.jsx';

// نظام ألوان داكن مستقل خاص بهذه الصفحة فقط (لوحة عمليات المدير) - مطابق لأسلوب لوحة تحكم
// مشروع "خرائط المحطات" المرجعي، بلا أي تأثير على بقية صفحات الموقع الفاتحة.
const DARK = {
  bg: '#0B1728',
  card: '#101E33',
  cardAlt: '#0D1A2C',
  border: '#1E3350',
  text: '#E7EDF5',
  muted: '#8CA0BC',
  green: '#22C55E',
  amber: '#F5A623',
  red: '#D9534F',
  yellow: '#F0B429',
  blue: '#3B82F6'
};

/** بطاقة قسم قابلة للطي بنفس أسلوب اللوحة الداكنة - مطويّة افتراضيًا لتقليل طول الصفحة. */
function CollapsibleSection({ title, icon, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ background: DARK.card, border: '1px solid ' + DARK.border, borderRadius: 10, overflow: 'hidden', marginTop: 10 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', background: 'none', color: DARK.text, padding: '12px 14px', minHeight: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 'bold'
        }}
      >
        <Icon name={open ? 'expand_less' : 'expand_more'} size={18} color={DARK.muted} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{title}<Icon name={icon} size={16} color={DARK.muted} /></span>
      </button>
      {open && <div style={{ padding: '0 14px 14px' }}>{children}</div>}
    </div>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div style={{ background: DARK.card, border: '1px solid ' + DARK.border, borderRadius: 10, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 'bold', color: color || DARK.text }}>{value}</div>
      <div style={{ fontSize: 11, color: DARK.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

/** توزيع مصدر/مستلم بشريط بصري بلونَي الدور الثابتين - مصدر أحمر دائمًا، مستلم أصفر دائمًا. */
function RoleSplitBar({ sourceCount, receiverCount }) {
  const total = sourceCount + receiverCount;
  const sourcePct = total > 0 ? (sourceCount / total) * 100 : 50;
  return (
    <div>
      <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: DARK.cardAlt }}>
        <div style={{ width: sourcePct + '%', background: DARK.red }} />
        <div style={{ width: (100 - sourcePct) + '%', background: DARK.yellow }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, fontWeight: 'bold' }}>
        <span style={{ color: DARK.red }}>● مصدر: {sourceCount}</span>
        <span style={{ color: DARK.yellow }}>مستلم: {receiverCount} ●</span>
      </div>
    </div>
  );
}

/** بطاقة توزيع نوع تصريح واحد (PTW/SFT) - مغلق + جارٍ لم يُغلق + ملغى، من نفس أرقام حقيقية. */
function TypeBreakdownCard({ label, data }) {
  return (
    <div style={{ background: DARK.cardAlt, border: '1px solid ' + DARK.border, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>{label} <span style={{ color: DARK.muted, fontWeight: 500 }}>({data.total})</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: DARK.green }}>{data.closed}</div>
          <div style={{ color: DARK.muted, marginTop: 2 }}>مغلق</div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: DARK.amber }}>{data.inProgress}</div>
          <div style={{ color: DARK.muted, marginTop: 2 }}>جارٍ العمل</div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: DARK.red }}>{data.cancelled}</div>
          <div style={{ color: DARK.muted, marginTop: 2 }}>ملغى</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {});
  }, []);

  if (!stats) return <div style={{ padding: 20 }}>جارٍ تحميل الإحصائيات...</div>;

  // قيم افتراضية آمنة للحقول الحديثة تحديدًا - تحمي من عدم تطابق شكل البيانات (مثال: كاش
  // خلفي قديم لم تنته صلاحيته بعد بشكل النسخة السابقة من الحقول) بدل تعطّل الصفحة بالكامل.
  const permitsByType = stats.permitsByType || {
    PTW: { total: 0, closed: 0, cancelled: 0, inProgress: 0 },
    SFT: { total: 0, closed: 0, cancelled: 0, inProgress: 0 }
  };
  const activePresence = stats.activePresence || { sources: 0, receivers: 0 };
  const expiredCards = stats.expiredCards || { sourcesCount: 0, sourceNames: [], receiversCount: 0, receiverNames: [] };

  const todayLabel = new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  // أكثر أنواع العمليات اليوم - من نفس بيانات "آخر العمليات" الحقيقية (بلا أي رقم وهمي)،
  // مُصفّاة لليوم الحالي فقط ومُرتَّبة تنازليًا حسب التكرار.
  const todayStr = new Date().toDateString();
  const todayOps = (stats.recentOperations || []).filter((op) => {
    const d = new Date(op['التاريخ والوقت']);
    return !isNaN(d.getTime()) && d.toDateString() === todayStr;
  });
  const opCounts = {};
  todayOps.forEach((op) => {
    const key = op['العملية'] || '—';
    opCounts[key] = (opCounts[key] || 0) + 1;
  });
  const topOps = Object.keys(opCounts).map((k) => ({ label: k, count: opCounts[k] })).sort((a, b) => b.count - a.count).slice(0, 6);

  const expiredTotal = expiredCards.sourcesCount + expiredCards.receiversCount;

  return (
    <div style={{ background: DARK.bg, color: DARK.text, padding: 16, borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>لوحة العمليات</div>
          <div style={{ fontSize: 12, color: DARK.muted, marginTop: 2 }}>{todayLabel}</div>
        </div>
        {expiredTotal > 0 && (
          <div style={{ background: 'rgba(217,83,79,0.15)', border: '1px solid ' + DARK.red, color: DARK.red, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 'bold' }}>
            ⚠ {expiredTotal} بطاقة سلامة منتهية
          </div>
        )}
      </div>

      {/* أكثر أنواع العمليات اليوم */}
      <div style={{ background: DARK.card, border: '1px solid ' + DARK.border, borderRadius: 10, padding: 14, marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 10 }}>أكثر أنواع العمليات اليوم</div>
        {topOps.length === 0 && <div style={{ fontSize: 12, color: DARK.muted }}>لا توجد عمليات اليوم بعد.</div>}
        {topOps.map((op) => (
          <div key={op.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid ' + DARK.border, fontSize: 13 }}>
            <span style={{ color: DARK.green, fontWeight: 'bold' }}>{op.count}</span>
            <span>{op.label}</span>
          </div>
        ))}
      </div>

      {/* عدادات رئيسية */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginTop: 14 }}>
        <StatTile label="تصاريح اليوم" value={stats.permitsToday} color={DARK.blue} />
        <StatTile label="متوسط زمن الإصدار (د)" value={stats.avgIssueMinutes} />
        <StatTile label="عدد الموظفين" value={stats.employeesCount} />
      </div>

      {/* المتواجدون - مصدر/مستلم يحملون حاليًا مسؤولية فعلية على تصريح جارٍ */}
      <CollapsibleSection title="المتواجدون الآن" icon="groups" defaultOpen>
        <div style={{ fontSize: 11, color: DARK.muted, marginBottom: 10 }}>موظفون يحملون حاليًا مسؤولية فعلية على تصريح لم يُغلق بعد</div>
        <RoleSplitBar sourceCount={activePresence.sources} receiverCount={activePresence.receivers} />
      </CollapsibleSection>

      {/* التصاريح حسب النوع */}
      <CollapsibleSection title="التصاريح حسب النوع" icon="bar_chart" defaultOpen>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <TypeBreakdownCard label="PTW" data={permitsByType.PTW} />
          <TypeBreakdownCard label="SFT" data={permitsByType.SFT} />
        </div>
      </CollapsibleSection>

      {/* بطاقات السلامة المنتهية - أسماء حقيقية، بلا أرقام وهمية */}
      <CollapsibleSection title="بطاقات سلامة منتهية" icon="warning">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: DARK.red, marginBottom: 6 }}>مصدر ({expiredCards.sourcesCount})</div>
            {expiredCards.sourceNames.length === 0 && <div style={{ fontSize: 12, color: DARK.muted }}>لا يوجد.</div>}
            {expiredCards.sourceNames.map((n, i) => (
              <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid ' + DARK.border }}>{n}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: DARK.yellow, marginBottom: 6 }}>مستلم ({expiredCards.receiversCount})</div>
            {expiredCards.receiverNames.length === 0 && <div style={{ fontSize: 12, color: DARK.muted }}>لا يوجد.</div>}
            {expiredCards.receiverNames.map((n, i) => (
              <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid ' + DARK.border }}>{n}</div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* آخر العمليات - سطح أبيض مصغّر للجدول نفسه (وليس الكارت الداكن) لضمان وضوح القراءة،
          نمط شائع في لوحات التحكم الداكنة (اللوحة داكنة، بيانات الجدول على سطح فاتح). */}
      <CollapsibleSection title="سجل العمليات" icon="history">
        <div className="table-scroll-wrap" style={{ background: '#fff', borderRadius: 8, padding: 4 }}>
          <table className="app-table" style={{ '--table-font-size': '12px' }}>
            <thead>
              <tr><th>العملية</th><th>الاسم</th><th>الدور</th><th>التاريخ والوقت</th></tr>
            </thead>
            <tbody>
              {(stats.recentOperations || []).map((op, idx) => (
                <tr key={idx}>
                  <td>{op['العملية']}</td>
                  <td>{op['الاسم']}</td>
                  <td>{op['الدور']}</td>
                  <td>{formatDateTimeShort(op['التاريخ والوقت'])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}
