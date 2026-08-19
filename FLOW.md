# Regenerating the screenshots and demo capture

The screenshots in `screenshots/` are captured from the app running on a
simulator/emulator, not mocked. Here is how to reproduce them.

## iOS (simulator)

```sh
# 1. boot a simulator
xcrun simctl boot "iPhone 17 Pro"
open -a Simulator

# 2. install deps and start Metro
npm install
npx expo start --no-dev            # (or `npx expo run:ios` for a bubble-free standalone build)

# 3. launch the app in Expo Go / the built app, then drive it by deep link
#    the orb screen accepts a `state` param; the lab accepts a `pane` param
xcrun simctl openurl booted "exp://127.0.0.1:8081/--/(tabs)/orb?state=listening"
xcrun simctl openurl booted "exp://127.0.0.1:8081/--/(tabs)/orb?state=speaking"
xcrun simctl openurl booted "exp://127.0.0.1:8081/--/(tabs)/lab?pane=amplitude"

# 4. capture
xcrun simctl io booted screenshot screenshots/04-orb-listening.png
```

Record a video and convert to GIF:

```sh
xcrun simctl io booted recordVideo --codec h264 /tmp/ios.mp4   # Ctrl-C to stop
ffmpeg -y -i /tmp/ios.mp4 -vf "fps=12,scale=300:-1:flags=lanczos,palettegen=stats_mode=diff" /tmp/pal.png
ffmpeg -y -i /tmp/ios.mp4 -i /tmp/pal.png -lavfi "fps=12,scale=300:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" screenshots/demo.gif
```

## Android (emulator or device)

```sh
adb reverse tcp:8081 tcp:8081        # so the device reaches Metro over USB
adb shell am start -a android.intent.action.VIEW \
  -d "exp://127.0.0.1:8081" host.exp.exponent
adb shell screenrecord --time-limit 27 --size 540x1200 /sdcard/ademo.mp4
adb pull /sdcard/ademo.mp4 /tmp/ademo.mp4
ffmpeg -y -i /tmp/ademo.mp4 -vf "fps=12,scale=300:-1:flags=lanczos,palettegen=stats_mode=diff" /tmp/pal.png
ffmpeg -y -i /tmp/ademo.mp4 -i /tmp/pal.png -lavfi "fps=12,scale=300:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" screenshots/demo-android.gif
```

## How the orb works

`src/components/VoiceOrb.tsx` builds three particle layers (far / mid / near),
each a `drawAtlas` pass of a soft radial-glow sprite with additive blending.
Per-layer `useRSXformBuffer` worklets project each particle from a unit sphere
through a simple perspective on the UI thread every frame; the layers spin at
different rates (`spinMul`) for parallax. `GALAXY_VISUALS` in
`src/orbStates.ts` defines a target parameter vector per state; a
`useFrameCallback` eases the live vector toward the target so states blend.
The `amplitude` shared value (normalized 0..1) pulses the shell and core.
