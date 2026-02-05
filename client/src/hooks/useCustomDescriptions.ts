import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'bashback:descriptions';
const API_URL = 'http://localhost:3001';

interface CustomDescriptions {
  commands: Record<string, string>;
  flags: Record<string, Record<string, string>>; // command -> flag -> description
  longForms: Record<string, Record<string, string>>; // command -> flag -> longForm
}

const emptyDescriptions: CustomDescriptions = { commands: {}, flags: {}, longForms: {} };

function loadFromLocalStorage(): CustomDescriptions {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return emptyDescriptions;
}

function saveToLocalStorage(descriptions: CustomDescriptions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(descriptions));
}

export function useCustomDescriptions() {
  // Descriptions saved to JSON file (persisted, shared)
  const [savedDescriptions, setSavedDescriptions] = useState<CustomDescriptions>(emptyDescriptions);
  // Current session edits in localStorage
  const [localDescriptions, setLocalDescriptions] = useState<CustomDescriptions>(loadFromLocalStorage);

  // Load saved descriptions from JSON file on mount
  useEffect(() => {
    fetch(`${API_URL}/api/custom-descriptions`)
      .then((res) => res.json())
      .then((data) => setSavedDescriptions(data))
      .catch(() => {
        // ignore
      });
  }, []);

  // Persist local edits to localStorage
  useEffect(() => {
    saveToLocalStorage(localDescriptions);
  }, [localDescriptions]);

  const setCommandDescription = useCallback((command: string, description: string) => {
    setLocalDescriptions((prev) => ({
      ...prev,
      commands: { ...prev.commands, [command]: description },
    }));
  }, []);

  const setFlagDescription = useCallback(
    (command: string, flag: string, description: string) => {
      setLocalDescriptions((prev) => ({
        ...prev,
        flags: {
          ...prev.flags,
          [command]: { ...prev.flags[command], [flag]: description },
        },
      }));
    },
    []
  );

  // Get description: local > saved > default
  const getCommandDescription = useCallback(
    (command: string, defaultDesc: string) => {
      return localDescriptions.commands[command]
        ?? savedDescriptions.commands[command]
        ?? defaultDesc;
    },
    [localDescriptions.commands, savedDescriptions.commands]
  );

  const getFlagDescription = useCallback(
    (command: string, flag: string, defaultDesc: string) => {
      return localDescriptions.flags[command]?.[flag]
        ?? savedDescriptions.flags[command]?.[flag]
        ?? defaultDesc;
    },
    [localDescriptions.flags, savedDescriptions.flags]
  );

  const setFlagLongForm = useCallback(
    (command: string, flag: string, longForm: string) => {
      setLocalDescriptions((prev) => ({
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
      return localDescriptions.longForms?.[command]?.[flag]
        ?? savedDescriptions.longForms?.[command]?.[flag]
        ?? null;
    },
    [localDescriptions.longForms, savedDescriptions.longForms]
  );

  // Count only local (unsaved) descriptions
  const hasCustomDescriptions = useCallback(() => {
    return Object.keys(localDescriptions.commands).length > 0 || Object.keys(localDescriptions.flags).length > 0;
  }, [localDescriptions]);

  const saveDescriptions = useCallback(async () => {
    if (!hasCustomDescriptions()) return false;
    try {
      const res = await fetch(`${API_URL}/api/save-descriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localDescriptions),
      });
      const data = await res.json();
      if (data.success) {
        // Merge local into saved and clear local
        setSavedDescriptions((prev) => ({
          commands: { ...prev.commands, ...localDescriptions.commands },
          flags: { ...prev.flags, ...localDescriptions.flags },
          longForms: { ...prev.longForms, ...localDescriptions.longForms },
        }));
        setLocalDescriptions(emptyDescriptions);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [localDescriptions, hasCustomDescriptions]);

  const getCustomCount = useCallback(() => {
    const cmdCount = Object.keys(localDescriptions.commands).length;
    const flagCount = Object.values(localDescriptions.flags).reduce((sum, f) => sum + Object.keys(f).length, 0);
    return cmdCount + flagCount;
  }, [localDescriptions]);

  const clearDescriptions = useCallback(() => {
    setLocalDescriptions(emptyDescriptions);
  }, []);

  return {
    setCommandDescription,
    setFlagDescription,
    getCommandDescription,
    getFlagDescription,
    setFlagLongForm,
    getFlagLongForm,
    hasCustomDescriptions,
    saveToCode: saveDescriptions, // renamed but keeping old name for compatibility
    getCustomCount,
    clearDescriptions,
  };
}
