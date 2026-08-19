import {
  AlphaType,
  Atlas,
  Blur,
  Canvas,
  Circle,
  ColorType,
  Group,
  Mask,
  RadialGradient,
  Skia,
  rect,
  useClock,
  useRSXformBuffer,
  vec,
} from '@shopify/react-native-skia';
import type { SkColor, SkImage } from '@shopify/react-native-skia';
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

const SP = 128; // sprite source size (px) - high-res so upscaled glows stay crisp
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

interface LayerData {
  dx: Float32Array;
  dy: Float32Array;
  dz: Float32Array;
  radius: Float32Array;
  size: Float32Array;
  seed: Float32Array;
  colors: SkColor[];
  count: number;
}

// cosmic palette
const COSMIC = {
  deepIndigo: [0.263, 0.38, 0.933],
  lilac: [0.639, 0.694, 1.0],
  violet: [0.486, 0.361, 1.0],
  aqua: [0.078, 0.722, 0.651],
  magenta: [0.694, 0.361, 1.0],
  white: [0.85, 0.9, 1.0],
};

type Vec3 = number[];
function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

interface LayerConfig {
  frac: number; // share of total particles
  rMin: number;
  rMax: number;
  sizeMin: number;
  sizeMax: number;
  alphaMin: number;
  alphaMax: number;
  palette: Vec3[]; // colors to sample between
  spinMul: number; // parallax: rotation speed multiplier
  spriteExp: number; // sprite softness (lower = softer/blurrier look)
}

// far -> near. Depth cue is baked into every axis: far particles are larger,
// softer, dimmer, slower and further out; near particles small, sharp, bright,
// fast and tight. Rendered back-to-front with increasing sharpness.
const LAYERS: LayerConfig[] = [
  {
    frac: 0.28, rMin: 1.05, rMax: 1.9, sizeMin: 1.8, sizeMax: 3.4,
    alphaMin: 0.04, alphaMax: 0.13,
    palette: [COSMIC.violet, COSMIC.deepIndigo, COSMIC.magenta],
    spinMul: 0.5, spriteExp: 0.9,
  },
  {
    frac: 0.38, rMin: 0.75, rMax: 1.15, sizeMin: 0.9, sizeMax: 1.9,
    alphaMin: 0.28, alphaMax: 0.6,
    palette: [COSMIC.deepIndigo, COSMIC.lilac, COSMIC.aqua],
    spinMul: 1.0, spriteExp: 2.0,
  },
  {
    frac: 0.34, rMin: 0.3, rMax: 0.95, sizeMin: 0.45, sizeMax: 1.05,
    alphaMin: 0.55, alphaMax: 0.98,
    palette: [COSMIC.lilac, COSMIC.white, COSMIC.aqua],
    spinMul: 1.8, spriteExp: 3.4,
  },
];

function buildLayer(count: number, cfg: LayerConfig, seedBase: number): LayerData {
  const rnd = mulberry32(seedBase);
  const dx = new Float32Array(count);
  const dy = new Float32Array(count);
  const dz = new Float32Array(count);
  const radius = new Float32Array(count);
  const psize = new Float32Array(count);
  const seed = new Float32Array(count);
  const colors: SkColor[] = [];
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1;
    const theta = rnd() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    dx[i] = s * Math.cos(theta);
    dy[i] = u;
    dz[i] = s * Math.sin(theta);
    seed[i] = rnd();
    radius[i] = cfg.rMin + rnd() * (cfg.rMax - cfg.rMin);
    psize[i] = cfg.sizeMin + rnd() * (cfg.sizeMax - cfg.sizeMin);
    const a = cfg.alphaMin + rnd() * (cfg.alphaMax - cfg.alphaMin);
    const t = rnd() * (cfg.palette.length - 1);
    const i0 = Math.floor(t);
    const col = lerp3(cfg.palette[i0], cfg.palette[Math.min(i0 + 1, cfg.palette.length - 1)], t - i0);
    colors.push(
      Skia.Color(
        `rgba(${Math.round(col[0] * 255)},${Math.round(col[1] * 255)},${Math.round(
          col[2] * 255,
        )},${a.toFixed(3)})`,
      ),
    );
  }
  return { dx, dy, dz, radius, size: psize, seed, colors, count };
}

