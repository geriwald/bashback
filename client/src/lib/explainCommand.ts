// Command descriptions in English
export const COMMAND_DESCRIPTIONS: Record<string, string> = {
  grep: 'Search in files',
  find: 'Find files/directories',
  git: 'Version control',
  ls: 'List directory contents',
  rm: 'Remove files/directories',
  cp: 'Copy files/directories',
  mv: 'Move or rename',
  cat: 'Display file content',
  docker: 'Container management',
  npm: 'Node.js package manager',
  curl: 'HTTP data transfer',
  chmod: 'Change permissions',
  chown: 'Change owner',
  tar: 'Archive and compress',
  ssh: 'Secure remote connection',
  sed: 'Stream editor (search/replace)',
  awk: 'Column text processing',
  ps: 'List processes',
  kill: 'Terminate a process',
  cd: 'Change directory',
  pwd: 'Print working directory',
  echo: 'Display text',
  mkdir: 'Create directory',
  touch: 'Create empty file',
  head: 'Display file beginning',
  tail: 'Display file end',
  wc: 'Count lines/words/chars',
  sort: 'Sort lines',
  uniq: 'Remove duplicates',
  diff: 'Compare two files',
  xargs: 'Execute command on each input',
  which: 'Locate a command',
  whoami: 'Display current user',
  date: 'Display date/time',
  tree: 'Display directory tree',
  less: 'View file page by page',
  more: 'View file page by page',
  nano: 'Simple text editor',
  vim: 'Advanced text editor',
  code: 'Open VS Code',
  node: 'Run JavaScript',
  python: 'Run Python',
  python3: 'Run Python 3',
  pip: 'Python package manager',
  pip3: 'Python 3 package manager',
  brew: 'macOS package manager',
  apt: 'Debian/Ubuntu package manager',
  yum: 'RHEL/CentOS package manager',
  pacman: 'Arch package manager',
  systemctl: 'Systemd service management',
  journalctl: 'View systemd logs',
  ping: 'Test network connectivity',
  traceroute: 'Trace network path',
  netstat: 'Network statistics',
  ifconfig: 'Network configuration',
  ip: 'Advanced network management',
  wget: 'Download files',
  scp: 'Secure remote copy',
  rsync: 'File synchronization',
  gh: 'GitHub CLI',
  jq: 'commandline JSON processor',
  htop: 'Interactive process monitor',
  top: 'Process monitor',
  df: 'Disk space available',
  du: 'File/directory size',
  free: 'Memory available',
  uname: 'System information',
  env: 'Environment variables',
  export: 'Set environment variable',
  source: 'Execute script in current shell',
  alias: 'Create command shortcut',
  history: 'Command history',
  id: 'Display user/group IDs',
  clear: 'Clear terminal',
  exit: 'Exit shell',
  man: 'Command manual',
  sleep: 'Pause for N seconds',
  tee: 'Redirect to file and stdout',
  cut: 'Extract columns',
  tr: 'Replace characters',
  basename: 'Extract filename',
  dirname: 'Extract parent path',
  realpath: 'Absolute path',
  ln: 'Create link',
  stat: 'File information',
  file: 'File type',
  zip: 'ZIP compression',
  unzip: 'ZIP decompression',
  gzip: 'GZIP compression',
  gunzip: 'GZIP decompression',
};

