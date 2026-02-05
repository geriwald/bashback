import { explainCommand, COMMAND_DESCRIPTIONS } from '../lib/explainCommand';
import { FlagExplainer } from './FlagExplainer';
import { EditableText } from './EditableText';
import { useDescriptions } from '../context/DescriptionsContext';

interface CommandCardProps {
  timestamp: string;
  workspace: string;
  command: string;
}

const OPERATOR_TOOLTIPS: Record<string, string> = {
  '&&': 'AND: run next command only if previous succeeds',
  '||': 'OR: run next command only if previous fails',
  '|': 'PIPE: send output of previous command to next',
  ';': 'SEQUENCE: run next command regardless of previous result',
  '\\': 'LINE CONTINUATION: continue command on next line',
  '<<': 'HEREDOC: read input until delimiter (e.g., <<EOF...EOF)',
  '>>': 'APPEND: append output to file',
  '>': 'REDIRECT: write output to file (overwrite)',
  '<': 'INPUT: read input from file',
  '2>&1': 'STDERR to STDOUT: merge error output with standard output',
  '2>': 'STDERR: redirect error output',
  '&>': 'ALL OUTPUT: redirect both stdout and stderr',
  '>&2': 'TO STDERR: send output to error stream',
  '$(': 'COMMAND SUBSTITUTION: execute command and use its output',
  ')': 'END: closing bracket',
};

// Shell keywords that should not be treated as commands
const SHELL_KEYWORDS = new Set([
  'if', 'then', 'else', 'elif', 'fi',
  'for', 'do', 'done',
  'while', 'until',
  'case', 'esac',
  'function',
]);

