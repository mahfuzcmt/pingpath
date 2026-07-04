# MotoLink Mobile (Expo)

React Native + Expo app for professional/corporate fleet clients. Built against the
MotoLink Spring backend (REST + STOMP WebSocket). See `../docs/MOBILE_APP_REQUIREMENTS.md`
for the full screen spec and `../CLAUDE.md` §16 Phase 5.

## Screens built
Tabs: **Home · Map · Vehicles · Alerts**.
- **Login** — email/password → JWT (access + refresh), stored in `expo-secure-store`.
- **Home** — fleet status counts (Moving/Idle/Stopped/Offline), KPI strip (alarms, trips,
  fleet distance today), and per-vehicle "today" stats picker.
- **Map** — live fleet on Mapbox, **Refresh** + **Locate Me**, live WS updates.
- **Vehicles** — search + Moving/Idle/Stopped/Offline filters, status pills, tap → detail.
- **Alerts** — live alarm list with acknowledge.
- **Vehicle detail** (`device/[imei]`) with in-screen tabs:
  - **Track** — live map + telemetry (ignition, GPS, GSM, voltage, speedometer) + engine
    cut/restore commands (GT06 DYD/HFYD).
  - **History** — trip list + route replay (play/pause/speed, live km/h, start/end/location/distance).
  - **Statistics** — today's distance/trips/speeds/durations + device health (voltage, GSM, GPS,
    odometer, engine hours), computed from trips + last location.

## Stack
Expo Router (file-based) · TypeScript strict · axios (with refresh interceptor) ·
`@stomp/stompjs` over the RN WebSocket · Mapbox GL JS inside `react-native-webview`.

> **Map choice:** the map is Mapbox GL JS hosted in a WebView — same vendor/style as the web
> dashboard, and it runs in **Expo Go with no native build**. `src/components/WebMap.tsx` is
> isolated so it can later be swapped for native `@rnmapbox/maps` if higher marker counts demand it.

## Setup
```bash
cd mobile
npm install
cp .env.example .env      # then edit the three values
npm start                 # scan the QR with Expo Go, or press a/i for emulator
```

### .env
| Var | Meaning |
|---|---|
| `EXPO_PUBLIC_API_BASE` | Backend REST base incl. `/api/v1`. Emulator→`10.0.2.2`, device→LAN IP. |
| `EXPO_PUBLIC_WS_BASE` | STOMP endpoint, e.g. `ws://10.0.2.2:8080/ws`. |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Mapbox public token (same one the web app uses). |

The backend must be reachable from the phone/emulator. For a physical device, run the backend
on your machine and use its LAN IP (e.g. `http://192.168.0.10:8080/api/v1`), same Wi‑Fi.

## Layout
```
app/                       # Expo Router routes
  _layout.tsx              # providers + stack
  index.tsx                # auth-gated redirect
  login.tsx
  (tabs)/                  # Map · Vehicles · Alerts
  device/[imei].tsx        # trip history + playback
src/
  api/       client.ts (axios+refresh), endpoints.ts
  auth/      AuthContext.tsx (SecureStore)
  ws/        stomp.ts
  hooks/     useLiveLocations, useDevices, useAlarms
  components/ WebMap.tsx
  types.ts · theme.ts · format.ts · ui.tsx
```

## Not yet built (next)
Calendar-view playback picker, geofences, reports, My Rewards/referral, push (FCM),
Bengali i18n. Per-vehicle **subscription expiry** and **engine-lock state** need new backend
fields before the Statistics tab can show them (requirements doc §8).