const FLAGS: Record<string, Record<string, string>> = {
  grep: {
    '-r': 'Recursive into subdirectories',
    '-R': 'Recursive (follows symlinks)',
    '-n': 'Show line numbers',
    '-i': 'Case insensitive',
    '-l': 'Show only filenames',
    '-L': 'Show files without matches',
    '-v': 'Invert match (exclude)',
    '-E': 'Extended regex (ERE)',
    '-P': 'Perl regex (PCRE)',
    '-c': 'Count matches',
    '-w': 'Whole word only',
    '-x': 'Whole line only',
    '-A': 'Show N lines after',
    '-B': 'Show N lines before',
    '-C': 'Show N lines before and after',
    '-q': 'Quiet mode',
    '-s': 'Suppress errors',
    '-h': 'Hide filenames',
    '-H': 'Show filenames',
    '--include': 'Include only these files',
    '--exclude': 'Exclude these files',
    '--exclude-dir': 'Exclude these directories',
  },
  find: {
    '-name': 'Search by name (case sensitive)',
    '-iname': 'Search by name (case insensitive)',
    '-type': 'Type: f=file, d=directory, l=link',
    '-mtime': 'Modified N days ago',
    '-mmin': 'Modified N minutes ago',
    '-atime': 'Accessed N days ago',
    '-ctime': 'Metadata changed N days ago',
    '-size': 'Size (+N larger, -N smaller)',
    '-exec': 'Execute command on each result',
    '-delete': 'Delete found files',
    '-print': 'Print results',
    '-maxdepth': 'Maximum search depth',
    '-mindepth': 'Minimum search depth',
    '-empty': 'Empty files/directories',
    '-newer': 'Newer than given file',
    '-perm': 'Specific permissions',
    '-user': 'Owned by this user',
    '-group': 'Owned by this group',
  },
  git: {
    '-m': 'Commit message',
    '-a': 'Add all modified files',
    '-b': 'Create new branch',
    '-d': 'Delete branch',
    '-D': 'Force delete branch',
    '-f': 'Force operation',
    '-i': 'Interactive mode (rebase)',
    '-u': 'Set upstream',
    '-p': 'Push all branches',
    '-n': 'Limit number of commits to show',
    '--amend': 'Modify last commit',
    '--force': 'Force push',
    '--hard': 'Hard reset (loses changes)',
    '--soft': 'Soft reset (keeps changes)',
    '--mixed': 'Mixed reset (default)',
    '--no-verify': 'Skip hooks',
    '--oneline': 'Compact display',
    '--graph': 'Show branch graph',
    '--all': 'All branches',
    '--stat': 'Change statistics',
    '--patch': 'Interactive hunk mode',
    '--autosquash': 'Auto-arrange fixup/squash commits',
    '-v': 'Verbose mode',
  },
  ls: {
    '-l': 'Long format (details)',
    '-a': 'Show hidden files',
    '-h': 'Human readable sizes',
    '-R': 'Recursive',
    '-t': 'Sort by modification time',
    '-S': 'Sort by size',
    '-r': 'Reverse order',
    '-1': 'One file per line',
    '-d': 'Directories only (not contents)',
    '--color': 'Colorize output',
  },
  rm: {
    '-r': 'Recursive (removes directories)',
    '-f': 'Force (no confirmation)',
    '-i': 'Prompt for confirmation',
    '-v': 'Verbose mode',
    '-d': 'Remove empty directories',
  },
  cp: {
    '-r': 'Recursive (copies directories)',
    '-R': 'Recursive (same as -r)',
    '-i': 'Prompt before overwrite',
    '-n': 'Do not overwrite',
    '-u': 'Copy only if newer',
    '-v': 'Verbose mode',
    '-p': 'Preserve attributes',
    '-a': 'Archive (preserve all)',
  },
  mv: {
    '-i': 'Prompt before overwrite',
    '-n': 'Do not overwrite',
    '-u': 'Move only if newer',
    '-v': 'Verbose mode',
    '-f': 'Force (no confirmation)',
  },
  cat: {
    '-n': 'Number lines',
    '-b': 'Number non-empty lines',
    '-s': 'Squeeze blank lines',
    '-A': 'Show all characters',
    '-E': 'Show $ at end of lines',
    '-T': 'Show tabs as ^I',
  },
  docker: {
    '-d': 'Detached mode (background)',
    '-it': 'Interactive with terminal',
    '-p': 'Port mapping',
    '-v': 'Mount volume',
    '-e': 'Environment variable',
    '--rm': 'Remove container on exit',
    '--name': 'Container name',
    '-f': 'Dockerfile or force',
    '-t': 'Image tag',
    '--build': 'Rebuild images',
    '--no-cache': 'No cache',
    '-q': 'Quiet mode',
  },
  npm: {
    '-g': 'Global install',
    '-D': 'Dev dependency',
    '--save-dev': 'Dev dependency',
    '--save': 'Production dependency',
    '-f': 'Force',
    '--force': 'Force install',
    '--legacy-peer-deps': 'Ignore peer dep conflicts',
  },
  curl: {
    '-X': 'HTTP method (GET, POST, etc.)',
    '-H': 'Custom header',
    '-d': 'POST data',
    '-o': 'Output file',
    '-O': 'Keep remote filename',
    '-L': 'Follow redirects',
    '-s': 'Silent mode',
    '-v': 'Verbose mode',
    '-k': 'Ignore SSL errors',
    '-u': 'Authentication user:password',
    '-i': 'Include headers in output',
    '--data-raw': 'Raw data',
    '-F': 'Multipart form data',
  },
  chmod: {
    '-R': 'Recursive',
    '-v': 'Verbose mode',
    '+x': 'Add execute permission',
    '-x': 'Remove execute permission',
    '+r': 'Add read permission',
    '+w': 'Add write permission',
  },
  chown: {
    '-R': 'Recursive',
    '-v': 'Verbose mode',
    '--reference': 'Copy permissions from another file',
  },
  tar: {
    '-c': 'Create archive',
    '-x': 'Extract archive',
    '-v': 'Verbose mode',
    '-f': 'Archive file',
    '-z': 'Gzip compression',
    '-j': 'Bzip2 compression',
    '-J': 'Xz compression',
    '-t': 'List contents',
    '-C': 'Change directory',
  },
  ssh: {
    '-p': 'Port',
    '-i': 'Private key file',
    '-v': 'Verbose mode',
    '-L': 'Local tunnel',
    '-R': 'Remote tunnel',
    '-N': 'No command (tunnel only)',
    '-f': 'Run in background',
  },
  sed: {
    '-i': 'Edit file in place',
    '-e': 'Expression to execute',
    '-n': 'Suppress default output',
    '-r': 'Extended regex',
    '-E': 'Extended regex (alias)',
  },
  awk: {
    '-F': 'Field separator',
    '-v': 'Define variable',
    '-f': 'AWK script file',
  },
  ps: {
    '-a': 'All processes',
    '-u': 'User format',
    '-x': 'Include processes without terminal',
    '-e': 'All processes',
    '-f': 'Full format',
    '--forest': 'Process tree',
  },
  kill: {
    '-9': 'SIGKILL (force)',
    '-15': 'SIGTERM (default, clean)',
    '-HUP': 'SIGHUP (reload config)',
  },
  tail: {
    '-n': 'Number of lines',
    '-f': 'Follow (live updates)',
    '-F': 'Follow with retry',
    '-c': 'Number of bytes',
    '-q': 'Quiet (no headers)',
    '-v': 'Verbose (show headers)',
    '--pid': 'Stop when PID dies',
    '-s': 'Sleep interval for -f',
  },
  head: {
    '-n': 'Number of lines',
    '-c': 'Number of bytes',
    '-q': 'Quiet (no headers)',
    '-v': 'Verbose (show headers)',
  },
  wc: {
    '-l': 'Count lines',
    '-w': 'Count words',
    '-c': 'Count bytes',
    '-m': 'Count characters',
    '-L': 'Longest line length',
  },
  jq: {
    '-r': 'read each line as string instead of JSON',
  },

};

