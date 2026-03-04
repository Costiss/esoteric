Mobile app (Expo + React Native + Tamagui)

This directory will contain the Expo project for the mobile application.

## Status

The Expo app has not been initialized yet. PLAN Task 12 covers the initial
scaffolding work (create Expo project with TypeScript strict mode, install
Tamagui, set up screens, and wire Biome).

Current files:

- `biome.json`: Biome configuration enforcing strict TypeScript rules,
  including `noExplicitAny`.

## Prerequisites

Install the following tools before working on the mobile app:

- Node.js (>= 20) and npm
- Expo CLI: `npm install -g @expo/cli`

Once the Expo project is created, typical commands will be:

```sh
cd mobile
npm install
npx expo start
```

To run Biome checks locally:

```sh
cd mobile
npx biome check .
```
