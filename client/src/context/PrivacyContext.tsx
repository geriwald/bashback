import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { redactSensitive } from '../lib/redact';

interface PrivacyContextType {
  privacyMode: boolean;
  togglePrivacy: () => void;
  redact: (text: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType | null>(null);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(() => {
    return localStorage.getItem('bashback-privacy') === 'true';
  });

  const togglePrivacy = useCallback(() => {
    setPrivacyMode(prev => {
      const next = !prev;
      localStorage.setItem('bashback-privacy', String(next));
      return next;
    });
  }, []);

  const redact = useCallback(
    (text: string) => (privacyMode ? redactSensitive(text) : text),
    [privacyMode]
  );

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacy, redact }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    throw new Error('usePrivacy must be used within PrivacyProvider');
  }
  return ctx;
}
