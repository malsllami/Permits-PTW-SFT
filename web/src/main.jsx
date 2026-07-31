import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
// خطوط مستضافة ذاتيًا (بدون رابط خارجي لضمان عملها بدون إنترنت مستقر) - Inter للأرقام/الإنجليزي، IBM Plex Sans Arabic للعربي
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
// نظام أيقونات موحّد (Material Symbols Rounded) بدل الإيموجي المتفاوتة الأسلوب - انظر Icon.jsx
import '@fontsource/material-symbols-rounded/400.css';
import './styles/variables.css';
import './styles/rtl.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
