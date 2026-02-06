import { SaveButton } from './SaveButton';
import { HookInstallButton } from './HookInstallButton';
import { usePrivacy } from '../context/PrivacyContext';
import { useSpellCheck } from '../context/SpellCheckContext';

interface HeaderProps {
  connected: boolean;
  onClearLog: () => void;
}

export function Header({ connected, onClearLog }: HeaderProps) {
  const { privacyMode, togglePrivacy } = usePrivacy();
  const { easterEggActive, toggleEasterEgg } = useSpellCheck();

  return (
    <header className="relative flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-4">
      {/* Left: status indicators */}
      <div className="flex items-center gap-4">
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
        <HookInstallButton />
      </div>

      {/* Center: title + tagline */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center">
        <h1
          className="text-xl font-bold text-white cursor-pointer select-none"
          onClick={(e) => { if (e.ctrlKey || e.metaKey) toggleEasterEgg(); }}
        >
          <span className={easterEggActive ? 'text-green-400' : 'text-purple-400'}>bash</span>back
        </h1>
        <p className="text-xs text-gray-500 italic">don't let Claude do all the thinking</p>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePrivacy}
          className={`rounded px-3 py-1.5 text-sm transition ${
            privacyMode
              ? 'bg-amber-900/50 text-amber-300 hover:bg-amber-800/50'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          title={privacyMode ? 'Privacy mode ON - sensitive info masked' : 'Privacy mode OFF - click to mask sensitive info'}
        >
          {privacyMode ? 'Privacy ON' : 'Privacy OFF'}
        </button>
        <SaveButton />
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
