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

  return (
    <>
      {status?.installed ? (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-400">Hook installed</span>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 group"
          title="Install bashback hook for Claude Code"
        >
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-400 group-hover:text-white transition">Install hook</span>
        </button>
      )}

      {showModal && (
        <StepRunnerModal
          title="Hook Installation"
          stepsEndpoint="/api/install-steps"
          executeEndpoint={(stepId) => `/api/install-steps/${stepId}/execute`}
          onClose={() => { setShowModal(false); checkStatus(); }}
          onComplete={() => { checkStatus(); }}
        />
      )}
    </>
  );
}
