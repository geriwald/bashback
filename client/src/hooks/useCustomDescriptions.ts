import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'bashback:descriptions';

interface CustomDescriptions {
  commands: Record<string, string>;
  flags: Record<string, Record<string, string>>; // command -> flag -> description
  longForms: Record<string, Record<string, string>>; // command -> flag -> longForm
}

function loadDescriptions(): CustomDescriptions {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return { commands: {}, flags: {}, longForms: {} };
}

function saveDescriptions(descriptions: CustomDescriptions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(descriptions));
}

export function useCustomDescriptions() {
  const [descriptions, setDescriptions] = useState<CustomDescriptions>(loadDescriptions);

  useEffect(() => {
    saveDescriptions(descriptions);
  }, [descriptions]);

  const setCommandDescription = useCallback((command: string, description: string) => {
    setDescriptions((prev) => ({
      ...prev,
      commands: { ...prev.commands, [command]: description },
    }));
  }, []);

  const setFlagDescription = useCallback(
    (command: string, flag: string, description: string) => {
      setDescriptions((prev) => ({
        ...prev,
        flags: {
          ...prev.flags,
          [command]: { ...prev.flags[command], [flag]: description },
        },
      }));
    },
    []
  );

  const getCommandDescription = useCallback(
    (command: string, defaultDesc: string) => {
      return descriptions.commands[command] ?? defaultDesc;
    },
    [descriptions.commands]
  );

  const getFlagDescription = useCallback(
    (command: string, flag: string, defaultDesc: string) => {
      return descriptions.flags[command]?.[flag] ?? defaultDesc;
    },
    [descriptions.flags]
  );

  const setFlagLongForm = useCallback(
    (command: string, flag: string, longForm: string) => {
      setDescriptions((prev) => ({
        ...prev,
        longForms: {
          ...prev.longForms,
          [command]: { ...prev.longForms?.[command], [flag]: longForm },
        },
      }));
    },
    []
  );

  const getFlagLongForm = useCallback(
    (command: string, flag: string) => {
      return descriptions.longForms?.[command]?.[flag] ?? null;
    },
    [descriptions.longForms]
  );

  const hasCustomDescriptions = useCallback(() => {
    return Object.keys(descriptions.commands).length > 0 || Object.keys(descriptions.flags).length > 0;
  }, [descriptions]);

  const saveToCode = useCallback(async () => {
    if (!hasCustomDescriptions()) return false;
    try {
      const res = await fetch('http://localhost:3001/api/save-descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(descriptions),
      });
      const data = await res.json();
      if (data.success) {
        // Clear localStorage after saving to code
        setDescriptions({ commands: {}, flags: {} });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [descriptions, hasCustomDescriptions]);

  const getCustomCount = useCallback(() => {
    const cmdCount = Object.keys(descriptions.commands).length;
    const flagCount = Object.values(descriptions.flags).reduce((sum, f) => sum + Object.keys(f).length, 0);
    return cmdCount + flagCount;
  }, [descriptions]);

  return {
    setCommandDescription,
    setFlagDescription,
    getCommandDescription,
    getFlagDescription,
    setFlagLongForm,
    getFlagLongForm,
    hasCustomDescriptions,
    saveToCode,
    getCustomCount,
  };
}
