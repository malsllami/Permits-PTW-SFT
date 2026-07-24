import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getFullPermitView, sendToReceiver, saveReceiverSection, approveBySource, closeOrCancelByReceiver, closeBySource } from '../../services/permitsService.js';
import { requestMandatoryGps } from '../../hooks/useGeolocation.js';
import { ACCESS_MODE } from '../../config/constants.js';
import { t } from '../../config/permitLabels.js';
import SignaturePad from '../common/SignaturePad.jsx';
import QRCodeView from '../common/QRCodeView.jsx';
import BilingualDateField from '../common/BilingualDateField.jsx';
import SafetyChecklistSection from './SafetyChecklistSection.jsx';
import SectionLanguageToggle, { useSectionLanguage } from './SectionLanguageToggle.jsx';
import ZoomControls from './ZoomControls.jsx';
import SafetyInstructionsPage from './SafetyInstructionsPage.jsx';

const CARD_WIDTH = 794; // عرض A4 التقريبي عند 96dpi

/**
 * المكوّن المحوري: عرض/تعبئة/توقيع التصريح بكامل بياناته في صفحة/بطاقة واحدة قابلة
 * للتكبير والتصغير وإعادة الضبط، متجاوبة مع اللابتوب والجوال، بلا تبويبات أو صفحات منفصلة.
 */
