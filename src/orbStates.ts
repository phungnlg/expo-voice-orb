export type OrbState =
  | 'idle'
  | 'activated'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'whisper'
  | 'complete';

export const ORB_STATES: OrbState[] = [
  'idle',
  'activated',
  'listening',
  'processing',
  'speaking',
  'whisper',
  'complete',
];

// Visual parameter vector per state. The orb renderer interpolates between
// these vectors during transitions, so blends are continuous - never a hard
// swap between looping animations.
export interface OrbVisual {
  ringAmp: number; // waveform ring undulation amplitude (px at 200-unit viewBox)
  ringSpeed: number; // undulation cycles per second
  ringWidth: number;
  ringOpacity: number;
  audioDrive: number; // 0..1 how much live amplitude modulates the ring
  particleSpread: number; // 1 = resting radius, >1 pushed outward
  particleOpacity: number;
  particleSpin: number; // revolutions per minute of the particle field
  glow: number; // 0..1 glow strength
  scale: number; // overall orb scale
  aqua: number; // 0..1 aqua mix into the ring stroke
}

export const ORB_VISUALS: Record<OrbState, OrbVisual> = {
  idle: {
    ringAmp: 2, ringSpeed: 0.25, ringWidth: 1.4, ringOpacity: 0.8, audioDrive: 0,
    particleSpread: 1, particleOpacity: 0.45, particleSpin: 0.6, glow: 0.25,
    scale: 1, aqua: 0.15,
  },
  activated: {
    ringAmp: 4, ringSpeed: 0.6, ringWidth: 1.8, ringOpacity: 1, audioDrive: 0,
    particleSpread: 1.12, particleOpacity: 0.85, particleSpin: 1.2, glow: 0.6,
    scale: 1.05, aqua: 0.35,
  },
  listening: {
    ringAmp: 6, ringSpeed: 1.1, ringWidth: 2.2, ringOpacity: 1, audioDrive: 1,
    particleSpread: 1.06, particleOpacity: 0.9, particleSpin: 1.6, glow: 0.7,
    scale: 1.02, aqua: 0.5,
  },
  processing: {
    ringAmp: 0.5, ringSpeed: 0.4, ringWidth: 2.6, ringOpacity: 0.9, audioDrive: 0,
    particleSpread: 1, particleOpacity: 0.7, particleSpin: 5, glow: 0.45,
    scale: 0.98, aqua: 0.9,
  },
  speaking: {
    ringAmp: 8, ringSpeed: 1.4, ringWidth: 2.8, ringOpacity: 1, audioDrive: 1,
    particleSpread: 1.15, particleOpacity: 1, particleSpin: 2, glow: 1,
    scale: 1.08, aqua: 0.6,
  },
  whisper: {
    ringAmp: 1.5, ringSpeed: 0.5, ringWidth: 1.1, ringOpacity: 0.5, audioDrive: 0.35,
    particleSpread: 0.72, particleOpacity: 0.3, particleSpin: 0.4, glow: 0.15,
    scale: 0.85, aqua: 0.2,
  },
  complete: {
    ringAmp: 2, ringSpeed: 0.25, ringWidth: 1.4, ringOpacity: 0.8, audioDrive: 0,
    particleSpread: 1, particleOpacity: 0.45, particleSpin: 0.6, glow: 0.25,
    scale: 1, aqua: 0.15,
  },
};

// 3D galaxy / energy-sphere parameter vector, consumed by the GL renderer.
// Each state is a target; the renderer eases every field toward its target so
// states blend into one another instead of hard-swapping between loops.
export interface GalaxyVisual {
  spread: number; // shell radius multiplier (breathing size)
  spin: number; // base rotation speed (rad/s)
  swirl: number; // tangential vortex speed added to spin (processing)
  turbulence: number; // per-particle noise displacement amplitude
  coreGlow: number; // brightness/size of the inner energy core
  pointScale: number; // particle size multiplier
  brightness: number; // overall particle brightness
  aqua: number; // 0..1 indigo->aqua color mix
  audioDrive: number; // how strongly live amplitude pulses the shell + core
  tilt: number; // extra axis wobble amount
}

