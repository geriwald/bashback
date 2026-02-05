import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001';

interface HookStatus {
  installed: boolean;
  hookExists: boolean;
  hookConfigured: boolean;
}

export function HookInstallButton() {
  const [status, setStatus] = useState<HookStatus | null>(null);
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/hook-status`)
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/install-hook`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage('Installed! Restart Claude Code.');
        setStatus({ installed: true, hookExists: true, hookConfigured: true });
      } else {
        setMessage(data.error || 'Failed');
      }
    } catch {
      setMessage('Error');
    }
    setInstalling(false);
    setTimeout(() => setMessage(null), 4000);
  };

  if (status?.installed) {
    return (
      <span className="text-xs text-green-500 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Hook installed
      </span>
    );
  }

  return (
    <button
      onClick={handleInstall}
      disabled={installing}
      className="rounded bg-indigo-700 px-3 py-1.5 text-sm text-white transition hover:bg-indigo-600 disabled:opacity-50"
      title="Install bashback hook for Claude Code"
    >
      {installing ? 'Installing...' : message ? message : 'Install hook'}
    </button>
  );
}
