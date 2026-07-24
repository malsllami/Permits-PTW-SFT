import { useEffect, useState } from 'react';
import { getStoredSession, clearStoredSession } from '../services/authService.js';

export function useSession() {
  const [session, setSession] = useState(getStoredSession());

  useEffect(() => {
    const onStorage = () => setSession(getStoredSession());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const refresh = () => setSession(getStoredSession());
  const logout = () => {
    clearStoredSession();
    setSession(null);
  };

  return { session, employee: session ? session.employee : null, refresh, logout };
}
