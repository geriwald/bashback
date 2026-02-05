import { createContext, useContext, ReactNode } from 'react';
import { useCustomDescriptions } from '../hooks/useCustomDescriptions';

type DescriptionsContextType = ReturnType<typeof useCustomDescriptions>;

const DescriptionsContext = createContext<DescriptionsContextType | null>(null);

export function DescriptionsProvider({ children }: { children: ReactNode }) {
  const descriptions = useCustomDescriptions();
  return (
    <DescriptionsContext.Provider value={descriptions}>
      {children}
    </DescriptionsContext.Provider>
  );
}

export function useDescriptions() {
  const ctx = useContext(DescriptionsContext);
  if (!ctx) {
    throw new Error('useDescriptions must be used within DescriptionsProvider');
  }
  return ctx;
}
