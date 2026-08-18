import {
  Atlas,
  Canvas,
  Circle,
  Group,
  RadialGradient,
  Skia,
  rect,
  useClock,
  useRSXformBuffer,
  vec,
} from '@shopify/react-native-skia';
import { AlphaType, ColorType } from '@shopify/react-native-skia';
import type { SkColor } from '@shopify/react-native-skia';
import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import {
  SharedValue,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import {
  GALAXY_VISUALS,
  GalaxyVisual,
  OrbState,
  TransitionSpec,
  findTransition,
} from '../orbStates';

export interface VoiceOrbProps {
  state: OrbState;
  amplitude: SharedValue<number>;
  transitions: TransitionSpec[];
  size?: number;
  particleCount?: number;
  reduceMotion?: boolean;
}

const SP = 48; // sprite source size (px)
const CAM_Z = 3.2;
const FOCAL = 2.3;

// Deterministic RNG so the galaxy is stable across mounts.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ParticleData {
  dx: Float32Array;
  dy: Float32Array;
  dz: Float32Array;
  radius: Float32Array;
  size: Float32Array;
  seed: Float32Array;
}

function buildParticles(count: number) {
  const rnd = mulberry32(0x1eaf);
  const dx = new Float32Array(count);
  const dy = new Float32Array(count);
  const dz = new Float32Array(count);
  const radius = new Float32Array(count);
  const psize = new Float32Array(count);
  const seed = new Float32Array(count);
  const colors: SkColor[] = [];

  // brand palette
  const indigo = [0.263, 0.38, 0.933];
  const lilac = [0.576, 0.651, 1.0];
  const aqua = [0.078, 0.722, 0.651];
  const coreN = Math.floor(count * 0.12);
  const nebulaN = Math.floor(count * 0.34);

  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1;
    const theta = rnd() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    dx[i] = s * Math.cos(theta);
    dy[i] = u;
    dz[i] = s * Math.sin(theta);
    seed[i] = rnd();

    let r: number;
    let sz: number;
    let a: number;
    let mix: number;
    if (i < coreN) {
      r = 0.1 + rnd() * 0.28;
      sz = 2.6 + rnd() * 2.4;
      a = 0.55 + rnd() * 0.35;
      mix = 0.35 + rnd() * 0.4;
    } else if (i < count - nebulaN) {
      r = 0.85 + (rnd() - 0.5) * 0.3;
      sz = 1.2 + rnd() * 1.5;
      a = 0.35 + rnd() * 0.4;
      mix = rnd();
    } else {
      r = 1.12 + rnd() * 0.7;
      sz = 0.7 + rnd() * 1.0;
      a = 0.12 + rnd() * 0.22;
      mix = 0.5 + rnd() * 0.5;
    }
    radius[i] = r;
    psize[i] = sz;
    // color: indigo -> lilac by mix, then toward aqua for a share of particles
    const base = [
      indigo[0] + (lilac[0] - indigo[0]) * mix,
      indigo[1] + (lilac[1] - indigo[1]) * mix,
      indigo[2] + (lilac[2] - indigo[2]) * mix,
    ];
    const aq = i % 5 === 0 ? 0.6 : 0;
    const col = [
      base[0] + (aqua[0] - base[0]) * aq,
      base[1] + (aqua[1] - base[1]) * aq,
      base[2] + (aqua[2] - base[2]) * aq,
    ];
    colors.push(
      Skia.Color(
        `rgba(${Math.round(col[0] * 255)},${Math.round(col[1] * 255)},${Math.round(
          col[2] * 255,
        )},${a.toFixed(3)})`,
      ),
    );
  }
  return { data: { dx, dy, dz, radius, size: psize, seed } as ParticleData, colors };
}

