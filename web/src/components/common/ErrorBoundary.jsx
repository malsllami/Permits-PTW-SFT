import React from 'react';

// شبكة أمان عامة لكامل التطبيق - أي خطأ برمجي غير متوقَّع في أي مكوّن كان يُسقط شجرة
// React بالكامل ويترك شاشة بيضاء صامتة بلا أي تفسير للمستخدم؛ هذا المكوّن يعرض بطاقة
// ودّية بدلًا من ذلك مع خيار إعادة تحميل الصفحة.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('خطأ غير متوقع أوقف عرض الصفحة:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 16, textAlign: 'center' }}>
          <div className="app-card" style={{ maxWidth: 380, width: '100%' }}>
            <h2 style={{ fontSize: 15 }}>حدث خطأ غير متوقع</h2>
            <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.</p>
            <button className="primary" style={{ width: '100%', marginTop: 12 }} onClick={() => window.location.reload()}>
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
