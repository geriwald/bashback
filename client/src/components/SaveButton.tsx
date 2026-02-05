import { useState } from 'react';
import { useDescriptions } from '../context/DescriptionsContext';

export function SaveButton() {
  const { hasCustomDescriptions, saveToCode, getCustomCount, clearDescriptions } = useDescriptions();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const count = getCustomCount();

  if (!hasCustomDescriptions()) return null;

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const success = await saveToCode();
    setSaving(false);
    if (success) {
      setMessage('Saved!');
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage('Error');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-green-700 px-3 py-1.5 text-sm text-white transition hover:bg-green-600 disabled:opacity-50"
        title="Save custom descriptions to explainCommand.ts"
      >
        {saving ? 'Saving...' : message ? message : `Save descriptions (${count})`}
      </button>
      <button
        onClick={clearDescriptions}
        className="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-gray-600"
        title="Clear custom descriptions from localStorage"
      >
        Clear descriptions
      </button>
    </div>
  );
}