export const GALAXY_VISUALS: Record<OrbState, GalaxyVisual> = {
  idle: {
    spread: 1.0, spin: 0.12, swirl: 0, turbulence: 0.05, coreGlow: 0.45,
    pointScale: 1.0, brightness: 0.7, aqua: 0.2, audioDrive: 0, tilt: 0.15,
  },
  activated: {
    spread: 1.16, spin: 0.28, swirl: 0.1, turbulence: 0.12, coreGlow: 0.9,
    pointScale: 1.15, brightness: 1.0, aqua: 0.35, audioDrive: 0, tilt: 0.3,
  },
  listening: {
    spread: 1.08, spin: 0.22, swirl: 0.05, turbulence: 0.14, coreGlow: 0.8,
    pointScale: 1.1, brightness: 1.0, aqua: 0.5, audioDrive: 1, tilt: 0.25,
  },
  processing: {
    spread: 0.9, spin: 0.35, swirl: 1.6, turbulence: 0.1, coreGlow: 0.7,
    pointScale: 1.0, brightness: 0.9, aqua: 0.9, audioDrive: 0, tilt: 0.1,
  },
  speaking: {
    spread: 1.2, spin: 0.3, swirl: 0.15, turbulence: 0.22, coreGlow: 1.0,
    pointScale: 1.2, brightness: 1.0, aqua: 0.6, audioDrive: 1, tilt: 0.35,
  },
  whisper: {
    spread: 0.72, spin: 0.08, swirl: 0, turbulence: 0.04, coreGlow: 0.25,
    pointScale: 0.85, brightness: 0.4, aqua: 0.25, audioDrive: 0.4, tilt: 0.1,
  },
  complete: {
    spread: 1.0, spin: 0.12, swirl: 0, turbulence: 0.05, coreGlow: 0.45,
    pointScale: 1.0, brightness: 0.7, aqua: 0.2, audioDrive: 0, tilt: 0.15,
  },
};

export type EasingName = 'easeInOut' | 'spring';

export interface TransitionSpec {
  from: OrbState | 'any';
  to: OrbState;
  durationMs: number;
  easing: EasingName;
}

export const DEFAULT_TRANSITIONS: TransitionSpec[] = [
  { from: 'idle', to: 'activated', durationMs: 320, easing: 'easeInOut' },
  { from: 'activated', to: 'listening', durationMs: 300, easing: 'spring' },
  { from: 'listening', to: 'processing', durationMs: 420, easing: 'easeInOut' },
  { from: 'processing', to: 'speaking', durationMs: 380, easing: 'spring' },
  { from: 'speaking', to: 'whisper', durationMs: 600, easing: 'easeInOut' },
  { from: 'any', to: 'complete', durationMs: 500, easing: 'easeInOut' },
  { from: 'any', to: 'idle', durationMs: 700, easing: 'easeInOut' },
];

export function findTransition(
  transitions: TransitionSpec[],
  from: OrbState,
  to: OrbState,
): TransitionSpec {
  return (
    transitions.find((t) => t.from === from && t.to === to) ??
    transitions.find((t) => t.from === 'any' && t.to === to) ?? {
      from: 'any',
      to,
      durationMs: 400,
      easing: 'easeInOut',
    }
  );
}

export const STATE_LABEL: Record<OrbState, string> = {
  idle: 'Idle',
  activated: 'Activated',
  listening: 'Listening',
  processing: 'Processing',
  speaking: 'Speaking',
  whisper: 'Whisper',
  complete: 'Complete',
};

export const STATE_CAPTION: Record<OrbState, string> = {
  idle: 'calm continuous drift',
  activated: 'wake acknowledged',
  listening: 'reacting to your voice',
  processing: 'thinking',
  speaking: 'voice output playing',
  whisper: 'haptic pulse fired before playback',
  complete: 'returning to idle',
};
