import type { SubagentRecord } from '../hooks/useWebSocket';

// Shell keywords (displayed in pink)
const SHELL_KEYWORDS = new Set(['if', 'then', 'else', 'elif', 'fi', 'for', 'do', 'done', 'while', 'until', 'case', 'esac', 'function']);

function formatDuration(start: string, stop: string): string {
  const startDate = new Date(start.replace(' ', 'T'));
  const stopDate = new Date(stop.replace(' ', 'T'));
  const diffMs = stopDate.getTime() - startDate.getTime();
  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
  return `${Math.floor(diffMs / 60000)}m ${Math.round((diffMs % 60000) / 1000)}s`;
}

interface FiltersProps {
  workspaces: string[];
  workspaceSources: Record<string, 'git' | 'dir'>;
  selectedWorkspace: string | null;
  onSelectWorkspace: (workspace: string | null) => void;
  baseCommands: string[];
  selectedCommand: string | null;
  onSelectCommand: (command: string | null) => void;
  operators: string[];
  selectedOperator: string | null;
  onSelectOperator: (operator: string | null) => void;
  filteredCount: number;
  totalCount: number;
  hasFilters: boolean;
  subagents: SubagentRecord[];
}

export function Filters({
  workspaces,
  workspaceSources,
  selectedWorkspace,
  onSelectWorkspace,
  baseCommands,
  selectedCommand,
  onSelectCommand,
  operators,
  selectedOperator,
  onSelectOperator,
  filteredCount,
  totalCount,
  hasFilters,
  subagents,
}: FiltersProps) {
  const hasWorkspaces = workspaces.length > 0;
  const hasCommands = baseCommands.length > 0;
  const hasOperators = operators.length > 0;

  return (
    <div className="shrink-0 border-r border-gray-800 bg-gray-900/50 p-3 overflow-y-auto max-w-xs flex flex-col">
      {/* Command count */}
      <div className="mb-3 text-center">
        <span className="text-lg font-bold text-white">
          {filteredCount}
        </span>
        <span className="text-sm text-gray-500 ml-1">
          command{filteredCount !== 1 ? 's' : ''}
          {hasFilters && ` / ${totalCount}`}
        </span>
      </div>

      {hasWorkspaces && (
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Projects</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onSelectWorkspace(null)}
              className={`rounded px-2 py-1 text-xs transition ${
                selectedWorkspace === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {workspaces.map((ws) => (
              <button
                key={ws}
                onClick={() => onSelectWorkspace(ws)}
                className={`rounded px-2 py-1 text-xs transition ${
                  selectedWorkspace === ws
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }${workspaceSources[ws] === 'dir' ? ' italic' : ''}`}
              >
                {ws}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasCommands && (
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Commands</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onSelectCommand(null)}
              className={`rounded px-2 py-1 text-xs transition ${
                selectedCommand === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {baseCommands.map((cmd) => (
              <button
                key={cmd}
                onClick={() => onSelectCommand(cmd)}
                className={`rounded px-2 py-1 text-xs font-mono transition ${
                  selectedCommand === cmd
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasOperators && (
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Operators</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onSelectOperator(null)}
              className={`rounded px-2 py-1 text-xs transition ${
                selectedOperator === null
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {operators.map((op) => {
              const isKeyword = SHELL_KEYWORDS.has(op);
              const selectedColor = isKeyword ? 'bg-pink-600 text-white' : 'bg-yellow-600 text-white';
              return (
                <button
                  key={op}
                  onClick={() => onSelectOperator(op)}
                  className={`rounded px-2 py-1 text-xs font-mono transition ${
                    selectedOperator === op
                      ? selectedColor
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {op}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subagents */}
      {subagents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
            Agents ({subagents.length})
          </span>
          <div className="space-y-1.5">
            {[...subagents].reverse().map((sa) => (
              <div
                key={sa.id}
                className={`rounded px-2 py-1.5 text-xs ${
                  sa.status === 'running'
                    ? 'bg-indigo-950/50 border border-indigo-800'
                    : 'bg-gray-800/50 border border-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {sa.status === 'running' ? (
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 shrink-0" />
                  ) : (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  )}
                  <span className="font-semibold text-indigo-300">{sa.agentType}</span>
                  <span className={`text-blue-400/60${sa.workspaceSource === 'dir' ? ' italic' : ''}`}>{sa.workspace}</span>
                  {sa.status === 'completed' && sa.stopTimestamp && (
                    <span className="ml-auto text-green-400/70">{formatDuration(sa.startTimestamp, sa.stopTimestamp)}</span>
                  )}
                </div>
                {sa.description && (
                  <p className="mt-0.5 text-gray-400 truncate" title={sa.description}>{sa.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-800 text-center">
        <a
          href="https://github.com/geriwald/bashback"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-gray-500 hover:text-gray-300 transition"
          title="View on GitHub"
        >
          <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>
        <p className="text-xs text-gray-600 mt-1">v1.0.0</p>
        <p className="text-xs text-gray-500 mt-1 ">
          Fièrement éparpillé par{' '}
          <a
            href="https://scatteredstack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-300 "
          >
            ScatteredStack
          </a>
        </p>
      </div>
    </div>
  );
}
