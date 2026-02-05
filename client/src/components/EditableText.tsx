import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  onLookup?: () => Promise<string | null>;
}

export function EditableText({ value, onSave, className = '', placeholder = 'Click to add description', onLookup }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleLookup = async () => {
    if (!onLookup) return;
    setLoading(true);
    const result = await onLookup();
    setLoading(false);
    if (result) {
      setEditValue(result);
    }
  };

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs outline-none focus:border-blue-500 ${className}`}
          style={{ minWidth: '100px', width: `${Math.max(100, editValue.length * 7)}px` }}
        />
        {onLookup && (
          <button
            type="button"
            onClick={handleLookup}
            onMouseDown={(e) => e.preventDefault()}
            disabled={loading}
            className="text-blue-400 hover:text-blue-300 disabled:opacity-50"
            title="Lookup from --help"
          >
            {loading ? '...' : '?'}
          </button>
        )}
      </span>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-800 rounded px-1 -mx-1 ${className} ${!value ? 'italic opacity-50' : ''}`}
      title="Click to edit"
    >
      {value || placeholder}
    </span>
  );
}
