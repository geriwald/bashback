interface FiltersProps {
  workspaces: string[];
  selectedWorkspace: string | null;
  onSelectWorkspace: (workspace: string | null) => void;
  baseCommands: string[];
  selectedCommand: string | null;
  onSelectCommand: (command: string | null) => void;
  operators: string[];
  selectedOperator: string | null;
  onSelectOperator: (operator: string | null) => void;
}

const OPERATOR_TOOLTIPS: Record<string, string> = {
  '&&': 'AND: run next command only if previous succeeds',
  '||': 'OR: run next command only if previous fails',
  '|': 'PIPE: send output of previous command to next',
  ';': 'SEQUENCE: run next command regardless of previous result',
  '>': 'REDIRECT: write output to file (overwrite)',
  '>>': 'APPEND: append output to file',
  '<': 'INPUT: read input from file',
  '<<': 'HEREDOC: read input until delimiter',
  '2>&1': 'STDERR to STDOUT: merge error output with standard output',
  '$()': 'COMMAND SUBSTITUTION: execute command and use its output',
};

export function Filters({
  workspaces,
  selectedWorkspace,
  onSelectWorkspace,
  baseCommands,
  selectedCommand,
  onSelectCommand,
  operators,
  selectedOperator,
  onSelectOperator,
}: FiltersProps) {
  const hasWorkspaces = workspaces.length > 1;
  const hasCommands = baseCommands.length > 1;
  const hasOperators = operators.length > 0;

  if (!hasWorkspaces && !hasCommands && !hasOperators) return null;

  return (
    <div className="shrink-0 border-r border-gray-800 bg-gray-900/50 p-3 overflow-y-auto max-w-xs">
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
                }`}
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
            {operators.map((op) => (
              <button
                key={op}
                onClick={() => onSelectOperator(op)}
                title={OPERATOR_TOOLTIPS[op]}
                className={`rounded px-2 py-1 text-xs font-mono transition ${
                  selectedOperator === op
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
