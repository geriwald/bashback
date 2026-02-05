import { useState } from 'react';
import { useDescriptions } from '../context/DescriptionsContext';

export function SaveButton() {
  const { hasCustomDescriptions, saveToCode, getCustomCount } = useDescriptions();
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
    <button
      onClick={handleSave}
      disabled={saving}
      className="rounded bg-green-700 px-3 py-1.5 text-sm text-white transition hover:bg-green-600 disabled:opacity-50"
      title="Save custom descriptions to explainCommand.ts"
    >
      {saving ? 'Saving...' : message ? message : `Save to code (${count})`}
    </button>
  );
}
