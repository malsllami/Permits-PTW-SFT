// رابط GAS Web App - يُضبط عبر متغير بيئة وقت البناء (VITE_GAS_WEB_APP_URL) إن وُجد،
// وإلا يُستخدم رابط النشر الفعلي كقيمة افتراضية. لا يوجد سر حقيقي هنا: هذا رابط
// Web App عام بطبيعته (يُستدعى من متصفح المستخدم مباشرة)، والأمان الفعلي يعتمد على
// التحقق من التوكن والأدوار على السيرفر وليس على إخفاء هذا الرابط.
const DEPLOYED_GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzjoEvy_CWsYMQ8r3cG7b0W6biDI1vA28s3P6t5dz_f6eZ6Fkn-SvEOKy2wm6KZJTxYFg/exec';

export const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL || DEPLOYED_GAS_WEB_APP_URL;

export const SESSION_STORAGE_KEY = 'ptw_sft_session_v1';
export const DATA_VERSIONS_STORAGE_KEY = 'ptw_sft_data_versions_v1';
export const WEBAUTHN_CREDENTIAL_STORAGE_KEY = 'ptw_sft_webauthn_credential_id_v1';