// One soft radial-glow sprite, reused for every particle via drawAtlas.
// Built from raw RGBA pixels (a white disc with a soft alpha falloff) so it
// renders on the main GPU context - an offscreen-surface snapshot does not.
function makeSprite() {
  const px = new Uint8Array(SP * SP * 4);
  const c = SP / 2;
  for (let y = 0; y < SP; y++) {
    for (let x = 0; x < SP; x++) {
      const dx = (x + 0.5 - c) / c;
      const dy = (y + 0.5 - c) / c;
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      const a = Math.pow(1 - d, 1.7); // soft glow falloff
      const o = (y * SP + x) * 4;
      px[o] = 255;
      px[o + 1] = 255;
      px[o + 2] = 255;
      px[o + 3] = Math.round(a * 255);
    }
  }
  const data = Skia.Data.fromBytes(px);
  return Skia.Image.MakeImage(
    { width: SP, height: SP, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
    data,
    SP * 4,
  );
}

const FIELDS: (keyof GalaxyVisual)[] = [
  'spread', 'spin', 'swirl', 'turbulence', 'coreGlow',
  'pointScale', 'brightness', 'aqua', 'audioDrive', 'tilt',
];

export function VoiceOrb({
  state,
  amplitude,
  transitions,
  size = 320,
  particleCount = 900,
  reduceMotion = false,
}: VoiceOrbProps) {
  const N = Math.max(120, Math.min(1100, particleCount));
  const { data, sprites, colors, image } = useMemo(() => {
    const built = buildParticles(N);
    return {
      data: built.data,
      colors: built.colors,
      sprites: new Array(N).fill(0).map(() => rect(0, 0, SP, SP)),
      image: makeSprite(),
    };
  }, [N]);

  const center = size / 2;
  const screenScale = size * 0.44;
  const sizeK = size * 0.02;

  // particle base data on the UI thread
  const pd = useSharedValue<ParticleData>(data);
  useEffect(() => {
    pd.value = data;
  }, [data]);

  // eased parameter vector + target
  const P = useSharedValue<GalaxyVisual>({ ...GALAXY_VISUALS.idle });
  const T = useSharedValue<GalaxyVisual>({ ...GALAXY_VISUALS.idle });
  const tau = useSharedValue(0.15);
  const rm = useSharedValue(reduceMotion ? 1 : 0);
  const rotY = useSharedValue(0);
  const clock = useClock();

  const prev = useRef<OrbState>('idle');
  useEffect(() => {
    rm.value = reduceMotion ? 1 : 0;
  }, [reduceMotion]);
  useEffect(() => {
    const spec = findTransition(transitions, prev.current, state);
    prev.current = state;
    tau.value = (spec.durationMs / 1000) * (spec.easing === 'spring' ? 0.28 : 0.5);
    T.value = { ...GALAXY_VISUALS[state] };
  }, [state, transitions]);

  // ease every parameter toward the state target + accumulate rotation
  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min(0.05, (frame.timeSincePreviousFrame ?? 16) / 1000);
    const motion = rm.value ? 0.28 : 1;
    const k = 1 - Math.exp(-dt / Math.max(0.05, tau.value));
    const p = { ...P.value };
    const t = T.value;
    for (const f of FIELDS) p[f] += (t[f] - p[f]) * k;
    P.value = p;
    rotY.value += p.spin * motion * dt;
  }, true);

  // per-particle sprite transforms (position + depth-scaled size), 3D projected
  const transforms = useRSXformBuffer(N, (val, i) => {
    'worklet';
    const d = pd.value;
    const p = P.value;
    const time = clock.value / 1000;
    const motion = rm.value ? 0.28 : 1;
    const amp = Math.max(0, Math.min(1, amplitude.value)) * p.audioDrive;

    const r0 = d.radius[i];
    const turb = p.turbulence * Math.sin(time * 1.7 * motion + d.seed[i] * 6.2831);
    const pulse = amp * (r0 < 0.45 ? 0.5 : 0.28);
    const rr = r0 * p.spread * (1 + pulse) + turb;

    let x = d.dx[i] * rr;
    let y = d.dy[i] * rr;
    let z = d.dz[i] * rr;

    // rotate about Y (spin + inner vortex), then tilt about X
    const ay = rotY.value + p.swirl * motion * time * (1.15 - r0);
    const cy = Math.cos(ay);
    const sy = Math.sin(ay);
    let x1 = cy * x + sy * z;
    let z1 = -sy * x + cy * z;
    const ax = 0.42 + p.tilt * Math.sin(time * 0.3) * 0.6;
    const cx = Math.cos(ax);
    const sx = Math.sin(ax);
    let y1 = cx * y - sx * z1;
    let z2 = sx * y + cx * z1;

    const dist = CAM_Z - z2;
    const kk = FOCAL / dist;
    const px = center + x1 * kk * screenScale;
    const py = center - y1 * kk * screenScale;
    const diameter = d.size[i] * sizeK * kk * p.pointScale;
    const scale = diameter / SP;
    // RSXform: uniform scale, no rotation, centered on (px,py)
    val.set(scale, 0, px - (scale * SP) / 2, py - (scale * SP) / 2);
  });

  const brightness = useDerivedValue(() => Math.max(0.15, P.value.brightness));
  // core circle stays large enough to never clip the gradient (no hard rim);
  // the gradient's own falloff + amplitude drive the visible glow size
  const coreGradR = useDerivedValue(
    () =>
      size *
      0.34 *
      (0.6 + P.value.coreGlow * 0.5) *
      (1 + Math.max(0, Math.min(1, amplitude.value)) * P.value.audioDrive * 0.4),
  );
  const coreOpacity = useDerivedValue(() => Math.min(0.85, 0.25 + P.value.coreGlow * 0.6));

  if (!image) return <View style={{ width: size, height: size }} />;

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        {/* inner energy core - soft radial glow, no hard edge */}
        <Group opacity={coreOpacity} blendMode="plus">
          <Circle cx={center} cy={center} r={size * 0.5}>
            <RadialGradient
              c={vec(center, center)}
              r={coreGradR}
              colors={['#B9C6FF', '#4361EE', 'rgba(20,184,166,0.15)', 'rgba(14,14,22,0)']}
              positions={[0, 0.35, 0.7, 1]}
            />
          </Circle>
        </Group>
        {/* layered particle galaxy, additive */}
        <Group opacity={brightness} blendMode="plus">
          <Atlas
            image={image}
            sprites={sprites}
            transforms={transforms}
            colors={colors}
            colorBlendMode="modulate"
          />
        </Group>
      </Canvas>
    </View>
  );
}