function getOperatorTooltip(op: string): string {
  const trimmed = op.trim();
  return OPERATOR_TOOLTIPS[trimmed] || trimmed;
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

// Extract heredoc content and return command without it
function extractHeredoc(command: string): { before: string; heredocContent: string | null; after: string | null } {
  // Match <<'DELIM' or <<"DELIM" or <<DELIM or <<-DELIM
  const heredocMatch = command.match(/<<-?['"]?(\w+)['"]?/);
  if (!heredocMatch) {
    return { before: command, heredocContent: null, after: null };
  }

  const delimiter = heredocMatch[1];
  // Find the closing delimiter on its own line
  const delimiterPattern = new RegExp(`\n${delimiter}(?:\n|$|\\))`);
  const endMatch = command.match(delimiterPattern);

  if (!endMatch) {
    return { before: command, heredocContent: null, after: null };
  }

  const heredocStart = command.indexOf('\n', heredocMatch.index);
  if (heredocStart === -1) {
    return { before: command, heredocContent: null, after: null };
  }

  const before = command.slice(0, heredocStart);
  const heredocEnd = endMatch.index! + delimiter.length + 1; // +1 for the \n before delimiter
  const heredocContent = command.slice(heredocStart, heredocEnd);
  const after = command.slice(heredocEnd);

  return { before, heredocContent, after: after || null };
}

// Split command line on operators while keeping operators (handles multiline)
function splitCommandLine(line: string): { type: 'command' | 'operator' | 'keyword' | 'heredoc'; value: string }[] {
  const result: { type: 'command' | 'operator' | 'keyword' | 'heredoc'; value: string }[] = [];

  // First, extract heredoc content if present
  const { before, heredocContent, after } = extractHeredoc(line);
  const commandPart = before;

  // Match operators: &&, ||, |, ;, and line continuation \n (with optional \)
  const regex = /(\s*(?:&&|\|\||[|;])\s*|\\\n|\n)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(commandPart)) !== null) {
    if (match.index > lastIndex) {
      const segment = commandPart.slice(lastIndex, match.index);
      result.push(...classifySegment(segment));
    }
    // For line continuation or newline
    if (match[1] === '\\\n') {
      result.push({ type: 'operator', value: ' \\\n' });
    } else if (match[1] === '\n') {
      result.push({ type: 'operator', value: '\n' });
    } else {
      result.push({ type: 'operator', value: match[1] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < commandPart.length) {
    const segment = commandPart.slice(lastIndex);
    result.push(...classifySegment(segment));
  }

  // Add heredoc content as a single block (not parsed)
  if (heredocContent) {
    result.push({ type: 'heredoc', value: heredocContent });
  }

  // Add any content after the heredoc (like closing parentheses)
  if (after) {
    result.push({ type: 'command', value: after });
  }

  return result;
}

// Classify a segment as command or keyword
function classifySegment(segment: string): { type: 'command' | 'operator' | 'keyword'; value: string }[] {
  const trimmed = segment.trim();
  if (!trimmed) return [];

  // Skip lines that start with > (likely heredoc content or prompt output)
  if (trimmed.startsWith('>') && !trimmed.startsWith('>>')) {
    return [{ type: 'command', value: segment }];
  }

  // Check if it's just a shell keyword
  const firstWord = trimmed.split(/\s+/)[0];
  if (SHELL_KEYWORDS.has(firstWord)) {
    return [{ type: 'keyword', value: segment }];
  }

  return [{ type: 'command', value: segment }];
}

// Redirection and substitution patterns for highlighting
const SPECIAL_PATTERN = /^(2>&1|>&2|&>|2>>|2>|>>|>|<<|<|\$\(|\))$/;

// Render a single command with custom highlighting
function renderCommand(cmd: string, knownFlags: Set<string>) {
  // Split on whitespace AND keep redirections/substitutions as separate tokens
  const parts = cmd.trim().split(/(\s+|(?:2>&1|>&2|&>|2>>|2>|>>|>|<<|<|\$\(|\)))/);
  const elements: JSX.Element[] = [];
  let isFirstWord = true;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    const key = `part-${i}`;

    // Whitespace
    if (/^\s+$/.test(part)) {
      elements.push(<span key={key}>{part}</span>);
      continue;
    }

    // Redirections and special operators
    if (SPECIAL_PATTERN.test(part)) {
      elements.push(
        <span key={key} className="text-yellow-500 font-bold" title={getOperatorTooltip(part)}>
          {part}
        </span>
      );
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

// Check if command is multiline
function isMultiline(cmd: string): boolean {
  return cmd.includes('\n');
}

// Count lines in a command
function countLines(cmd: string): number {
  return cmd.split('\n').length;
}

export function CommandCard({ timestamp, workspace, command }: CommandCardProps) {
  const { getCommandDescription, setCommandDescription } = useDescriptions();
  const segments = splitCommandLine(command);
  const commandSegments = segments.filter(s => s.type === 'command');
  const multiline = isMultiline(command);
  const lineCount = multiline ? countLines(command) : 1;

  // Get explanations for all commands in the chain (skip keywords and duplicates)
  const seenCommands = new Set<string>();
  const explanations = commandSegments
    .map(s => explainCommand(s.value))
    .filter(exp => {
      // Skip shell keywords
      if (SHELL_KEYWORDS.has(exp.baseCommand)) return false;
      // Skip duplicates
      if (seenCommands.has(exp.baseCommand)) return false;
      seenCommands.add(exp.baseCommand);
      return true;
    });

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
        {multiline && (
          <span
            className="rounded bg-green-900/50 px-2 py-1 text-xs font-medium text-green-300"
            title={`Multiline command (${lineCount} lines)`}
          >
            {lineCount} lines
          </span>
        )}
      </div>

      {/* Command line */}
      <pre className="overflow-x-auto rounded bg-gray-950 p-3 mb-3">
        <code className="text-sm font-mono">
          {segments.map((segment, i) => {
            if (segment.type === 'operator') {
              return (
                <span key={i} className="text-yellow-500 font-bold" title={getOperatorTooltip(segment.value.trim())}>
                  {segment.value}
                </span>
              );
            }
            if (segment.type === 'keyword') {
              return (
                <span key={i} className="text-pink-400 font-semibold">
                  {segment.value}
                </span>
              );
            }
            if (segment.type === 'heredoc') {
              return (
                <span key={i} className="text-green-400/70 italic">
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
          const defaultDesc = COMMAND_DESCRIPTIONS[exp.baseCommand] || '';
          const customDesc = getCommandDescription(exp.baseCommand, defaultDesc);

          return (
            <div key={i} className="flex flex-wrap items-center gap-2">
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
