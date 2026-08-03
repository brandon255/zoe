// MedStage — Animated voice waveform
// Renders an audio-reactive-looking bar visualization. Uses CSS animations
// driven by a randomized pattern that mimics speech rhythm.

import { useEffect, useState } from 'react';

interface VoiceWaveformProps {
  active: boolean;
  barCount?: number;
  height?: number;
}

export function VoiceWaveform({ active, barCount = 5, height = 32 }: VoiceWaveformProps) {
  const [tick, setTick] = useState(0);

  // Drive a smooth pseudo-random animation
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 120);
    return () => clearInterval(id);
  }, [active]);

  // Generate bar heights based on a pseudo-random pattern
  const barHeights = Array.from({ length: barCount }, (_, i) => {
    if (!active) return 4;
    // Combination of sine waves + offset by index for organic feel
    const seed = tick * 0.5 + i * 0.7;
    const wave1 = Math.sin(seed) * 0.5 + 0.5;
    const wave2 = Math.sin(seed * 1.7 + i) * 0.3 + 0.5;
    const combined = (wave1 + wave2) / 2;
    return Math.max(4, combined * height);
  });

  return (
    <div className={`waveform ${active ? 'active' : 'idle'}`} style={{ height }}>
      {barHeights.map((h, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            height: `${h}px`,
            transitionDelay: `${i * 30}ms`,
          }}
        />
      ))}
    </div>
  );
}
