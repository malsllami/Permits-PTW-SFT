import React, { useEffect, useState } from 'react';
import { listEmployees, createEmployee, updateEmployee, disableEmployee, deleteEmployee, searchEmployees } from '../../services/employeesService.js';
import StickyHeaderTable from '../../components/common/StickyHeaderTable.jsx';

const emptyForm = {
  employeeId: '', fullName: '', mobile: '', email: '', role: 'مصدر', department: '', workEntity: '',
  workCardExpiry: '', issuerCardExpiry: '', receiverCardExpiry: ''
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => listEmployees().then(setEmployees).catch(() => {});
  useEffect(() => { load(); }, []);

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

  const handleEdit = (emp) => {
    setEditingId(emp.employeeId);
    setForm({
      employeeId: emp.employeeId, fullName: emp.fullName, mobile: emp.mobile, email: emp.email,
      role: emp.role, department: emp.department, workEntity: emp.workEntity,
      workCardExpiry: emp.workCardExpiry, issuerCardExpiry: emp.issuerCardExpiry, receiverCardExpiry: emp.receiverCardExpiry
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
          <input placeholder="الرقم الوظيفي" value={form.employeeId} disabled={!!editingId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} />
          <input placeholder="الاسم بالكامل" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <input placeholder="رقم الجوال" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />
          <input placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="مصدر">مصدر</option>
            <option value="مستلم">مستلم</option>
            <option value="مدير">مدير</option>
          </select>
          <input placeholder="القسم" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
          <input placeholder="جهة العمل" value={form.workEntity} onChange={(e) => setForm((f) => ({ ...f, workEntity: e.target.value }))} />
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
        <input placeholder="بحث عن موظف" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 10 }} />
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
