import type { FlagExplanation } from '../lib/explainCommand';

interface FlagExplainerProps {
  flags: FlagExplanation[];
}

export function FlagExplainer({ flags }: FlagExplainerProps) {
  if (flags.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {flags.map((flag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-xs"
          title={flag.explanation}
        >
          <code className="text-cyan-400">{flag.flag}</code>
          {flag.value && (
            <span className="text-gray-400">{flag.value}</span>
          )}
          <span className="text-gray-500">→</span>
          <span className="text-gray-300">{flag.explanation}</span>
        </span>
      ))}
    </div>
  );
}
