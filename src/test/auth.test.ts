import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageAuthService } from '../services/authService';

describe('LocalStorageAuthService', () => {
  let authService: LocalStorageAuthService;

  beforeEach(() => {
    localStorage.clear();
    authService = new LocalStorageAuthService();
  });

  it('should default to fan role with English language', () => {
    const user = authService.getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.role).toBe('fan');
    expect(user?.language).toBe('en');
  });

  it('should successfully switch role when loginAsRole is called', async () => {
    const user = await authService.loginAsRole('security');
    expect(user.role).toBe('security');
    expect(authService.getCurrentUser()?.role).toBe('security');
  });

  it('should notify subscribers of current user session updates', async () => {
    const listener = vi.fn();
    authService.listenToCurrentUser(listener);
    
    // Switch role
    await authService.loginAsRole('volunteer');
    
    // Listener is called twice: once immediately on subscription, once on login change
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'volunteer' }));
  });

  it('should update user language selection', async () => {
    await authService.updateUserLanguage('fr');
    const user = authService.getCurrentUser();
    expect(user?.language).toBe('fr');
  });

  it('should update and preserve user accessibility preferences', async () => {
    await authService.updateUserPreferences({ needsHighContrast: true });
    const user = authService.getCurrentUser();
    expect(user?.accessibilityPrefs.needsHighContrast).toBe(true);
    expect(user?.accessibilityPrefs.needsCognitiveMode).toBe(false);
  });
});
