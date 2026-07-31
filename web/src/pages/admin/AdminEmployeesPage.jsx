import React, { useEffect, useState } from 'react';
import { listEmployees, createEmployee, updateEmployee, disableEmployee, deleteEmployee, searchEmployees } from '../../services/employeesService.js';
import StickyHeaderTable from '../../components/common/StickyHeaderTable.jsx';
import { convertArabicDigitsToEnglish, sanitizeDigitsOnly } from '../../hooks/useArabicIndicDigits.js';
import { rolesToList } from '../../utils/roles.js';
import SaudiMobileInput from '../../components/common/SaudiMobileInput.jsx';
import { getAllSettings, addDepartmentOption } from '../../services/settingsService.js';

// جهة العمل: خياران فقط (زران للاختيار الحصري، وليس نصًا حرًا) - بلا خيارات أخرى.
const WORK_ENTITY_OPTIONS = ['الشركة السعودية للطاقة', 'مقاول'];

const emptyForm = {
  employeeId: '', fullName: '', mobile: '', email: '', role: 'مصدر', department: '', workEntity: '',
  workCardExpiry: '', issuerCardExpiry: '', receiverCardExpiry: ''
};

// "الدور" يدعم أكثر من صلاحية معًا لنفس الموظف (مصدر + مستلم) مفصولة بـ "، " - نفس الفاصل
// المستخدم في نقاط العزل/مفاتيح المصدر بالتصريح، للاتساق. راجع gas/Employees.gs::employeeHasRole_.
const ROLE_OPTIONS = ['مصدر', 'مستلم', 'مدير'];

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');

  const load = () => listEmployees().then(setEmployees).catch(() => {});
  const loadDepartments = () =>
    getAllSettings().then((rows) => setDepartments(rows.filter((s) => s.group === 'الأقسام').map((s) => s.valueAr))).catch(() => {});
  useEffect(() => { load(); loadDepartments(); }, []);

  const handleAddDepartment = async () => {
    const name = newDepartment.trim();
    if (!name) return;
    await addDepartmentOption(name);
    setNewDepartment('');
    setAddingDepartment(false);
    setForm((f) => ({ ...f, department: name }));
    loadDepartments();
  };

  useEffect(() => {
    if (query) searchEmployees(query).then(setEmployees).catch(() => {});
    else load();
  }, [query]);

  const handleSave = async () => {
    setError('');
    try {
      if (editingId) {
        await updateEmployee(editingId, form);
      } else {
        await createEmployee(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  // حقول <input type="date"> تتطلب صيغة "YYYY-MM-DD" حصرًا - القيمة القادمة من الخادم قد
  // تكون نص تاريخ/وقت ISO كامل (مثل "2028-08-12T21:00:00.000Z")، فيرفضها حقل التاريخ
  // ويظهر فارغًا رغم وجود قيمة فعلية، مما قد يؤدي لحذف التاريخ عن طريق الخطأ عند الحفظ.
  const toDateInputValue = (value) => (value ? String(value).slice(0, 10) : '');

  const handleEdit = (emp) => {
    setEditingId(emp.employeeId);
    setForm({
      employeeId: emp.employeeId, fullName: emp.fullName, mobile: emp.mobile, email: emp.email,
      role: emp.role, department: emp.department, workEntity: emp.workEntity,
      workCardExpiry: toDateInputValue(emp.workCardExpiry),
      issuerCardExpiry: toDateInputValue(emp.issuerCardExpiry),
      receiverCardExpiry: toDateInputValue(emp.receiverCardExpiry)
    });
  };

  const columns = [
    { key: 'id', label: 'الرقم الوظيفي' }, { key: 'name', label: 'الاسم' },
    { key: 'role', label: 'الدور' }, { key: 'dept', label: 'القسم' }, { key: 'actions', label: 'إجراءات' }
  ];

  return (
    <div>
      <div className="app-card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14 }}>{editingId ? 'تعديل موظف' : 'إضافة موظف جديد'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <input placeholder="الرقم الوظيفي" value={form.employeeId} disabled={!!editingId} onChange={(e) => setForm((f) => ({ ...f, employeeId: sanitizeDigitsOnly(e.target.value) }))} />
          <input placeholder="الاسم بالكامل" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: convertArabicDigitsToEnglish(e.target.value) }))} />
          <SaudiMobileInput value={form.mobile} onChange={(mobile) => setForm((f) => ({ ...f, mobile }))} />
          <input placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: convertArabicDigitsToEnglish(e.target.value) }))} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, fontWeight: 'bold' }}>
            {ROLE_OPTIONS.map((r) => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rolesToList(form.role).includes(r)}
                  onChange={() => setForm((f) => {
                    const list = rolesToList(f.role);
                    const next = list.includes(r) ? list.filter((x) => x !== r) : [...list, r];
                    return { ...f, role: next.join('، ') };
                  })}
                />
                {r}
              </label>
            ))}
          </div>
          <div>
            {!addingDepartment ? (
              <select
                value={departments.includes(form.department) || !form.department ? form.department : '__other__'}
                onChange={(e) => {
                  if (e.target.value === '__other__') { setAddingDepartment(true); setNewDepartment(''); }
                  else setForm((f) => ({ ...f, department: e.target.value }));
                }}
              >
                <option value="">القسم</option>
                {form.department && !departments.includes(form.department) && (
                  <option value={form.department}>{form.department}</option>
                )}
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                <option value="__other__">أخرى...</option>
              </select>
            ) : (
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  placeholder="اسم القسم الجديد"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(convertArabicDigitsToEnglish(e.target.value))}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={handleAddDepartment} style={{ fontSize: 11 }}>إضافة</button>
                <button type="button" onClick={() => setAddingDepartment(false)} style={{ fontSize: 11 }}>إلغاء</button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {WORK_ENTITY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={form.workEntity === opt ? 'primary' : 'secondary'}
                onClick={() => setForm((f) => ({ ...f, workEntity: opt }))}
                style={{ flex: 1, fontSize: 12 }}
              >
                {opt}
              </button>
            ))}
          </div>
          <label style={{ fontSize: 11 }}>انتهاء بطاقة العمل<input type="date" value={form.workCardExpiry} onChange={(e) => setForm((f) => ({ ...f, workCardExpiry: e.target.value }))} /></label>
          <label style={{ fontSize: 11 }}>انتهاء بطاقة المصدر<input type="date" value={form.issuerCardExpiry} onChange={(e) => setForm((f) => ({ ...f, issuerCardExpiry: e.target.value }))} /></label>
          <label style={{ fontSize: 11 }}>انتهاء بطاقة المستلم<input type="date" value={form.receiverCardExpiry} onChange={(e) => setForm((f) => ({ ...f, receiverCardExpiry: e.target.value }))} /></label>
        </div>
        {error && <div style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 8 }}>{error}</div>}
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button className="primary" onClick={handleSave}>{editingId ? 'حفظ التعديل' : 'إضافة'}</button>
          {editingId && <button onClick={() => { setEditingId(null); setForm(emptyForm); }}>إلغاء</button>}
        </div>
      </div>

      <div className="app-card">
        <input placeholder="بحث عن موظف" value={query} onChange={(e) => setQuery(convertArabicDigitsToEnglish(e.target.value))} style={{ marginBottom: 10 }} />
        <StickyHeaderTable
          columns={columns}
          rows={employees}
          renderRow={(emp) => (
            <>
              <td>{emp.employeeId}</td>
              <td>{emp.fullName}</td>
              <td>{emp.role}</td>
              <td>{emp.department}</td>
              <td style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                <button onClick={() => handleEdit(emp)} style={{ fontSize: 11 }}>تعديل</button>
                <button onClick={() => disableEmployee(emp.employeeId).then(load)} style={{ fontSize: 11, background: 'var(--color-warning)' }}>تعطيل</button>
                <button onClick={() => deleteEmployee(emp.employeeId).then(load)} style={{ fontSize: 11, background: 'var(--color-error)', color: '#fff' }}>حذف</button>
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
}