export interface FlagExplanation {
  flag: string;
  value?: string;
  explanation: string;
  isUnknown: boolean;
}

export interface CommandExplanation {
  baseCommand: string;
  subCommand: string | null;
  description: string;
  flags: FlagExplanation[];
  unknownFlags: string[];
  args: string[];
}

// Commands that have subcommands (git add, docker run, npm install, etc.)
const COMMANDS_WITH_SUBCOMMANDS = new Set(['git', 'docker', 'npm', 'yarn', 'pnpm', 'kubectl', 'cargo', 'go']);

/**
 * Tokenize a command string respecting shell quotes.
 * Content inside single or double quotes is kept as a single token.
 */
export function shellTokenize(cmd: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];

    if (inSingleQuote) {
      current += ch;
      if (ch === "'") inSingleQuote = false;
    } else if (inDoubleQuote) {
      current += ch;
      if (ch === '"' && i > 0 && cmd[i - 1] !== '\\') inDoubleQuote = false;
    } else if (ch === "'") {
      current += ch;
      inSingleQuote = true;
    } else if (ch === '"') {
      current += ch;
      inDoubleQuote = true;
    } else if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }

  if (current) tokens.push(current);
  return tokens;
}

/** Check if a token is a quoted string (starts and ends with matching quotes) */
export function isQuotedToken(token: string): boolean {
  return (token.startsWith("'") && token.endsWith("'") && token.length > 1) ||
    (token.startsWith('"') && token.endsWith('"') && token.length > 1);
}

