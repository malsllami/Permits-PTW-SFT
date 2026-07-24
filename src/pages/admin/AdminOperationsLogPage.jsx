import React, { useEffect, useState } from 'react';
import { listOperations } from '../../services/settingsService.js';
import StickyHeaderTable from '../../components/common/StickyHeaderTable.jsx';

export default function AdminOperationsLogPage() {
  const [operations, setOperations] = useState([]);

  useEffect(() => {
    listOperations({}).then(setOperations).catch(() => {});
  }, []);

  const columns = [
    { key: 'op', label: 'العملية' }, { key: 'stage', label: 'المرحلة' }, { key: 'name', label: 'الاسم' },
    { key: 'role', label: 'الدور' }, { key: 'gps', label: 'GPS' }, { key: 'ip', label: 'عنوان IP' },
    { key: 'time', label: 'التاريخ والوقت' }
  ];

  return (
    <div className="app-card">
      <StickyHeaderTable
        columns={columns}
        rows={operations}
        renderRow={(op) => (
          <>
            <td>{op['العملية']}</td>
            <td>{op['المرحلة']}</td>
            <td>{op['الاسم']}</td>
            <td>{op['الدور']}</td>
            <td>{op['GPS']}</td>
            <td>{op['عنوان IP']}</td>
            <td>{op['التاريخ والوقت']}</td>
          </>
        )}
      />
    </div>
  );
}