export default function PermitDocumentViewer({ creationId, accessMode, currentUser, onRefreshNeeded }) {
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [formData, setFormData] = useState({});
  const [signature, setSignature] = useState('');
  const [checkedMap, setCheckedMap] = useState({});

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);

  const [headerLang, setHeaderLang] = useSectionLanguage('ar');
  const [workLang, setWorkLang] = useSectionLanguage('ar');

  const load = () => {
    setLoading(true);
    getFullPermitView(creationId)
      .then(setPermit)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [creationId]);

  useEffect(() => {
    const computeFit = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 24;
      const s = Math.min(1, containerWidth / CARD_WIDTH);
      setFitScale(s);
      setScale(s);
    };
    computeFit();
    window.addEventListener('resize', computeFit);
    return () => window.removeEventListener('resize', computeFit);
  }, [permit]);

  const isSourceEditable = accessMode === ACCESS_MODE.INTERACTIVE_SOURCE || accessMode === ACCESS_MODE.ADMIN_FULL;
  const isReceiverEditable = accessMode === ACCESS_MODE.INTERACTIVE_RECEIVER || accessMode === ACCESS_MODE.ADMIN_FULL;
  const isSourceCloseEditable = accessMode === ACCESS_MODE.INTERACTIVE_SOURCE_CLOSE || accessMode === ACCESS_MODE.ADMIN_FULL;
  const readOnlyAll = !isSourceEditable && !isReceiverEditable && !isSourceCloseEditable;

  const showFinalInstructions = permit && (permit.status === 'مغلق' || permit.status === 'ملغي');

  async function withGpsAction(action) {
    setBusy(true);
    setError('');
    try {
      const gps = await requestMandatoryGps();
      await action(gps);
      load();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const handleSendToReceiver = () => withGpsAction((gps) => sendToReceiver(creationId, formData, signature, gps));
  const handleReceiverSubmit = () => withGpsAction((gps) => saveReceiverSection(creationId, formData, signature, gps));
  const handleApprove = () => withGpsAction((gps) => approveBySource(creationId, signature, gps));
  const handleReceiverClose = (action) => withGpsAction((gps) => closeOrCancelByReceiver(creationId, action, signature, gps));
  const handleSourceClose = () => withGpsAction((gps) => closeBySource(creationId, signature, gps));

  const zoomIn = () => setScale((s) => Math.min(2.5, s + 0.15));
  const zoomOut = () => setScale((s) => Math.max(0.3, s - 0.15));
  const resetZoom = () => setScale(fitScale);

  const handlePrint = () => {
    setScale(1);
    setTimeout(() => {
      window.print();
      setScale(fitScale);
    }, 150);
  };

  // دعم إيماءة Pinch-to-zoom باللمس
  const pinchRef = useRef(null);
  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchRef.current = distanceBetween(e.touches[0], e.touches[1]);
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const newDist = distanceBetween(e.touches[0], e.touches[1]);
      const ratio = newDist / pinchRef.current;
      setScale((s) => Math.min(2.5, Math.max(0.3, s * ratio)));
      pinchRef.current = newDist;
    }
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>جارٍ التحميل...</div>;
  if (!permit) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-error)' }}>{error || 'تعذّر تحميل التصريح.'}</div>;

  return (
    <div>
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        style={{ overflow: 'auto', maxHeight: '80vh', padding: 12, background: 'var(--color-background)', borderRadius: 'var(--radius-lg)' }}
      >
        <div
          ref={cardRef}
          style={{
            width: CARD_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top center',
            background: '#fff', margin: '0 auto', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
            padding: 28
          }}
        >
          {/* رأس التصريح */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--color-primary)', paddingBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 16, color: 'var(--color-primary)' }}>
                {permit.permitType === 'PTW' ? 'تصريح العمل / Permit To Work' : 'تصريح التعميد بالاختبار / Sanction For Testing'}
              </div>
              {permit.voltageLevel && <div style={{ fontSize: 12 }}>{t('voltageLevel', headerLang)}: {permit.voltageLevel}</div>}
              <div style={{ fontSize: 12 }}>{t('permitNumber', headerLang)}: {permit.permitNumber || '—'}</div>
              <div style={{ fontSize: 12 }}>{t('status', headerLang)}: {permit.status}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <QRCodeView link={permit.permitLink} size={90} />
              <SectionLanguageToggle lang={headerLang} onChange={setHeaderLang} />
            </div>
          </div>

          {/* بيانات العمل */}
          <section style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 13 }}>{t('workData', workLang)}</strong>
              <SectionLanguageToggle lang={workLang} onChange={setWorkLang} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, fontSize: 12 }}>
              <WorkField label={t('location', workLang)} value={permit.location} editable={isSourceEditable && !permit.permitNumber} onChange={(v) => setFormData((f) => ({ ...f, location: v }))} />
              <WorkField label={t('circuit', workLang)} value={permit.circuit} editable={isSourceEditable && !permit.permitNumber} onChange={(v) => setFormData((f) => ({ ...f, circuit: v }))} />
              <WorkField label={t('unit', workLang)} value={permit.unit} editable={isSourceEditable && !permit.permitNumber} onChange={(v) => setFormData((f) => ({ ...f, unit: v }))} />
              <WorkField label={t('station', workLang)} value={permit.station} editable={isSourceEditable && !permit.permitNumber} onChange={(v) => setFormData((f) => ({ ...f, station: v }))} />
              <WorkField label={t('feeder', workLang)} value={permit.feeder} editable={isSourceEditable && !permit.permitNumber} onChange={(v) => setFormData((f) => ({ ...f, feeder: v }))} />
              <WorkField label={t('operationalProgramNumber', workLang)} value={permit.operationalProgramNumber} editable={isSourceEditable && !permit.permitNumber} onChange={(v) => setFormData((f) => ({ ...f, operationalProgramNumber: v }))} />
            </div>
            <div style={{ marginTop: 8 }}>
              <WorkField label={t('workDescription', workLang)} value={permit.workDescription} editable={isSourceEditable && !permit.permitNumber} onChange={(v) => setFormData((f) => ({ ...f, workDescription: v }))} full />
              <WorkField label={t('isolationPoints', workLang)} value={permit.isolationPoints} editable={isSourceEditable && !permit.permitNumber} onChange={(v) => setFormData((f) => ({ ...f, isolationPoints: v }))} full />
              <WorkField label={t('sourceSwitches', workLang)} value={permit.sourceSwitches} editable={isSourceEditable && !permit.permitNumber} onChange={(v) => setFormData((f) => ({ ...f, sourceSwitches: v }))} full />
            </div>
          </section>

          {/* قسم المصدر */}
          <PartySection
            title="بيانات المصدر / Issuer Data"
            employeeId={permit.source.employeeId}
            fullName={permit.source.fullName}
            mobile={permit.source.mobile}
            dateTime={permit.source.transferDateTime}
            gps={permit.source.transferGps}
            savedSignature={permit.source.transferSignature}
            editable={isSourceEditable && !permit.source.transferDateTime}
            signature={signature}
            onSignatureChange={setSignature}
          >
            {isSourceEditable && !permit.source.transferDateTime && (
              <SafetyChecklistSection permitType={permit.permitType} stage="المصدر" checkedMap={checkedMap} onToggle={(row, v) => setCheckedMap((m) => ({ ...m, [row]: v }))} />
            )}
            {isSourceEditable && !permit.source.transferDateTime && (
              <button className="primary" disabled={busy} onClick={handleSendToReceiver} style={{ marginTop: 10 }}>إرسال للمستلم</button>
            )}
            {isSourceEditable && permit.status === 'بانتظار اعتماد المصدر' && (
              <button className="primary" disabled={busy} onClick={handleApprove} style={{ marginTop: 10 }}>مراجعة واعتماد وتوليد رقم التصريح</button>
            )}
          </PartySection>

          {/* قسم المستلم */}
          <PartySection
            title="بيانات المستلم / Receiver Data"
            employeeId={permit.receiver.employeeId}
            fullName={permit.receiver.fullName}
            mobile={permit.receiver.mobile}
            dateTime={permit.receiver.receiveDateTime}
            gps={permit.receiver.receiveGps}
            savedSignature={permit.receiver.receiveSignature}
            editable={isReceiverEditable && !permit.receiver.receiveDateTime}
            signature={signature}
            onSignatureChange={setSignature}
          >
            {isReceiverEditable && !permit.receiver.receiveDateTime && (
              <SafetyChecklistSection permitType={permit.permitType} stage="المستلم" checkedMap={checkedMap} onToggle={(row, v) => setCheckedMap((m) => ({ ...m, [row]: v }))} />
            )}
            {isReceiverEditable && !permit.receiver.receiveDateTime && (
              <button className="primary" disabled={busy} onClick={handleReceiverSubmit} style={{ marginTop: 10 }}>تأكيد الاستلام والتوقيع</button>
            )}
            {isReceiverEditable && permit.status === 'نشط' && !permit.receiver.closeDateTime && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="primary" disabled={busy} onClick={() => handleReceiverClose('CLOSE')}>إغلاق التصريح</button>
                <button disabled={busy} onClick={() => handleReceiverClose('CANCEL')} style={{ background: 'var(--color-error)', color: '#fff' }}>إلغاء التصريح</button>
              </div>
            )}
          </PartySection>

          {/* إغلاق المصدر النهائي */}
          {(permit.status === 'بانتظار إغلاق المصدر' || permit.status === 'بانتظار تأكيد الإلغاء من المصدر' || permit.closingSource.closeDateTime) && (
            <PartySection
              title="إغلاق المصدر النهائي / Final Issuer Close-out"
              employeeId={permit.closingSource.employeeId}
              fullName={permit.closingSource.fullName}
              dateTime={permit.closingSource.closeDateTime}
              gps={permit.closingSource.closeGps}
              savedSignature={permit.closingSource.closeSignature}
              editable={isSourceCloseEditable && !permit.closingSource.closeDateTime}
              signature={signature}
              onSignatureChange={setSignature}
            >
              {isSourceCloseEditable && !permit.closingSource.closeDateTime && (
                <button className="primary" disabled={busy} onClick={handleSourceClose} style={{ marginTop: 10 }}>
                  إتمام الإغلاق النهائي
                </button>
              )}
            </PartySection>
          )}

          {error && <div style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 10 }}>{error}</div>}
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 8 }}>
        <ZoomControls scale={scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
        <button onClick={handlePrint} style={{ background: 'var(--color-secondary)', color: '#fff', alignSelf: 'flex-start', marginTop: 12 }}>
          طباعة / تنزيل PDF
        </button>
      </div>

      <div className="no-print">
        {showFinalInstructions && <SafetyInstructionsPage permitType={permit.permitType} />}
      </div>
    </div>
  );
}

