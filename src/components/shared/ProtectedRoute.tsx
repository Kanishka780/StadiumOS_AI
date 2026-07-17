import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/ServiceContext';
import type { UserRole } from '../../models/role';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * A layout guard that intercepts navigation to role-restricted pages
 * and redirects unauthorized or unauthenticated requests.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const auth = useAuth();
  const user = auth.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md mx-auto my-12 text-center shadow-2xl">
        <h2 className="text-lg font-bold text-rose-400 mb-2">Access Restrained</h2>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Your current simulated profile role <strong>({user.role.toUpperCase()})</strong> does not
          have permissions to access this control deck.
        </p>
        <Navigate to="/login" replace />
      </div>
    );
  }

  return <>{children}</>;
};
