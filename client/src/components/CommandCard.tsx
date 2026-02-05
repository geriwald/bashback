import { explainCommand, COMMAND_DESCRIPTIONS } from '../lib/explainCommand';
import { FlagExplainer } from './FlagExplainer';
import { EditableText } from './EditableText';
import { useDescriptions } from '../context/DescriptionsContext';

interface CommandCardProps {
  timestamp: string;
  workspace: string;
  command: string;
}

async function fetchCommandDescription(command: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ command });
    const res = await fetch(`http://localhost:3001/api/explain-command?${params}`);
    const data = await res.json();
    return data.description ?? null;
  } catch {
    return null;
  }
}

// Split command line on operators while keeping operators
function splitCommandLine(line: string): { type: 'command' | 'operator'; value: string }[] {
  const result: { type: 'command' | 'operator'; value: string }[] = [];
  const regex = /(\s*(?:&&|\|\||[|;])\s*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'command', value: line.slice(lastIndex, match.index) });
    }
    result.push({ type: 'operator', value: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    result.push({ type: 'command', value: line.slice(lastIndex) });
  }

  return result;
}

// Render a single command with custom highlighting
function renderCommand(cmd: string, knownFlags: Set<string>) {
  const parts = cmd.trim().split(/(\s+)/);
  const elements: JSX.Element[] = [];
  let isFirstWord = true;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const key = `part-${i}`;

    // Whitespace
    if (/^\s+$/.test(part)) {
      elements.push(<span key={key}>{part}</span>);
      continue;
    }

    // Base command (first word)
    if (isFirstWord) {
      isFirstWord = false;
      elements.push(
        <span key={key} className="text-purple-400 font-semibold">{part}</span>
      );
      continue;
    }

    // Flags
    if (part.startsWith('-')) {
      const isUnknown = !knownFlags.has(part);
      elements.push(
        <span
          key={key}
          className={isUnknown ? 'text-orange-400' : 'text-cyan-400'}
        >
          {part}
        </span>
      );
      continue;
    }

    // Quoted strings
    if (part.startsWith('"') || part.startsWith("'")) {
      elements.push(
        <span key={key} className="text-green-400">{part}</span>
      );
      continue;
    }

    // Regular arguments
    elements.push(
      <span key={key} className="text-gray-300">{part}</span>
    );
  }

  return elements;
}

export function CommandCard({ timestamp, workspace, command }: CommandCardProps) {
  const { getCommandDescription, setCommandDescription } = useDescriptions();
  const segments = splitCommandLine(command);
  const commandSegments = segments.filter(s => s.type === 'command');
  const operatorSegments = segments.filter(s => s.type === 'operator');

  // Get explanations for all commands in the chain
  const explanations = commandSegments.map(s => explainCommand(s.value));

  // Build set of known flags for highlighting
  const knownFlags = new Set<string>();
  explanations.forEach(exp => {
    exp.flags.forEach(f => {
      if (!f.isUnknown) knownFlags.add(f.flag);
    });
  });

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      {/* Header with timestamp and workspace */}
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-gray-800 px-2 py-1 font-mono text-xs text-gray-400">
          {timestamp}
        </span>
        <span className="rounded bg-blue-900/50 px-2 py-1 text-xs font-medium text-blue-300">
          {workspace}
        </span>
      </div>

      {/* Command line */}
      <pre className="overflow-x-auto rounded bg-gray-950 p-3 mb-3">
        <code className="text-sm font-mono">
          {segments.map((segment, i) => {
            if (segment.type === 'operator') {
              return (
                <span key={i} className="text-yellow-500 font-bold">
                  {segment.value}
                </span>
              );
            }
            return (
              <span key={i}>
                {renderCommand(segment.value, knownFlags)}
              </span>
            );
          })}
        </code>
      </pre>

      {/* Explanations grouped by command */}
      <div className="space-y-2">
        {explanations.map((exp, i) => {
          const prevOperator = operatorSegments[i - 1]?.value.trim();
          const defaultDesc = COMMAND_DESCRIPTIONS[exp.baseCommand] || '';
          const customDesc = getCommandDescription(exp.baseCommand, defaultDesc);

          return (
            <div key={i} className="flex flex-wrap items-center gap-2">
              {prevOperator && (
                <span className="text-yellow-500 text-xs font-mono">{prevOperator}</span>
              )}
              <span className="rounded bg-purple-900/50 px-2 py-1 text-xs font-medium text-purple-300 font-mono">
                {exp.baseCommand}
              </span>
              <EditableText
                value={customDesc}
                onSave={(val) => setCommandDescription(exp.baseCommand, val)}
                onLookup={() => fetchCommandDescription(exp.baseCommand)}
                className="text-xs text-gray-400"
                placeholder="Add description..."
              />
              {exp.flags.length > 0 && (
                <FlagExplainer flags={exp.flags} baseCommand={exp.baseCommand} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
