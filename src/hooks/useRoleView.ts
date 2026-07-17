import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/ServiceContext';
import type { User } from '../models/user';
import type { UserRole } from '../models/role';

export interface RoleViewHook {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  isAuthorized: (allowedRoles: UserRole[]) => boolean;
  canViewField: (
    field:
      | 'zones_write'
      | 'raw_events'
      | 'volunteer_tasks'
      | 'incident_dispatch'
      | 'audit_logs'
      | 'sustainability_details',
  ) => boolean;
}

// RBAC Permissions Mapping
const FIELD_PERMISSIONS: Record<UserRole, Set<string>> = {
  organizer: new Set([
    'zones_write',
    'raw_events',
    'volunteer_tasks',
    'incident_dispatch',
    'audit_logs',
    'sustainability_details',
  ]),
  security: new Set([
    'zones_write',
    'raw_events',
    'incident_dispatch',
    'audit_logs',
    'sustainability_details',
  ]),
  executive: new Set(['raw_events', 'audit_logs', 'sustainability_details']),
  volunteer: new Set(['volunteer_tasks']),
  accessibility: new Set(['incident_dispatch']), // SOS creation/read-only
  fan: new Set([]), // Public view only, no restricted operational fields
};

export const useRoleView = (): RoleViewHook => {
  const auth = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = auth.listenToCurrentUser((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const isAuthorized = useCallback(
    (allowedRoles: UserRole[]): boolean => {
      if (!currentUser) return false;
      return allowedRoles.includes(currentUser.role);
    },
    [currentUser],
  );

  const canViewField = useCallback(
    (
      field:
        | 'zones_write'
        | 'raw_events'
        | 'volunteer_tasks'
        | 'incident_dispatch'
        | 'audit_logs'
        | 'sustainability_details',
    ): boolean => {
      if (!currentUser) return false;
      return FIELD_PERMISSIONS[currentUser.role].has(field);
    },
    [currentUser],
  );

  return {
    user: currentUser,
    role: currentUser ? currentUser.role : null,
    loading,
    isAuthorized,
    canViewField,
  };
};
