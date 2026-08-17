import { useEffect } from 'react';
import {
  SharedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { AmplitudeSource } from './store';

// Deterministic pseudo-noise usable inside a worklet.
function pseudoNoise(t: number): number {
  'worklet';
  const x = Math.sin(t * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Mock normalized amplitude stream (0..1).
 *
 * This is the exact input contract the production orb consumes: a per-frame
 * normalized amplitude value. In the real app the lead developer replaces
 * this generator with mic RMS (listening) or TTS output level (speaking) and
 * writes to the same shared value - the orb itself does not change.
 */
export function useMockAmplitude(config: {
  source: AmplitudeSource;
  frequency: number;
  gain: number;
  smoothing: number;
  running?: boolean;
}): SharedValue<number> {
  const amplitude = useSharedValue(0);
  const raw = useSharedValue(0);
  const cfg = useSharedValue({ ...config, running: config.running ?? true });

  useEffect(() => {
    cfg.value = { ...config, running: config.running ?? true };
  }, [config.source, config.frequency, config.gain, config.smoothing, config.running]);

  useFrameCallback((frame) => {
    'worklet';
    const c = cfg.value;
    if (!c.running) {
      amplitude.value = amplitude.value * 0.94;
      return;
    }
    const t = (frame.timestamp ?? 0) / 1000;
    let v = 0;
    if (c.source === 'sine') {
      v = 0.5 + 0.5 * Math.sin(t * c.frequency * Math.PI * 2);
    } else if (c.source === 'noise') {
      v = pseudoNoise(Math.floor(t * 30) / 30);
    } else {
      // envelope: speech-like bursts - a slow gate over a fast tremor
      const gate = Math.max(0, Math.sin(t * c.frequency * Math.PI)) ** 0.6;
      const tremor = 0.6 + 0.4 * Math.sin(t * 11) * Math.sin(t * 4.7);
      v = gate * tremor;
    }
    v = Math.min(1, Math.max(0, v * c.gain));
    raw.value = v;
    // low-pass: higher smoothing = slower response
    const k = 1 - Math.min(0.97, Math.max(0, c.smoothing));
    amplitude.value = amplitude.value + (v - amplitude.value) * k * 0.5;
  }, true);

  return amplitude;
}
