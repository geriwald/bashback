import { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/github-dark.css';
import { explainCommand } from '../lib/explainCommand';
import { FlagExplainer } from './FlagExplainer';

hljs.registerLanguage('bash', bash);

interface CommandCardProps {
  timestamp: string;
  workspace: string;
  command: string;
}

export function CommandCard({ timestamp, workspace, command }: CommandCardProps) {
  const codeRef = useRef<HTMLElement>(null);
  const explanation = explainCommand(command);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted');
      hljs.highlightElement(codeRef.current);
    }
  }, [command]);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-800 px-2 py-1 font-mono text-xs text-gray-400">
            {timestamp}
          </span>
          <span className="rounded bg-blue-900/50 px-2 py-1 text-xs font-medium text-blue-300">
            {workspace}
          </span>
        </div>
        <span className="rounded bg-purple-900/50 px-2 py-1 text-xs font-medium text-purple-300">
          {explanation.baseCommand}
        </span>
      </div>

      <pre className="overflow-x-auto rounded bg-gray-950 p-3">
        <code ref={codeRef} className="language-bash text-sm">
          {command}
        </code>
      </pre>

      <FlagExplainer flags={explanation.flags} />

      {explanation.args.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-gray-600">Arguments:</span>{' '}
          {explanation.args.map((arg, i) => (
            <code key={i} className="mx-1 rounded bg-gray-800 px-1 text-gray-400">
              {arg}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}
