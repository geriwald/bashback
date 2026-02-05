import type { FlagExplanation } from '../lib/explainCommand';
import { EditableText } from './EditableText';
import { useDescriptions } from '../context/DescriptionsContext';

interface FlagExplainerProps {
  flags: FlagExplanation[];
  baseCommand: string;
  subCommand?: string | null;
}

interface FetchResult {
  explanation: string | null;
  shortForm: string | null;
  longForm: string | null;
}

async function fetchFlagExplanation(command: string, flag: string, subCommand?: string | null): Promise<FetchResult | null> {
  try {
    const params = new URLSearchParams({ command, flag });
    if (subCommand) {
      params.set('subCommand', subCommand);
    }
    const res = await fetch(`http://localhost:3001/api/explain-flag?${params}`);
    const data = await res.json();
    if (data.explanation) {
      return {
        explanation: data.explanation,
        shortForm: data.shortForm,
        longForm: data.longForm,
      };
    }
    return null;
  } catch {
    return null;
  }
}

interface FlagItemProps {
  flag: FlagExplanation;
  baseCommand: string;
  subCommand?: string | null;
  customDesc: string;
  customLongForm: string | null;
  onSave: (desc: string, longForm?: string) => void;
}

function FlagItem({ flag, baseCommand, subCommand, customDesc, customLongForm, onSave }: FlagItemProps) {
  // Flag is "known" if it has a real description (not "Unknown flag")
  const isKnown = !flag.isUnknown || customDesc !== 'Unknown flag';

  // Lookup for EditableText - returns explanation and also saves longForm as side effect
  const lookupForEdit = async (): Promise<string | null> => {
    const result = await fetchFlagExplanation(baseCommand, flag.flag, subCommand);
    if (result?.explanation) {
      if (result.longForm) {
        onSave(customDesc, result.longForm);
      }
      return result.explanation;
    }
    return null;
  };

  // Display format: -x, --long-form or just -x
  // Don't repeat if flag is already long form or if longForm equals flag
  const hasLongForm = !!customLongForm && customLongForm !== flag.flag;
  const displayFlag = hasLongForm ? `${flag.flag}, ${customLongForm}` : flag.flag;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
        isKnown ? 'bg-gray-800' : 'bg-orange-900/30 border border-orange-800/50'
      }`}
    >
      <code className={isKnown ? 'text-cyan-400' : 'text-orange-400'}>
        {displayFlag}
      </code>
      <span className="text-gray-500">→</span>
      <EditableText
        value={customDesc}
        onSave={(val) => onSave(val)}
        onLookup={lookupForEdit}
        className={isKnown ? 'text-gray-300' : 'text-orange-300'}
        placeholder="Add explanation..."
      />
    </span>
  );
}

export function FlagExplainer({ flags, baseCommand, subCommand }: FlagExplainerProps) {
  const { getFlagDescription, setFlagDescription, getFlagLongForm, setFlagLongForm } = useDescriptions();

  if (flags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {flags.map((flag, index) => {
        const customDesc = getFlagDescription(baseCommand, flag.flag, flag.explanation);
        const customLongForm = getFlagLongForm?.(baseCommand, flag.flag) ?? null;
        return (
          <FlagItem
            key={index}
            flag={flag}
            baseCommand={baseCommand}
            subCommand={subCommand}
            customDesc={customDesc}
            customLongForm={customLongForm}
            onSave={(desc, longForm) => {
              setFlagDescription(baseCommand, flag.flag, desc);
              if (longForm && setFlagLongForm) {
                setFlagLongForm(baseCommand, flag.flag, longForm);
              }
            }}
          />
        );
      })}
    </div>
  );
}
