import { SaveButton } from './SaveButton';

interface HeaderProps {
  connected: boolean;
  filteredCount: number;
  totalCount: number;
  hasFilters: boolean;
  onClear: () => void;
}

export function Header({ connected, filteredCount, totalCount, hasFilters, onClear }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white">
          <span className="text-purple-400">bash</span>back
        </h1>
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
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {filteredCount} command{filteredCount !== 1 ? 's' : ''}
          {hasFilters && ` (${totalCount} total)`}
        </span>
        <SaveButton />
        <button
          onClick={onClear}
          className="rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-gray-700"
        >
          Clear
        </button>
      </div>
    </header>
  );
}
