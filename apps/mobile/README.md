# @jayedaad/mobile

Expo (SDK 51) + React Navigation app.

## Assets

`app.json` references `./assets/icon.png`, `./assets/splash.png`, and `./assets/adaptive-icon.png`, none of which exist yet — these are pending the real Figma exports. Drop exported images into:

- `assets/images/` — in-app photos/illustrations
- `assets/icons/` — app icon, adaptive icon, favicon
- `assets/fonts/` — custom fonts (register via `expo-font` once added)

Until real assets land, `expo start`/build will warn about the missing `icon.png`/`splash.png` referenced in `app.json` — expected, not a bug.

## Running

- `pnpm --filter @jayedaad/mobile start` — Metro + QR code for Expo Go on a physical device
- `pnpm --filter @jayedaad/mobile ios` — iOS Simulator
- `pnpm --filter @jayedaad/mobile android` — Android Emulator (requires Android Studio SDK/AVD set up first)
