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

// Detect inline code commands (node -e, python -c, etc.) and simplify them
function simplifyInlineCode(command: string): { simplified: string; hasInlineCode: boolean; interpreter: string | null } {
  // Patterns: node -e '...', python -c '...', ruby -e '...', perl -e '...', etc.
  const interpreters = ['node', 'python3', 'python', 'ruby', 'perl', 'php', 'bash', 'sh', 'zsh'];
  const interpreterPattern = new RegExp(`^(\\s*(${interpreters.join('|')})\\s+(?:-e|-c)\\s+)(['"])([\\s\\S]*)\\3(\\s*)$`);
  const match = command.match(interpreterPattern);

  if (match) {
    const [, prefix, interpreter, quote, , suffix] = match;
    return {
      simplified: `${prefix}${quote}[inline:${interpreter}]${quote}${suffix}`,
      hasInlineCode: true,
      interpreter
    };
  }

  // Also handle multiline: node -e '\n...\n'
  const multilinePattern = new RegExp(`^(\\s*(${interpreters.join('|')})\\s+(?:-e|-c)\\s+')[\\s\\S]*'(\\s*)$`);
  const multiMatch = command.match(multilinePattern);

  if (multiMatch) {
    const interpreter = multiMatch[2];
    return {
      simplified: `${multiMatch[1]}[inline:${interpreter}]'${multiMatch[3]}`,
      hasInlineCode: true,
      interpreter
    };
  }

  return { simplified: command, hasInlineCode: false, interpreter: null };
}

