import React, { useEffect, useState } from 'react';
import { getAllSettings, updateSettingValue, getSafetyItems, addSafetyItem, updateSafetyItem, deactivateSafetyItem } from '../../services/settingsService.js';

export default function AdminSettingsPage() {
  const [tab, setTab] = useState('general');
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={tab === 'general' ? 'primary' : ''} onClick={() => setTab('general')}>الإعدادات العامة</button>
        <button className={tab === 'safety' ? 'primary' : ''} onClick={() => setTab('safety')}>إعدادات السلامة</button>
      </div>
      {tab === 'general' ? <GeneralSettingsTab /> : <SafetySettingsTab />}
    </div>
  );
}

function GeneralSettingsTab() {
  const [settings, setSettings] = useState([]);
  const [group, setGroup] = useState('');

  const load = () => getAllSettings().then((rows) => {
    setSettings(rows);
    if (!group && rows[0]) setGroup(rows[0].group);
  });
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const groups = [...new Set(settings.map((s) => s.group))];
  const rowsInGroup = settings.filter((s) => s.group === group);

  const handleChange = (row, field, value) => {
    setSettings((prev) => prev.map((s) => (s.row === row ? { ...s, [field]: value } : s)));
  };

  const handleSave = async (setting) => {
    await updateSettingValue(setting.group, setting.key, setting.valueAr, setting.valueEn);
    load();
  };

  return (
    <div className="app-card">
      <select value={group} onChange={(e) => setGroup(e.target.value)} style={{ marginBottom: 12 }}>
        {groups.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      <div className="table-scroll-wrap">
        <table className="app-table">
          <thead><tr><th>اسم المفتاح</th><th>القيمة العربية</th><th>القيمة الإنجليزية</th><th>حفظ</th></tr></thead>
          <tbody>
            {rowsInGroup.map((s) => (
              <tr key={s.row}>
                <td>{s.keyLabel}</td>
                <td><input value={s.valueAr || ''} onChange={(e) => handleChange(s.row, 'valueAr', e.target.value)} /></td>
                <td><input value={s.valueEn || ''} onChange={(e) => handleChange(s.row, 'valueEn', e.target.value)} /></td>
                <td><button onClick={() => handleSave(s)} style={{ fontSize: 11 }}>حفظ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SafetySettingsTab() {
  const [permitType, setPermitType] = useState('PTW');
  const [stage, setStage] = useState('المصدر');
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ itemType: 'إجراء', textAr: '', textEn: '' });

  const load = () => getSafetyItems(permitType, stage).then(setItems).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [permitType, stage]);

  const handleAdd = async () => {
    if (!newItem.textAr) return;
    await addSafetyItem({ permitType, stage, itemType: newItem.itemType, textAr: newItem.textAr, textEn: newItem.textEn });
    setNewItem({ itemType: 'إجراء', textAr: '', textEn: '' });
    load();
  };

  return (
    <div className="app-card">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={permitType} onChange={(e) => setPermitType(e.target.value)}>
          <option value="PTW">PTW</option>
          <option value="SFT">SFT</option>
        </select>
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="المصدر">المصدر</option>
          <option value="المستلم">المستلم</option>
          <option value="إغلاق المستلم">إغلاق المستلم</option>
          <option value="إغلاق المصدر">إغلاق المصدر</option>
        </select>
      </div>

      <div className="table-scroll-wrap">
        <table className="app-table">
          <thead><tr><th>النوع</th><th>النص بالعربية</th><th>النص بالإنجليزية</th><th>إجراءات</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.row}>
                <td>{item.itemType}</td>
                <td>{item.textAr}</td>
                <td>{item.textEn}</td>
                <td><button onClick={() => deactivateSafetyItem(item.row).then(load)} style={{ fontSize: 11, background: 'var(--color-error)', color: '#fff' }}>تعطيل</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={newItem.itemType} onChange={(e) => setNewItem((f) => ({ ...f, itemType: e.target.value }))}>
          <option value="إجراء">إجراء (Checkbox)</option>
          <option value="تعليمات">تعليمات (للاطلاع فقط)</option>
        </select>
        <input placeholder="النص بالعربية" value={newItem.textAr} onChange={(e) => setNewItem((f) => ({ ...f, textAr: e.target.value }))} />
        <input placeholder="النص بالإنجليزية" value={newItem.textEn} onChange={(e) => setNewItem((f) => ({ ...f, textEn: e.target.value }))} />
        <button className="primary" onClick={handleAdd}>إضافة بند</button>
      </div>
    </div>
  );
}
