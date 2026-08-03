// MedStage — Quick command chips
// Clickable shortcuts for users who prefer to click instead of speak.

import { VOICE_HELP_LINES } from '../data/voiceCommands';

interface QuickCommandsProps {
  onSelect: (example: string) => void;
}

export function QuickCommands({ onSelect }: QuickCommandsProps) {
  // Pick a curated subset of quick commands
  const quick = VOICE_HELP_LINES.filter((l) =>
    l.example.toLowerCase().includes('rotate') ||
    l.example.toLowerCase().includes('zoom') ||
    l.example.toLowerCase().includes('reset') ||
    l.example.toLowerCase().includes('help') ||
    l.example.toLowerCase().includes('show all')
  );

  return (
    <div className="quick-commands">
      {quick.map((line) => (
        <button
          key={line.command}
          className="quick-cmd"
          onClick={() => onSelect(line.example.replace(/['"]/g, '').trim())}
          aria-label={`Run ${line.command}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {line.command}
        </button>
      ))}
    </div>
  );
}