// One soft radial-glow sprite. `exp` controls falloff: lower = softer (reads as
// out-of-focus depth), higher = tighter/sharper (near layer).
function makeSprite(exp: number): SkImage | null {
  const px = new Uint8Array(SP * SP * 4);
  const c = SP / 2;
  for (let y = 0; y < SP; y++) {
    for (let x = 0; x < SP; x++) {
      const dx = (x + 0.5 - c) / c;
      const dy = (y + 0.5 - c) / c;
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      const a = Math.pow(1 - d, exp);
      const o = (y * SP + x) * 4;
      px[o] = 255;
      px[o + 1] = 255;
      px[o + 2] = 255;
      px[o + 3] = Math.round(a * 255);
    }
  }
  return Skia.Image.MakeImage(
    { width: SP, height: SP, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
    Skia.Data.fromBytes(px),
    SP * 4,
  );
}

// static deep-space starfield scattered across the whole frame (behind the orb)
function buildStars(count: number, size: number) {
  const rnd = mulberry32(0x5747);
  const sprites: ReturnType<typeof rect>[] = [];
  const transforms = [];
  const colors: SkColor[] = [];
  const cx = size / 2;
  const maxR = size * 0.5;
  for (let i = 0; i < count; i++) {
    // scatter within a soft disc (sqrt bias for even areal spread), fade at rim
    const rr = Math.sqrt(rnd()) * maxR;
    const ang = rnd() * Math.PI * 2;
    const x = cx + Math.cos(ang) * rr;
    const y = cx + Math.sin(ang) * rr;
    const edgeFade = Math.max(0, 1 - (rr / maxR) ** 2); // 1 center -> 0 rim
    const s = (0.4 + rnd() * 1.1) / (SP / 6);
    sprites.push(rect(0, 0, SP, SP));
    transforms.push(Skia.RSXform(s, 0, x - (s * SP) / 2, y - (s * SP) / 2));
    const a = (0.15 + rnd() * 0.45) * edgeFade;
    const tint = rnd() < 0.3 ? COSMIC.aqua : COSMIC.lilac;
    colors.push(
      Skia.Color(
        `rgba(${Math.round(tint[0] * 255)},${Math.round(tint[1] * 255)},${Math.round(
          tint[2] * 255,
        )},${a.toFixed(3)})`,
      ),
    );
  }
  return { sprites, transforms, colors };
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
  const N = Math.max(150, Math.min(1500, particleCount));

  const built = useMemo(() => {
    const counts = LAYERS.map((l) => Math.round(N * l.frac));
    const layers = LAYERS.map((cfg, i) => buildLayer(counts[i], cfg, 0x1eaf + i * 977));
    const sprites = LAYERS.map((cfg) => makeSprite(cfg.spriteExp));
    const spriteRects = layers.map((l) => new Array(l.count).fill(0).map(() => rect(0, 0, SP, SP)));
    return { layers, sprites, spriteRects, stars: buildStars(70, size) };
  }, [N, size]);

  const center = size / 2;
  const screenScale = size * 0.4;
  const sizeK = size * 0.02;

  // per-layer base data on the UI thread
  const pd0 = useSharedValue<LayerData>(built.layers[0]);
  const pd1 = useSharedValue<LayerData>(built.layers[1]);
  const pd2 = useSharedValue<LayerData>(built.layers[2]);
  useEffect(() => {
    pd0.value = built.layers[0];
    pd1.value = built.layers[1];
    pd2.value = built.layers[2];
  }, [built]);
  const pds = [pd0, pd1, pd2];

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

  // one projected-transform buffer per depth layer; spinMul creates parallax
  const useLayerBuffer = (layerIndex: number, spinMul: number) =>
    useRSXformBuffer(built.layers[layerIndex].count, (val, i) => {
      'worklet';
      const d = pds[layerIndex].value;
      const p = P.value;
      const time = clock.value / 1000;
      const motion = rm.value ? 0.28 : 1;
      const amp = Math.max(0, Math.min(1, amplitude.value)) * p.audioDrive;

      const r0 = d.radius[i];
      const turb = p.turbulence * Math.sin(time * 1.7 * motion + d.seed[i] * 6.2831);
      const pulse = amp * (r0 < 0.5 ? 0.5 : 0.26);
      const rr = r0 * p.spread * (1 + pulse) + turb;

      const x = d.dx[i] * rr;
      const y = d.dy[i] * rr;
      const z = d.dz[i] * rr;

      const ay = rotY.value * spinMul + p.swirl * motion * time * (1.15 - r0);
      const cyy = Math.cos(ay);
      const syy = Math.sin(ay);
      const x1 = cyy * x + syy * z;
      const z1 = -syy * x + cyy * z;
      const ax = 0.42 + p.tilt * Math.sin(time * 0.3) * 0.6;
      const cxx = Math.cos(ax);
      const sxx = Math.sin(ax);
      const y1 = cxx * y - sxx * z1;
      const z2 = sxx * y + cxx * z1;

      const dist = CAM_Z - z2;
      const kk = FOCAL / dist;
      const px = center + x1 * kk * screenScale;
      const py = center - y1 * kk * screenScale;
      const diameter = d.size[i] * sizeK * kk * p.pointScale;
      const scale = diameter / SP;
      val.set(scale, 0, px - (scale * SP) / 2, py - (scale * SP) / 2);
    });

  const tf0 = useLayerBuffer(0, LAYERS[0].spinMul);
  const tf1 = useLayerBuffer(1, LAYERS[1].spinMul);
  const tf2 = useLayerBuffer(2, LAYERS[2].spinMul);
  const layerBuffers = [tf0, tf1, tf2];

  const brightness = useDerivedValue(() => Math.max(0.2, P.value.brightness));
  const coreGradR = useDerivedValue(
    () =>
      size *
      0.28 *
      (0.6 + P.value.coreGlow * 0.5) *
      (1 + Math.max(0, Math.min(1, amplitude.value)) * P.value.audioDrive * 0.4),
  );
  const coreOpacity = useDerivedValue(() => Math.min(0.42, 0.1 + P.value.coreGlow * 0.32));
  const nebulaOpacity = useDerivedValue(() => 0.25 + P.value.coreGlow * 0.25);
  // subtle starfield parallax: drift opposite the orb spin
  const starShift = useDerivedValue(() => [
    { translateX: Math.sin(rotY.value * 0.4) * (size * 0.012) },
    { translateY: Math.cos(rotY.value * 0.4) * (size * 0.008) },
  ]);

  const layerBlur = [2.0, 0.5, 0];

  if (built.sprites.some((s) => !s)) return <View style={{ width: size, height: size }} />;

  const vignetteMask = (
    <Circle cx={center} cy={center} r={size * 0.5}>
      <RadialGradient
        c={vec(center, center)}
        r={size * 0.5}
        colors={['white', 'white', 'rgba(255,255,255,0)']}
        positions={[0, 0.55, 0.96]}
      />
    </Circle>
  );

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        <Mask mode="alpha" mask={vignetteMask}>
        {/* deep-space nebula backdrop */}
        <Group opacity={nebulaOpacity} blendMode="plus">
          <Circle cx={center} cy={center} r={size * 0.5}>
            <RadialGradient
              c={vec(center * 0.85, center * 0.8)}
              r={size * 0.6}
              colors={['rgba(124,92,255,0.5)', 'rgba(67,97,238,0.25)', 'rgba(14,14,22,0)']}
              positions={[0, 0.5, 1]}
            />
          </Circle>
        </Group>

        {/* deep-space starfield with slight parallax drift */}
        <Group transform={starShift} opacity={0.7} blendMode="plus">
          <Atlas
            image={built.sprites[2]!}
            sprites={built.stars.sprites}
            transforms={built.stars.transforms}
            colors={built.stars.colors}
            colorBlendMode="modulate"
          />
        </Group>

        {/* inner energy core */}
        <Group opacity={coreOpacity} blendMode="plus">
          <Circle cx={center} cy={center} r={size * 0.5}>
            <RadialGradient
              c={vec(center, center)}
              r={coreGradR}
              colors={['#9AA8FF', '#4A5BE0', 'rgba(90,70,200,0.18)', 'rgba(14,14,22,0)']}
              positions={[0, 0.32, 0.7, 1]}
            />
          </Circle>
        </Group>

        {/* three depth layers, back-to-front: far (blurred) -> near (sharp) */}
        {[0, 1, 2].map((li) => (
          <Group key={li} opacity={brightness} blendMode="plus">
            {layerBlur[li] > 0 ? <Blur blur={layerBlur[li]} /> : null}
            <Atlas
              image={built.sprites[li]!}
              sprites={built.spriteRects[li]}
              transforms={layerBuffers[li]}
              colors={built.layers[li].colors}
              colorBlendMode="modulate"
            />
          </Group>
        ))}
       </Mask>
      </Canvas>
    </View>
  );
}
