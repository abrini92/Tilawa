# Tilawa Backend

Node.js backend API built with Fastify, Supabase, and modern tooling.

## Tech Stack

- **Framework**: Fastify
- **Database & Auth**: Supabase (Postgres + Auth + Storage)
- **Queue**: Inngest
- **Audio Enhancement**: Auphonic API
- **Monitoring**: Sentry + PostHog
- **Deployment**: Railway

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

3. Configure Supabase:
   - Create a project at [supabase.com](https://supabase.com)
   - Create a storage bucket named `audio-files`
   - Set the bucket to public or configure RLS policies
   - Copy your project URL and keys to `.env`

4. Configure Auphonic:
   - Get API key from [auphonic.com](https://auphonic.com)
   - Add to `.env`

5. Configure Inngest:
   - Sign up at [inngest.com](https://inngest.com)
   - Get your event key and signing key
   - Add to `.env`

6. Configure monitoring:
   - Sentry: Get DSN from [sentry.io](https://sentry.io)
   - PostHog: Get API key from [posthog.com](https://posthog.com)

## Development

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## API Endpoints

### Health
- `GET /health` - Health check

### Auth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/signout` - Sign out

### Upload
- `POST /api/upload` - Upload audio file
- `POST /api/upload/signed-url` - Get signed upload URL
- `GET /api/upload/list` - List user's uploads

### Auphonic
- `POST /api/auphonic/production` - Create production
- `POST /api/auphonic/production/:uuid/start` - Start production
- `GET /api/auphonic/production/:uuid` - Get production status
- `POST /api/auphonic/webhook` - Webhook for Auphonic callbacks

## Deployment

Deploy to Railway:

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Add environment variables in Railway dashboard

4. Deploy:
```bash
railway up
```

## Migration to R2

When ready to migrate from Supabase Storage to Cloudflare R2:

1. Add R2 credentials to `.env`
2. Update storage client in `src/config/supabase.js`
3. Migrate existing files using a migration script
