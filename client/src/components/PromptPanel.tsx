import { useSpellCheck } from '../context/SpellCheckContext';
import { usePrivacy } from '../context/PrivacyContext';
import type { Correction } from '../hooks/useWebSocket';

function CorrectedText({ text, corrections }: { text: string; corrections: Correction[] }) {
  if (corrections.length === 0) {
    return <span>{text}</span>;
  }

  // Sort corrections by offset to build segments in order
  const sorted = [...corrections].sort((a, b) => a.offset - b.offset);
  const segments: JSX.Element[] = [];
  let cursor = 0;

  sorted.forEach((c, i) => {
    // Plain text before this correction
    if (c.offset > cursor) {
      segments.push(<span key={`t-${i}`}>{text.slice(cursor, c.offset)}</span>);
    }

    // Corrected span with tooltip
    const original = text.slice(c.offset, c.offset + c.length);
    segments.push(
      <span
        key={`c-${i}`}
        className="underline decoration-red-500 decoration-wavy cursor-help"
        title={`${c.message}${c.replacement ? `\n→ ${c.replacement}` : ''}`}
      >
        {original}
      </span>
    );

    cursor = c.offset + c.length;
  });

  // Remaining text
  if (cursor < text.length) {
    segments.push(<span key="end">{text.slice(cursor)}</span>);
  }

  return <>{segments}</>;
}

export function PromptPanel() {
  const { prompts, toggleEasterEgg } = useSpellCheck();
  const { redact } = usePrivacy();

  // Sort by timestamp descending (newest first)
  const sorted = [...prompts].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <aside className="flex w-[480px] flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-green-400">Spell Check</h2>
        <button
          onClick={toggleEasterEgg}
          className="text-gray-500 hover:text-gray-300 transition"
          title="Close"
        >
          &times;
        </button>
      </div>

      {/* Prompt list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sorted.length === 0 ? (
          <p className="text-xs text-gray-500 italic text-center mt-8">
            Waiting for prompts...
          </p>
        ) : (
          sorted.map((p) => {
            const displayText = redact(p.prompt);
            const totalErrors = p.corrections.length;

            return (
              <div key={p.id} className="rounded border border-gray-800 bg-gray-950 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    {p.timestamp.split(' ')[1] || p.timestamp}
                  </span>
                  {totalErrors === 0 ? (
                    <span className="text-xs text-green-500" title="No errors">
                      OK
                    </span>
                  ) : (
                    <span className="text-xs text-red-400">
                      {totalErrors} {totalErrors === 1 ? 'correction' : 'corrections'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                  <CorrectedText text={displayText} corrections={p.corrections} />
                </p>
                {totalErrors > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-gray-800 pt-2">
                    {p.corrections.map((c, i) => (
                      <li key={i} className="text-xs text-gray-400">
                        <span className="text-red-400">{c.original}</span>
                        {c.replacement && <span className="text-green-400"> → {c.replacement}</span>}
                        <span className="text-gray-500 block">{c.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
