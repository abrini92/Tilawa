# Tilawa Mobile

React Native mobile app built with Expo and modern tooling.

## Tech Stack

- **Framework**: React Native + Expo
- **Routing**: Expo Router
- **Auth & Database**: Supabase
- **Monitoring**: Sentry + PostHog
- **Language**: TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm start
```

4. Run on device/simulator:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Project Structure

```
mobile/
├── app/                    # App routes (Expo Router)
│   ├── (auth)/            # Authentication screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Home
│   │   ├── upload.tsx     # Upload audio
│   │   └── profile.tsx    # User profile
│   └── _layout.tsx        # Root layout
├── lib/                   # Utilities and services
│   ├── supabase.ts        # Supabase client
│   ├── auth-context.tsx   # Auth context provider
│   └── api-client.ts      # API client for backend
└── assets/                # Images, fonts, etc.
```

## Features

- **Authentication**: Email/password auth with Supabase
- **File Upload**: Upload audio files for processing
- **Audio Library**: View and manage uploaded files
- **Profile Management**: User profile and settings
- **Offline Support**: Secure token storage with SecureStore

## Environment Variables

Required environment variables:

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `EXPO_PUBLIC_API_URL`: Backend API URL
- `EXPO_PUBLIC_POSTHOG_API_KEY`: PostHog API key (optional)
- `SENTRY_DSN`: Sentry DSN (optional)

## Building for Production

### iOS

1. Configure `app.json` with your bundle identifier
2. Build with EAS:
```bash
npx eas build --platform ios
```

### Android

1. Configure `app.json` with your package name
2. Build with EAS:
```bash
npx eas build --platform android
```

## Monitoring

- **Sentry**: Error tracking and performance monitoring
- **PostHog**: Product analytics and feature flags

Both are automatically initialized in `app/_layout.tsx`.