// Extract heredoc content and return command without it
function extractHeredoc(command: string): { before: string; heredocContent: string | null; delimiter: string | null; after: string | null } {
  // Match <<'DELIM' or <<"DELIM" or <<DELIM or <<-DELIM
  const heredocMatch = command.match(/<<-?['"]?(\w+)['"]?/);
  if (!heredocMatch) {
    return { before: command, heredocContent: null, delimiter: null, after: null };
  }

  const delimiter = heredocMatch[1];
  // Find the closing delimiter on its own line
  const delimiterPattern = new RegExp(`\n${delimiter}(?:\n|$|\\))`);
  const endMatch = command.match(delimiterPattern);

  if (!endMatch) {
    return { before: command, heredocContent: null, delimiter: null, after: null };
  }

  const heredocStart = command.indexOf('\n', heredocMatch.index);
  if (heredocStart === -1) {
    return { before: command, heredocContent: null, delimiter: null, after: null };
  }

  const before = command.slice(0, heredocStart);
  const heredocEnd = endMatch.index! + delimiter.length + 1; // +1 for the \n before delimiter
  const heredocContent = command.slice(heredocStart, heredocEnd);
  let after = command.slice(heredocEnd);

  // If after starts with ) or )", add newline for proper display
  if (after && /^[)"]/.test(after)) {
    after = '\n' + after;
  }

  return { before, heredocContent, delimiter, after: after || null };
}

// Split command line on operators while keeping operators (handles multiline)
function splitCommandLine(line: string): { type: 'command' | 'operator' | 'keyword' | 'heredoc' | 'heredoc-placeholder'; value: string }[] {
  const result: { type: 'command' | 'operator' | 'keyword' | 'heredoc' | 'heredoc-placeholder'; value: string }[] = [];

  // First, extract heredoc content if present
  const { before, heredocContent, delimiter, after } = extractHeredoc(line);
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

  // Add heredoc as placeholder + delimiter (like inline code)
  if (heredocContent && delimiter) {
    result.push({ type: 'operator', value: '\n' });
    result.push({ type: 'heredoc-placeholder', value: `    heredoc content    ` });
    result.push({ type: 'operator', value: '\n' });
    result.push({ type: 'heredoc', value: delimiter });
  }

  // Add any content after the heredoc (like closing parentheses)
  if (after) {
    // If it's just closing brackets/quotes, split them appropriately
    const isClosingFragment = /^\s*[)"'`]+\s*$/.test(after);
    if (isClosingFragment) {
      // Add newline before closing fragment (like in original log)
      result.push({ type: 'operator', value: '\n' });
      // Split into ) as operator and quotes as string
      const trimmed = after.trim();
      for (const char of trimmed) {
        if (char === ')') {
          result.push({ type: 'operator', value: char });
        } else if (char === '"' || char === "'" || char === '`') {
          result.push({ type: 'heredoc', value: char }); // green like strings
        }
      }
    } else {
      result.push({ type: 'command', value: after });
    }
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

// Check if a part is an inline code placeholder marker [inline:interpreter]
const INLINE_CODE_MARKER = /^\[inline:(\w+)\]$/;

function isInlineCodePlaceholder(part: string): { match: boolean; interpreter: string | null } {
  const m = part.match(INLINE_CODE_MARKER);
  if (m) {
    return { match: true, interpreter: m[1] };
  }
  return { match: false, interpreter: null };
}

// Check if a word is an environment variable assignment (VAR=value)
const ENV_VAR_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*=/;

// Render a single command with custom highlighting
function renderCommand(cmd: string, knownFlags: Set<string>) {
  // Split on whitespace AND keep redirections/substitutions as separate tokens
  const parts = cmd.trim().split(/(\s+|(?:2>&1|>&2|&>|2>>|2>|>>|>|<<|<|\$\(|\)))/);
  const elements: JSX.Element[] = [];
  let foundCommand = false;

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

    // Environment variable assignment (VAR=value) - render in blue
    if (!foundCommand && ENV_VAR_PATTERN.test(part)) {
      const eqIndex = part.indexOf('=');
      const varName = part.slice(0, eqIndex);
      const varValue = part.slice(eqIndex + 1);
      elements.push(
        <span key={key} title="Environment variable">
          <span className="text-blue-400">{varName}</span>
          <span className="text-yellow-500">=</span>
          <span className="text-green-400">{varValue}</span>
        </span>
      );
      continue;
    }

    // Base command (first non-env-var word)
    if (!foundCommand) {
      foundCommand = true;
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

    // Quoted strings - check for inline code placeholder
    if (part.startsWith('"') || part.startsWith("'")) {
      const quote = part[0];
      const content = part.slice(1, part.endsWith(quote) ? -1 : undefined);
      const endQuote = part.endsWith(quote) ? quote : '';
      const placeholder = isInlineCodePlaceholder(content);

      if (placeholder.match) {
        // Display as "    interpreter code    " in gray italic
        const displayText = `    ${placeholder.interpreter} code    `;
        elements.push(
          <span key={key}>
            <span className="text-green-400">{quote}</span>
            <span className="text-gray-500 italic">{displayText}</span>
            <span className="text-green-400">{endQuote}</span>
          </span>
        );
      } else {
        elements.push(
          <span key={key} className="text-green-400">{part}</span>
        );
      }
      continue;
    }

    // Check for inline code marker without quotes
    const placeholder = isInlineCodePlaceholder(part);
    if (placeholder.match) {
      const displayText = `    ${placeholder.interpreter} code    `;
      elements.push(
        <span key={key} className="text-gray-500 italic">{displayText}</span>
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

  // Simplify inline code commands (node -e, python -c, etc.)
  const { simplified: displayCommand, hasInlineCode, interpreter } = simplifyInlineCode(command);

  const segments = splitCommandLine(displayCommand);
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
        {multiline && !hasInlineCode && (
          <span
            className="rounded bg-green-900/50 px-2 py-1 text-xs font-medium text-green-300"
            title={`Multiline command (${lineCount} lines)`}
          >
            {lineCount} lines
          </span>
        )}
        {hasInlineCode && (
          <span
            className="rounded bg-gray-700 px-2 py-1 text-xs font-medium text-gray-400 italic"
            title={`Contains inline ${interpreter} code (hidden for readability)`}
          >
            {interpreter} code
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
                <span key={i} className="text-green-400">
                  {segment.value}
                </span>
              );
            }
            if (segment.type === 'heredoc-placeholder') {
              return (
                <span key={i} className="text-gray-500 italic">
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
