// "الدور" قد يحمل أكثر من صلاحية معًا مفصولة بـ "، " (مصدر + مستلم لنفس الموظف) - نظير
// دالة employeeHasRole_ في الباك إند (gas/Employees.gs)، بنفس منطق الفصل بالضبط.
export function hasRole(roleValue, role) {
  return String(roleValue || '').split(/[،,]/).map((r) => r.trim()).includes(role);
}

export function rolesToList(roleValue) {
  return String(roleValue || '').split(/[،,]/).map((r) => r.trim()).filter(Boolean);
}
