# Lumen Orb Lab - Source Brief

## Title

Lumen Orb Lab

## Description

Lumen Orb Lab is a mobile demo of a production-ready animated voice-assistant
orb: a dimensional, living "energy sphere" that visualizes a voice assistant's
state and reacts to audio in real time. The orb is a 3D-feeling cosmic
particle cloud - layered particles at different depths that drift, glow, and
pulse - rather than a flat 2D graphic. A user opens the app, enters the lab,
and drives the orb through seven behavioral states (Idle, Activated, Listening,
Processing, Speaking, Whisper, and Completion) while a mock amplitude generator
feeds it a normalized 0..1 audio signal. The Lab screens let you trigger any
state, watch the blended transitions logged in real time, shape the mock audio
signal (sine / noise / envelope), tune each transition's duration and easing
curve, and adjust performance options. The orb is built as a single reusable
component with a clean API so a real app can drop it in and feed it live mic or
TTS audio levels.

## Store links

Not yet published - portfolio proof-of-concept.

## Platform

iOS and Android (Expo / React Native, one codebase).

## Category

Developer tool / UI component / creative coding.

## Features

- Animated voice-assistant orb: a 3D atmospheric energy sphere, not a flat 2D orb.
- Three depth layers (far / mid / near) with distinct size, opacity, speed, and
  blur, producing real parallax as they rotate at different rates.
- Deep-space aesthetic: starfield backdrop, violet nebula glow, and a soft
  living core.
- Seven behavioral states with smooth, blended transitions - the orb is driven
  by state, never a hard swap between disconnected loops.
- Audio-reactive: the shell and core pulse to a normalized 0..1 amplitude
  signal; Listening and Speaking states are amplitude-driven.
- Whisper state: a restrained, dimmer animation with a haptic pulse fired just
  before the whispered response.
- Demo harness: state trigger grid with a live transition log.
- Mock amplitude generator with sine / noise / envelope sources and frequency,
  gain, and smoothing controls - the same 0..1 contract a real audio pipeline
  feeds.
- Per-transition tuner: adjust duration (ms) and easing curve (easeInOut /
  spring) for every state transition.
- Performance settings: particle count, live FPS overlay, haptics toggle, and
  reduce-motion.

## Tech stack

Expo / React Native + TypeScript. Rendering with @shopify/react-native-skia
(GPU 2D): the orb is an additive-blended particle sphere drawn with drawAtlas
over three depth layers, a Blur image filter for the far layers, and a Mask for
the circular vignette. Animation and the per-frame amplitude worklets run on
the UI thread via react-native-reanimated (useFrameCallback, useClock, RSXform
buffers). Navigation with Expo Router (tabs + a modal route). State with
Zustand. Haptics via expo-haptics. Fonts: Plus Jakarta Sans (UI) and Space
Grotesk (display / numerals).

## Industry

Voice assistants / conversational AI, creative tooling, mobile UI components.

## Metrics

Unpublished proof-of-concept - no store metrics. Runs at ~60fps on an iPhone 17
Pro simulator and a Pixel-class Android device with ~900-1200 particles across
three layers. 11 screens.

## Research notes

- Verified in-app: all seven states render and blend; amplitude drives the core
  and shell; the whisper state fires a haptic pulse; the orb runs at ~60fps on
  iOS and Android; state and Lab-pane are deep-linkable for demos.
- Mocked / fixtures: audio input is a synthetic amplitude generator (sine /
  noise / envelope), not live mic or TTS - by design, per the phase-1 scope,
  so the component stays deterministic and demoable. A real integration swaps
  the generator for mic RMS (Listening) or TTS output level (Speaking) writing
  to the same normalized 0..1 signal, with no change to the orb internals.
- The renderer targets react-native-skia specifically because a raw expo-gl /
  WebGL path renders blank on the iOS Simulator; Skia runs on both the
  simulator and devices.

## Future work

- Weave an explicit audio-reactive waveform / ring through the core and add
  outward energy pulses on voice onset, so the living core is visibly the
  source of the audio response.
- Live audio input adapter (mic + TTS level) as a drop-in replacement for the
  mock generator.
- Additional states / theming hooks and a small integration guide for host apps.
