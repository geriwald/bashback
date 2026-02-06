import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { PromptRecord } from '../hooks/useWebSocket';

interface SpellCheckContextType {
  easterEggActive: boolean;
  toggleEasterEgg: () => void;
  prompts: PromptRecord[];
}

const SpellCheckContext = createContext<SpellCheckContextType | null>(null);

export function SpellCheckProvider({ children, prompts }: {
  children: ReactNode;
  prompts: PromptRecord[];
}) {
  const [easterEggActive, setEasterEggActive] = useState(() => {
    return localStorage.getItem('bashback-easter-egg') === 'true';
  });

  const toggleEasterEgg = useCallback(() => {
    setEasterEggActive(prev => {
      const next = !prev;
      localStorage.setItem('bashback-easter-egg', String(next));
      return next;
    });
  }, []);

  return (
    <SpellCheckContext.Provider value={{ easterEggActive, toggleEasterEgg, prompts }}>
      {children}
    </SpellCheckContext.Provider>
  );
}

export function useSpellCheck() {
  const ctx = useContext(SpellCheckContext);
  if (!ctx) {
    throw new Error('useSpellCheck must be used within SpellCheckProvider');
  }
  return ctx;
}
