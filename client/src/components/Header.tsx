import { SaveButton } from './SaveButton';

interface HeaderProps {
  connected: boolean;
  filteredCount: number;
  totalCount: number;
  hasFilters: boolean;
  onClearDisplay: () => void;
  onClearLog: () => void;
}

export function Header({ connected, filteredCount, totalCount, hasFilters, onClearDisplay, onClearLog }: HeaderProps) {
  return (
    <header className="relative flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-4">
      {/* Left: connection status */}
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-xs text-gray-400">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Center: title + tagline */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">
          <span className="text-purple-400">bash</span>back
        </h1>
        <p className="text-xs text-gray-500 italic leading-tight">
          a local Claude Code bash log tool,<br />
          so it doesn't make you completely dumb
        </p>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {filteredCount} command{filteredCount !== 1 ? 's' : ''}
          {hasFilters && ` (${totalCount} total)`}
        </span>
        <SaveButton />
        <button
          onClick={onClearDisplay}
          className="rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-gray-700"
          title="Clear display only (keeps log file)"
        >
          Clear
        </button>
        <button
          onClick={onClearLog}
          className="rounded bg-red-900/50 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-800/50"
          title="Clear log file and display"
        >
          Clear Log
        </button>
      </div>
    </header>
  );
}
