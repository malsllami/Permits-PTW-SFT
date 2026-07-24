/**
 * الحصول على GPS إلزاميًا قبل أي توقيع/إرسال. لا يوجد Fallback صامت: عند الرفض أو
 * عدم دعم الجهاز، تُرفض العملية بالكامل برسالة عربية واضحة (قرار صريح من محمد).
 */
export function requestMandatoryGps() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('هذا الجهاز/المتصفح لا يدعم تحديد الموقع الجغرافي (GPS). لا يمكن المتابعة بدونه.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gps = position.coords.latitude.toFixed(6) + ',' + position.coords.longitude.toFixed(6);
        resolve(gps);
      },
      () => {
        reject(new Error('تم رفض صلاحية الوصول للموقع الجغرافي (GPS). يجب السماح بها لإتمام هذا الإجراء.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
