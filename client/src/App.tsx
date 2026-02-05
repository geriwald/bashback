import { useWebSocket } from './hooks/useWebSocket';
import { CommandList } from './components/CommandList';

export default function App() {
  const { commands, connected, clearCommands } = useWebSocket();

  return (
    <div className="flex h-screen flex-col">
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
              {connected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {commands.length} commande{commands.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={clearCommands}
            className="rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <CommandList commands={commands} />
      </main>
    </div>
  );
}
