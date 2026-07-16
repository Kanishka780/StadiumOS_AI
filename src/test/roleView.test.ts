import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRoleView } from '../hooks/useRoleView';


// Create a mock auth service
const mockAuthService = {
  getCurrentUser: vi.fn(),
  listenToCurrentUser: vi.fn().mockImplementation((cb) => {
    cb(mockAuthService.getCurrentUser());
    return () => {};
  }),
};

// Mock the context hook
vi.mock('../context/ServiceContext', () => ({
  useAuth: () => mockAuthService,
}));

describe('useRoleView Hook (RBAC Policy)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deny all field access and return false if user is unauthenticated', () => {
    mockAuthService.getCurrentUser.mockReturnValue(null);
    const { result } = renderHook(() => useRoleView());

    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isAuthorized(['organizer'])).toBe(false);
    expect(result.current.canViewField('zones_write')).toBe(false);
  });

  it('should grant full access to organizers', () => {
    mockAuthService.getCurrentUser.mockReturnValue({
      uid: 'org_user',
      role: 'organizer',
      language: 'en',
      accessibilityPrefs: { needsHighContrast: false, needsCognitiveMode: false, needsVoiceGuidance: false },
    });
    const { result } = renderHook(() => useRoleView());

    expect(result.current.role).toBe('organizer');
    expect(result.current.isAuthorized(['organizer', 'security'])).toBe(true);
    expect(result.current.canViewField('zones_write')).toBe(true);
    expect(result.current.canViewField('audit_logs')).toBe(true);
    expect(result.current.canViewField('volunteer_tasks')).toBe(true);
  });

  it('should deny sensitive operations fields to fans', () => {
    mockAuthService.getCurrentUser.mockReturnValue({
      uid: 'fan_user',
      role: 'fan',
      language: 'en',
      accessibilityPrefs: { needsHighContrast: false, needsCognitiveMode: false, needsVoiceGuidance: false },
    });
    const { result } = renderHook(() => useRoleView());

    expect(result.current.role).toBe('fan');
    expect(result.current.isAuthorized(['fan'])).toBe(true);
    expect(result.current.isAuthorized(['organizer'])).toBe(false);
    expect(result.current.canViewField('zones_write')).toBe(false);
    expect(result.current.canViewField('audit_logs')).toBe(false);
  });

  it('should restrict volunteers to tasks view fields', () => {
    mockAuthService.getCurrentUser.mockReturnValue({
      uid: 'vol_user',
      role: 'volunteer',
      language: 'es',
      accessibilityPrefs: { needsHighContrast: false, needsCognitiveMode: false, needsVoiceGuidance: false },
    });
    const { result } = renderHook(() => useRoleView());

    expect(result.current.role).toBe('volunteer');
    expect(result.current.canViewField('volunteer_tasks')).toBe(true);
    expect(result.current.canViewField('zones_write')).toBe(false);
    expect(result.current.canViewField('audit_logs')).toBe(false);
  });
});
