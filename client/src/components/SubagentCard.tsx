import type { SubagentRecord } from '../hooks/useWebSocket';

function formatDuration(start: string, stop: string): string {
  const startDate = new Date(start.replace(' ', 'T'));
  const stopDate = new Date(stop.replace(' ', 'T'));
  const diffMs = stopDate.getTime() - startDate.getTime();
  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
  return `${Math.floor(diffMs / 60000)}m ${Math.round((diffMs % 60000) / 1000)}s`;
}

function truncateId(id: string): string {
  return id.length > 8 ? id.slice(-8) : id;
}

interface SubagentCardProps {
  subagent: SubagentRecord;
}

export function SubagentCard({ subagent }: SubagentCardProps) {
  const isRunning = subagent.status === 'running';

  return (
    <div className={`rounded-lg border p-4 ${isRunning ? 'border-indigo-700 bg-gray-900/90' : 'border-indigo-900/50 bg-gray-900/70'}`}>
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-gray-800 px-2 py-1 font-mono text-xs text-gray-400">
          {subagent.startTimestamp}
        </span>
        <span className={`rounded bg-blue-900/50 px-2 py-1 text-xs font-medium text-blue-300${subagent.workspaceSource === 'dir' ? ' italic' : ''}`}>
          {subagent.workspace}
        </span>
        <span className="rounded bg-indigo-900/50 px-2 py-1 text-xs font-semibold text-indigo-300">
          {subagent.agentType}
        </span>
        <span className="font-mono text-xs text-gray-600" title={subagent.id}>
          {truncateId(subagent.id)}
        </span>
      </div>

      {/* Description + Status */}
      <div className="flex items-center gap-3">
        {subagent.description ? (
          <span className="text-sm text-gray-300">{subagent.description}</span>
        ) : (
          <span className="text-sm italic text-gray-500">{subagent.agentType} agent</span>
        )}

        <span className="ml-auto flex items-center gap-1.5 text-xs">
          {isRunning ? (
            <>
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
              <span className="text-indigo-400">Running...</span>
            </>
          ) : (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              <span className="text-green-400">
                {subagent.stopTimestamp
                  ? formatDuration(subagent.startTimestamp, subagent.stopTimestamp)
                  : 'Completed'}
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
