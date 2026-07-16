import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock SpeechSynthesis
const speechSynthesisMock = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pending: false,
  speaking: false,
  paused: false,
};
Object.defineProperty(window, 'speechSynthesis', { value: speechSynthesisMock });
Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  value: class {
    text: string = '';
    rate: number = 1.0;
    constructor(text: string) { this.text = text; }
  }
});