export function explainCommand(command: string): CommandExplanation {
  const parts = shellTokenize(command.trim());

  // Skip environment variable assignments (VAR=value) to find actual command
  let commandStartIndex = 0;
  while (commandStartIndex < parts.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(parts[commandStartIndex])) {
    commandStartIndex++;
  }

  const baseCommand = parts[commandStartIndex] || parts[0];
  const flags: FlagExplanation[] = [];
  const unknownFlags: string[] = [];
  const args: string[] = [];

  // Extract subcommand for git, docker, npm, etc.
  let subCommand: string | null = null;
  if (COMMANDS_WITH_SUBCOMMANDS.has(baseCommand)) {
    // Find first non-flag argument after base command
    for (let j = commandStartIndex + 1; j < parts.length; j++) {
      const p = parts[j];
      if (!p.startsWith('-')) {
        subCommand = p;
        break;
      }
    }
  }

  const commandFlags = FLAGS[baseCommand] || {};
  const description = COMMAND_DESCRIPTIONS[baseCommand] || '';

  const addFlag = (flag: string, value?: string) => {
    const explanation = commandFlags[flag];
    const isUnknown = !explanation;
    if (isUnknown) {
      unknownFlags.push(flag);
    }
    flags.push({
      flag,
      value,
      explanation: explanation || 'Unknown flag',
      isUnknown,
    });
  };

  // Commands where -N means -n N (numeric shorthand)
  const numericShorthandCommands = ['tail', 'head', 'git'];

  let i = commandStartIndex + 1;
  while (i < parts.length) {
    const part = parts[i];

    // Skip quoted tokens entirely - they're arguments, not flags
    if (isQuotedToken(part)) {
      args.push(part);
      i++;
      continue;
    }

    if (part.startsWith('-')) {
      // Check for --flag=value format
      const eqIndex = part.indexOf('=');
      if (eqIndex !== -1) {
        const flag = part.slice(0, eqIndex);
        const value = part.slice(eqIndex + 1);
        addFlag(flag, value);
      }
      // Check for numeric shorthand like -15 for tail/head (means -n 15)
      else if (
        numericShorthandCommands.includes(baseCommand) &&
        /^-\d+$/.test(part)
      ) {
        const num = part.slice(1);
        addFlag('-n', num);
      }
      // Check if next part is a value for this flag
      else if (
        i + 1 < parts.length &&
        !parts[i + 1].startsWith('-') &&
        (part === '-o' ||
          part === '-f' ||
          part === '-p' ||
          part === '-v' ||
          part === '-e' ||
          part === '-H' ||
          part === '-X' ||
          part === '-d' ||
          part === '-u' ||
          part === '-i' ||
          part === '-m' ||
          part === '-t' ||
          part === '-C' ||
          part === '-A' ||
          part === '-B' ||
          part === '-F' ||
          part === '-n' ||
          part === '-c' ||
          part === '-s' ||
          part === '--pid' ||
          part === '--name' ||
          part === '--include' ||
          part === '--exclude' ||
          part === '--exclude-dir' ||
          part === '-name' ||
          part === '-iname' ||
          part === '-type' ||
          part === '-mtime' ||
          part === '-mmin' ||
          part === '-exec' ||
          part === '-maxdepth' ||
          part === '-mindepth' ||
          part === '-size' ||
          part === '-perm' ||
          part === '-user' ||
          part === '-group')
      ) {
        addFlag(part, parts[i + 1]);
        i++;
      }
      // Handle combined flags like -rn, but NOT if all digits (already handled above)
      else if (part.length > 2 && !part.startsWith('--') && !/^-\d+$/.test(part)) {
        const combinedFlags = part.slice(1).split('');
        for (const f of combinedFlags) {
          addFlag(`-${f}`);
        }
      } else {
        addFlag(part);
      }
    } else {
      args.push(part);
    }

    i++;
  }

  return { baseCommand, subCommand, description, flags, unknownFlags, args };
}
