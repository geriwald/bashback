import { useMemo, useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { CommandList } from './components/CommandList';
import { Filters } from './components/Filters';
import { Header } from './components/Header';
import { DescriptionsProvider } from './context/DescriptionsContext';

function getBaseCommand(command: string): string {
  return command.trim().split(/\s+/)[0];
}

export default function App() {
  const { commands, connected, clearCommands } = useWebSocket();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);

  const workspaces = useMemo(() => {
    const unique = new Set(commands.map((cmd) => cmd.workspace));
    return Array.from(unique).sort();
  }, [commands]);

  const baseCommands = useMemo(() => {
    const counts = new Map<string, number>();
    commands.forEach((cmd) => {
      const base = getBaseCommand(cmd.command);
      counts.set(base, (counts.get(base) || 0) + 1);
    });
    // Sort by frequency
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cmd]) => cmd);
  }, [commands]);

  const filteredCommands = useMemo(() => {
    let filtered = commands;
    if (selectedWorkspace) {
      filtered = filtered.filter((cmd) => cmd.workspace === selectedWorkspace);
    }
    if (selectedCommand) {
      filtered = filtered.filter((cmd) => getBaseCommand(cmd.command) === selectedCommand);
    }
    // Newest first
    return [...filtered].reverse();
  }, [commands, selectedWorkspace, selectedCommand]);

  return (
    <DescriptionsProvider>
      <div className="flex h-screen flex-col">
        <Header
          connected={connected}
          filteredCount={filteredCommands.length}
          totalCount={commands.length}
          hasFilters={!!(selectedWorkspace || selectedCommand)}
          onClear={clearCommands}
        />

      <div className="flex flex-1 overflow-hidden">
        <Filters
          workspaces={workspaces}
          selectedWorkspace={selectedWorkspace}
          onSelectWorkspace={setSelectedWorkspace}
          baseCommands={baseCommands}
          selectedCommand={selectedCommand}
          onSelectCommand={setSelectedCommand}
        />

        <main className="flex-1 overflow-hidden">
          <CommandList commands={filteredCommands} />
        </main>
      </div>
    </div>
    </DescriptionsProvider>
  );
}
