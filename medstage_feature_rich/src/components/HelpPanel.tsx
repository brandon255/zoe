// MedStage — Help panel (bottom left)
// Shows voice command cheatsheet, highlights when user says "help"

import { VOICE_HELP_LINES } from '../data/voiceCommands';

interface HelpPanelProps {
  highlighted: boolean;
}

export function HelpPanel({ highlighted }: HelpPanelProps) {
  return (
    <aside className={`help-panel ${highlighted ? 'highlighted' : ''}`} aria-label="Voice commands">
      <div className="help-title">
        <span>Voice commands</span>
        <span className="badge">Speak</span>
      </div>
      <ul className="help-commands">
        {VOICE_HELP_LINES.map((line) => (
          <li key={line.command}>
            <span className="help-cmd">{line.command}</span>
            <span className="help-example">{line.example}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
