import { create } from 'zustand';
import {
  DEFAULT_TRANSITIONS,
  EasingName,
  OrbState,
  TransitionSpec,
  findTransition,
} from './orbStates';

export type AmplitudeSource = 'sine' | 'noise' | 'envelope';

export interface TransitionLogEntry {
  at: string; // HH:MM:SS
  from: OrbState;
  to: OrbState;
  durationMs: number;
}

interface OrbLabStore {
  orbState: OrbState;
  previousState: OrbState;
  setOrbState: (next: OrbState) => void;

  transitionLog: TransitionLogEntry[];

  // mock amplitude generator (normalized 0..1 - the same contract a real
  // audio pipeline would feed the orb)
  source: AmplitudeSource;
  frequency: number; // Hz of the generated envelope
  gain: number; // 0..1
  smoothing: number; // 0..1 low-pass factor
  setSource: (s: AmplitudeSource) => void;
  setFrequency: (v: number) => void;
  setGain: (v: number) => void;
  setSmoothing: (v: number) => void;

  transitions: TransitionSpec[];
  updateTransition: (index: number, patch: Partial<Pick<TransitionSpec, 'durationMs' | 'easing'>>) => void;

  particleCount: number;
  showFps: boolean;
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  setParticleCount: (n: number) => void;
  setShowFps: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export const useOrbLab = create<OrbLabStore>((set, get) => ({
  orbState: 'idle',
  previousState: 'idle',
  setOrbState: (next) => {
    const { orbState, transitions, transitionLog } = get();
    if (next === orbState) return;
    const spec = findTransition(transitions, orbState, next);
    set({
      previousState: orbState,
      orbState: next,
      transitionLog: [
        { at: timestamp(), from: orbState, to: next, durationMs: spec.durationMs },
        ...transitionLog,
      ].slice(0, 12),
    });
  },

  transitionLog: [],

  source: 'sine',
  frequency: 0.8,
  gain: 0.7,
  smoothing: 0.35,
  setSource: (source) => set({ source }),
  setFrequency: (frequency) => set({ frequency }),
  setGain: (gain) => set({ gain }),
  setSmoothing: (smoothing) => set({ smoothing }),

  transitions: DEFAULT_TRANSITIONS,
  updateTransition: (index, patch) =>
    set((s) => ({
      transitions: s.transitions.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    })),

  particleCount: 1100,
  showFps: true,
  hapticsEnabled: true,
  reduceMotion: false,
  setParticleCount: (particleCount) => set({ particleCount }),
  setShowFps: (showFps) => set({ showFps }),
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
}));

export type { OrbState, TransitionSpec, EasingName };
