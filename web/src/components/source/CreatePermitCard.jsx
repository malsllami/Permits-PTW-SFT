import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPermit } from '../../services/permitsService.js';
import RoleClickCard from '../common/RoleClickCard.jsx';

/**
 * بطاقة "إنشاء تصريح جديد": بطاقتان قابلتان للنقر (PTW/SFT) تفتحان نموذج الإدخال مباشرة
 * (قسم 4 بدليل التصميم) - مستوى الجهد (الخاص بـPTW) لم يعد يُختار هنا، بل أصبح حقلًا ضمن
 * "بيانات العمل" داخل نموذج الإدخال نفسه، فلا تظهر شاشة الإنشاء أي حقل قبل فتح النموذج.
 */
export default function CreatePermitCard() {
  const [error, setError] = useState('');
  const [loadingType, setLoadingType] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (permitType) => {
    setError('');
    setLoadingType(permitType);
    try {
      const result = await createPermit(permitType);
      navigate('/permit?id=' + result.creationId);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingType('');
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <RoleClickCard type="PTW" subtitle="تصريح العمل" disabled={!!loadingType} onClick={() => handleCreate('PTW')} />
        <RoleClickCard type="SFT" subtitle="تصريح التعميد بالاختبار" disabled={!!loadingType} onClick={() => handleCreate('SFT')} />
      </div>
      {error && <div style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{error}</div>}
    </div>
  );
}
