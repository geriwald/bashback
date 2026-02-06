import { useState, useEffect } from 'react';
import { API_URL } from '../lib/apiConfig';
import { StepRunnerModal } from './StepRunnerModal';

interface HookStatus {
  installed: boolean;
  hookExists: boolean;
  hookConfigured: boolean;
}

export function HookInstallButton() {
  const [status, setStatus] = useState<HookStatus | null>(null);
  const [showModal, setShowModal] = useState(false);

  const checkStatus = () => {
    fetch(`${API_URL}/api/hook-status`)
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus(null));
  };

  useEffect(() => { checkStatus(); }, []);

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
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded bg-indigo-700 px-3 py-1.5 text-sm text-white transition hover:bg-indigo-600"
        title="Install bashback hook for Claude Code"
      >
        Install hook
      </button>

      {showModal && (
        <StepRunnerModal
          title="Hook Installation"
          stepsEndpoint="/api/install-steps"
          executeEndpoint={(stepId) => `/api/install-steps/${stepId}/execute`}
          onClose={() => setShowModal(false)}
          onComplete={() => {
            checkStatus();
            setTimeout(() => setShowModal(false), 2000);
          }}
        />
      )}
    </>
  );
}
