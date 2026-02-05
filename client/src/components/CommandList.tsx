import { useEffect, useRef, useState } from 'react';
import { CommandCard } from './CommandCard';
import type { Command } from '../hooks/useWebSocket';

interface CommandListProps {
  commands: Command[];
}

export function CommandList({ commands }: CommandListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [commands, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isAtBottom);
  };

  if (commands.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="mb-2 text-4xl">👀</div>
          <p>En attente de commandes...</p>
          <p className="mt-1 text-sm text-gray-600">
            Les commandes Bash de Claude Code apparaîtront ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto"
      onScroll={handleScroll}
    >
      <div className="space-y-4 p-4">
        {commands.map((cmd) => (
          <CommandCard
            key={cmd.id}
            timestamp={cmd.timestamp}
            workspace={cmd.workspace}
            command={cmd.command}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-purple-700"
        >
          ↓ Scroll to bottom
        </button>
      )}
    </div>
  );
}
