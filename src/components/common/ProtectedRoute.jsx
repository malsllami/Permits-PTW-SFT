import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession.js';

export default function ProtectedRoute({ children }) {
  const { session } = useSession();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}
