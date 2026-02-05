import { CommandCard } from './CommandCard';
import type { Command } from '../hooks/useWebSocket';

interface CommandListProps {
  commands: Command[];
}

export function CommandList({ commands }: CommandListProps) {
  if (commands.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="mb-2 text-4xl">👀</div>
          <p>Waiting for commands...</p>
          <p className="mt-1 text-sm text-gray-600">
            Claude Code bash commands will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-4 p-4">
        {commands.map((cmd) => (
          <CommandCard
            key={cmd.id}
            timestamp={cmd.timestamp}
            workspace={cmd.workspace}
            command={cmd.command}
          />
        ))}
      </div>
    </div>
  );
}
