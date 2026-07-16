import type { AuthService } from './interfaces';
import type { User } from '../models/user';
import type { UserRole } from '../models/role';

export class LocalStorageAuthService implements AuthService {
  private currentUser: User | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    const savedUser = localStorage.getItem('stadium_os_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch {
        this.currentUser = this.getDefaultUser('fan');
      }
    } else {
      this.currentUser = this.getDefaultUser('fan');
    }
  }

  private getDefaultUser(role: UserRole): User {
    return {
      uid: `uid_${role}_user`,
      role,
      language: 'en',
      accessibilityPrefs: {
        needsHighContrast: false,
        needsCognitiveMode: false,
        needsVoiceGuidance: false,
      },
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async loginAsRole(role: UserRole): Promise<User> {
    const user = this.getDefaultUser(role);
    // preserve existing prefs/lang if matching role
    if (this.currentUser && this.currentUser.role === role) {
      user.language = this.currentUser.language;
      user.accessibilityPrefs = this.currentUser.accessibilityPrefs;
    }
    this.currentUser = user;
    localStorage.setItem('stadium_os_user', JSON.stringify(user));
    this.notify();
    return user;
  }

  async updateUserPreferences(prefs: Partial<User['accessibilityPrefs']>): Promise<void> {
    if (!this.currentUser) return;
    this.currentUser.accessibilityPrefs = {
      ...this.currentUser.accessibilityPrefs,
      ...prefs,
    };
    localStorage.setItem('stadium_os_user', JSON.stringify(this.currentUser));
    this.notify();
  }

  async updateUserLanguage(lang: User['language']): Promise<void> {
    if (!this.currentUser) return;
    this.currentUser.language = lang;
    localStorage.setItem('stadium_os_user', JSON.stringify(this.currentUser));
    this.notify();
  }

  listenToCurrentUser(onUpdate: (user: User | null) => void): () => void {
    this.listeners.add(onUpdate);
    onUpdate(this.currentUser); // immediate invoke
    return () => {
      this.listeners.delete(onUpdate);
    };
  }
}