function WorkField({ label, value, editable, onChange, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{label}</div>
      {editable ? (
        <input type="text" style={{ width: '100%' }} defaultValue={value || ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div style={{ minHeight: 18, borderBottom: '1px dotted #ccc' }}>{value || '—'}</div>
      )}
    </div>
  );
}

function PartySection({ title, employeeId, fullName, mobile, dateTime, gps, savedSignature, editable, signature, onSignatureChange, children }) {
  return (
    <section style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
      <strong style={{ fontSize: 13, color: 'var(--color-primary)' }}>{title}</strong>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, fontSize: 12 }}>
        <div><strong>{t('employeeId', 'ar')}:</strong> {employeeId || '—'}</div>
        <div><strong>{t('fullName', 'ar')}:</strong> {fullName || '—'}</div>
        {mobile !== undefined && <div><strong>{t('mobile', 'ar')}:</strong> {mobile || '—'}</div>}
        <BilingualDateField label={t('dateTime', 'ar')} value={dateTime} />
        {gps && <div style={{ gridColumn: '1 / -1' }}><strong>{t('gps', 'ar')}:</strong> {gps}</div>}
      </div>

      {editable ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>{t('signature', 'ar')}</div>
          <SignaturePad onChange={onSignatureChange} />
        </div>
      ) : (
        savedSignature && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold' }}>{t('signature', 'ar')}</div>
            <img src={savedSignature} alt="التوقيع" style={{ height: 60 }} />
          </div>
        )
      )}
      {children}
    </section>
  );
}

function distanceBetween(t1, t2) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}
