import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { color } from '../theme';
import {
  ORB_VISUALS,
  OrbState,
  OrbVisual,
  TransitionSpec,
  findTransition,
} from '../orbStates';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_POINTS = 48;
const BASE_RADIUS = 38;

interface Particle {
  angle: number;
  radius: number;
  size: number;
  aqua: boolean;
  opacity: number;
}

function makeParticles(count: number): Particle[] {
  // mulberry32 - deterministic field, stable across renders
  let seed = 20260818;
  const rnd = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    angle: rnd() * Math.PI * 2,
    radius: 55 + rnd() * 35,
    size: 0.8 + rnd() * 1.4,
    aqua: rnd() < 0.2,
    opacity: 0.3 + rnd() * 0.7,
  }));
}

export interface VoiceOrbProps {
  state: OrbState;
  amplitude: SharedValue<number>;
  transitions: TransitionSpec[];
  size?: number;
  particleCount?: number;
  reduceMotion?: boolean;
}

/**
 * The animated voice-assistant orb: a circular particle field surrounding a
 * central fluid waveform ring.
 *
 * Every behavioral state is a target vector of visual parameters
 * (ORB_VISUALS). On state change each parameter animates toward its new
 * target with the transition's duration/easing, so states BLEND into each
 * other - there is no hard swap between looping animations. The `amplitude`
 * shared value (normalized 0..1) modulates the ring per frame on the UI
 * thread with zero bridge traffic.
 */
export function VoiceOrb({
  state,
  amplitude,
  transitions,
  size = 320,
  particleCount = 140,
  reduceMotion = false,
}: VoiceOrbProps) {
  const particles = useMemo(() => makeParticles(particleCount), [particleCount]);

  // animated visual parameter vector
  const ringAmp = useSharedValue(ORB_VISUALS.idle.ringAmp);
  const ringSpeed = useSharedValue(ORB_VISUALS.idle.ringSpeed);
  const ringWidth = useSharedValue(ORB_VISUALS.idle.ringWidth);
  const ringOpacity = useSharedValue(ORB_VISUALS.idle.ringOpacity);
  const audioDrive = useSharedValue(ORB_VISUALS.idle.audioDrive);
  const spread = useSharedValue(ORB_VISUALS.idle.particleSpread);
  const particleOpacity = useSharedValue(ORB_VISUALS.idle.particleOpacity);
  const spin = useSharedValue(ORB_VISUALS.idle.particleSpin);
  const glow = useSharedValue(ORB_VISUALS.idle.glow);
  const scale = useSharedValue(ORB_VISUALS.idle.scale);
  const aqua = useSharedValue(ORB_VISUALS.idle.aqua);
  const processing = useSharedValue(0); // 1 = ring collapses to rotating arc

  const prevState = useSharedValue<OrbState>('idle');

  useEffect(() => {
    const spec = findTransition(transitions, prevState.value, state);
    prevState.value = state;
    const v: OrbVisual = ORB_VISUALS[state];
    const animate = (target: number) =>
      spec.easing === 'spring'
        ? withSpring(target, { damping: 14, stiffness: 120 })
        : withTiming(target, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.ease),
          });
    ringAmp.value = animate(v.ringAmp);
    ringSpeed.value = animate(v.ringSpeed);
    ringWidth.value = animate(v.ringWidth);
    ringOpacity.value = animate(v.ringOpacity);
    audioDrive.value = animate(v.audioDrive);
    spread.value = animate(v.particleSpread);
    particleOpacity.value = animate(v.particleOpacity);
    spin.value = animate(v.particleSpin);
    glow.value = animate(v.glow);
    scale.value = animate(v.scale);
    aqua.value = animate(v.aqua);
    processing.value = withTiming(state === 'processing' ? 1 : 0, {
      duration: spec.durationMs,
      easing: Easing.inOut(Easing.ease),
    });
  }, [state, transitions]);

  // clocks driven on the UI thread
  const phase = useSharedValue(0); // ring undulation phase
  const rotation = useSharedValue(0); // particle field rotation (deg)
  const arcAngle = useSharedValue(0); // processing spinner angle (deg)

  useFrameCallback((frame) => {
    'worklet';
    const dt = (frame.timeSincePreviousFrame ?? 16) / 1000;
    const motion = reduceMotion ? 0.25 : 1;
    phase.value += dt * ringSpeed.value * Math.PI * 2 * motion;
    rotation.value = (rotation.value + dt * spin.value * 6 * motion) % 360;
    arcAngle.value = (arcAngle.value + dt * 220 * motion) % 360;
  }, true);

  const ringProps = useAnimatedProps(() => {
    'worklet';
    const amp = amplitude.value;
    const drive = audioDrive.value;
    const collapse = processing.value;
    const baseAmp = ringAmp.value * (1 + drive * amp * 2.2);
    const r0 = BASE_RADIUS * scale.value * (1 + drive * amp * 0.12);
    let d = '';
    const sweep = 1 - collapse * 0.72; // processing: ring closes into an arc
    const start = collapse * ((arcAngle.value * Math.PI) / 180);
    for (let i = 0; i <= RING_POINTS; i++) {
      const a = start + (i / RING_POINTS) * Math.PI * 2 * sweep;
      const wob =
        baseAmp * Math.sin(a * 5 + phase.value * 1.3) * (1 - collapse) +
        baseAmp * 0.4 * Math.sin(a * 9 - phase.value * 2) * (1 - collapse);
      const r = r0 + wob;
      const x = 100 + r * Math.cos(a);
      const y = 100 + r * Math.sin(a);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    if (collapse < 0.5) d += ' Z';
    return {
      d,
      strokeWidth: ringWidth.value,
      opacity: ringOpacity.value,
      stroke: interpolateColor(aqua.value, [0, 1], [color.accent, color.support]),
    };
  });

  const fieldProps = useAnimatedProps(() => {
    'worklet';
    const s = spread.value * (1 + audioDrive.value * amplitude.value * 0.06);
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale: s }] as any,
      opacity: particleOpacity.value,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + glow.value * 0.5 + audioDrive.value * amplitude.value * 0.15,
    transform: [{ scale: scale.value * (1 + glow.value * 0.08) }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={color.accent} stopOpacity="0.55" />
              <Stop offset="55%" stopColor={color.accentDark} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={color.support} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="95" fill="url(#orbGlow)" />
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <AnimatedG origin="100, 100" animatedProps={fieldProps}>
          {particles.map((p, i) => (
            <Circle
              key={i}
              cx={100 + p.radius * Math.cos(p.angle)}
              cy={100 + p.radius * Math.sin(p.angle)}
              r={p.size}
              fill={p.aqua ? color.support : color.accentDark}
              opacity={p.opacity}
            />
          ))}
        </AnimatedG>
        <AnimatedPath
          animatedProps={ringProps}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
