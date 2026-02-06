import { useState, useCallback } from 'react';
import { API_URL } from '../lib/apiConfig';

export interface Step {
  id: string;
  title: string;
  description: string;
  command: string;
}

interface StepState {
  status: 'pending' | 'running' | 'success' | 'error';
  output: string | null;
}

interface StepRunnerModalProps {
  title: string;
  stepsEndpoint: string;
  executeEndpoint: (stepId: string) => string;
  onClose: () => void;
  onComplete?: () => void;
}

export function StepRunnerModal({ title, stepsEndpoint, executeEndpoint, onClose, onComplete }: StepRunnerModalProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({});
  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);

  // Load steps on mount
  useState(() => {
    fetch(`${API_URL}${stepsEndpoint}`)
      .then(res => res.json())
      .then((data: Step[]) => {
        setSteps(data);
        const initial: Record<string, StepState> = {};
        data.forEach(s => { initial[s.id] = { status: 'pending', output: null }; });
        setStepStates(initial);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  });

  const executeStep = useCallback(async (stepId: string) => {
    setStepStates(prev => ({ ...prev, [stepId]: { status: 'running', output: null } }));

    try {
      const res = await fetch(`${API_URL}${executeEndpoint(stepId)}`, { method: 'POST' });
      const data = await res.json();
      setStepStates(prev => ({
        ...prev,
        [stepId]: { status: data.success ? 'success' : 'error', output: data.output },
      }));
      return data.success;
    } catch {
      setStepStates(prev => ({
        ...prev,
        [stepId]: { status: 'error', output: 'Network error' },
      }));
      return false;
    }
  }, [executeEndpoint]);

  const runAll = useCallback(async () => {
    setRunningAll(true);
    let allSuccess = true;
    for (const step of steps) {
      const success = await executeStep(step.id);
      if (!success) {
        allSuccess = false;
        break;
      }
    }
    setRunningAll(false);
    if (allSuccess) onComplete?.();
  }, [steps, executeStep, onComplete]);

  const allDone = steps.length > 0 && steps.every(s => stepStates[s.id]?.status === 'success');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            <span className="text-purple-400">bash</span>back
            <span className="ml-2 text-sm font-normal text-gray-400">{title}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition"
            title="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading steps...</div>
          ) : (
            steps.map((step, i) => {
              const state = stepStates[step.id] || { status: 'pending', output: null };
              return (
                <div key={step.id} className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
                  {/* Step header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <StepIndicator index={i + 1} status={state.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{step.title}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                    <button
                      onClick={() => executeStep(step.id)}
                      disabled={state.status === 'running' || runningAll}
                      className={`shrink-0 rounded px-3 py-1.5 text-xs font-medium transition ${
                        state.status === 'success'
                          ? 'bg-green-900/50 text-green-300'
                          : state.status === 'error'
                          ? 'bg-red-900/50 text-red-300 hover:bg-red-800/50'
                          : state.status === 'running'
                          ? 'bg-purple-900/50 text-purple-300'
                          : 'bg-indigo-700 text-white hover:bg-indigo-600'
                      } disabled:opacity-50`}
                    >
                      {state.status === 'running' ? 'Running...' :
                       state.status === 'success' ? 'Done' :
                       state.status === 'error' ? 'Retry' : 'Execute'}
                    </button>
                  </div>

                  {/* Command preview */}
                  <div className="border-t border-gray-800/50 px-4 py-2">
                    <pre className="text-xs font-mono text-gray-500 overflow-x-auto">
                      <span className="text-gray-600">$ </span>
                      <span className="text-cyan-400/70">{step.command}</span>
                    </pre>
                  </div>

                  {/* Output */}
                  {state.output && (
                    <div className={`border-t px-4 py-2 ${
                      state.status === 'error' ? 'border-red-900/50 bg-red-950/30' : 'border-green-900/50 bg-green-950/30'
                    }`}>
                      <pre className={`text-xs font-mono whitespace-pre-wrap ${
                        state.status === 'error' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {state.output}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-800 px-6 py-4">
          <button
            onClick={runAll}
            disabled={runningAll || allDone}
            className="rounded bg-purple-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50"
          >
            {runningAll ? 'Running all steps...' : allDone ? 'All steps completed' : 'Run all steps'}
          </button>
          {allDone && (
            <span className="text-sm text-green-400 flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Installation complete — restart Claude Code
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ index, status }: { index: number; status: string }) {
  const base = 'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold';
  switch (status) {
    case 'running':
      return <div className={`${base} bg-purple-900/50 text-purple-300 animate-pulse`}>{index}</div>;
    case 'success':
      return (
        <div className={`${base} bg-green-900/50 text-green-300`}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'error':
      return (
        <div className={`${base} bg-red-900/50 text-red-300`}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    default:
      return <div className={`${base} bg-gray-800 text-gray-400`}>{index}</div>;
  }
}
