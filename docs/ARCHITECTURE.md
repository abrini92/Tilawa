# Tilawa Architecture

## Overview

Tilawa is a full-stack audio processing platform consisting of a React Native mobile app and a Node.js backend API.

## System Architecture

```
┌─────────────────┐
│   Mobile App    │
│ (React Native)  │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│   Backend API   │
│   (Fastify)     │
└────────┬────────┘
         │
         ├──────────┐
         │          │
         ▼          ▼
┌─────────────┐ ┌──────────┐
│  Supabase   │ │ Inngest  │
│ (DB+Auth+   │ │ (Queue)  │
│  Storage)   │ └──────────┘
└─────────────┘      │
                     ▼
              ┌──────────────┐
              │   Auphonic   │
              │     API      │
              └──────────────┘
```

## Components

### Mobile App (React Native + Expo)

**Technology Stack:**
- React Native 0.73
- Expo SDK 50
- Expo Router (file-based routing)
- TypeScript
- Supabase JS Client
- Sentry (error tracking)
- PostHog (analytics)

**Features:**
- User authentication (email/password)
- Audio file selection and upload
- File management
- User profile
- Offline token storage (SecureStore)

**Structure:**
```
mobile/
├── app/
│   ├── (auth)/          # Auth screens
│   ├── (tabs)/          # Main app tabs
│   └── _layout.tsx      # Root layout
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── auth-context.tsx # Auth state management
│   └── api-client.ts    # Backend API client
└── assets/              # Images, fonts
```

### Backend API (Node.js + Fastify)

**Technology Stack:**
- Node.js 18+
- Fastify 4
- Supabase JS Client
- Inngest (job queue)
- Sentry (error tracking)
- PostHog (analytics)
- Pino (logging)

**Features:**
- RESTful API
- JWT authentication
- File upload handling
- Auphonic integration
- Async job processing
- Rate limiting
- CORS support

**Structure:**
```
backend/
├── src/
│   ├── index.js         # App entry point
│   ├── config/
│   │   ├── supabase.js  # Supabase config
│   │   └── inngest.js   # Inngest config
│   └── routes/
│       ├── auth.js      # Auth endpoints
│       ├── upload.js    # Upload endpoints
│       └── auphonic.js  # Auphonic endpoints
└── railway.toml         # Railway config
```

## Data Flow

### Authentication Flow

```
1. User enters credentials in mobile app
2. Mobile app calls Supabase Auth
3. Supabase returns JWT token
4. Mobile app stores token in SecureStore
5. Token included in all API requests
6. Backend validates token with Supabase
```

### Upload Flow

```
1. User selects audio file in mobile app
2. Mobile app uploads to backend API
3. Backend uploads to Supabase Storage
4. Backend triggers Inngest job
5. Inngest job sends to Auphonic
6. Auphonic processes audio
7. Webhook notifies backend
8. Backend downloads enhanced audio
9. Backend stores in Supabase Storage
10. User notified of completion
```

### Audio Processing Pipeline

```
┌──────────┐
│  Upload  │
└────┬─────┘
     │
     ▼
┌──────────────┐
│  Validation  │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│   Auphonic   │
│  Enhancement │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│   Download   │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│    Store     │
└────┬─────────┘
     │
     ▼
┌──────────────┐
│    Notify    │
└──────────────┘
```

## Database Schema (Supabase)

### Users Table
Managed by Supabase Auth. Contains:
- `id` (UUID)
- `email`
- `created_at`
- `updated_at`

### Storage Buckets

**audio-files**
- Stores user-uploaded audio files
- Organized by user ID: `{user_id}/{timestamp}-{filename}`
- RLS policies ensure users can only access their own files

## API Endpoints

### Health
- `GET /health` - Health check

### Authentication
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/signout` - Sign out

### Upload
- `POST /api/upload` - Upload audio file
- `POST /api/upload/signed-url` - Get signed upload URL
- `GET /api/upload/list` - List user's files

### Auphonic
- `POST /api/auphonic/production` - Create production
- `POST /api/auphonic/production/:uuid/start` - Start production
- `GET /api/auphonic/production/:uuid` - Get status
- `POST /api/auphonic/webhook` - Webhook callback

## Security

### Authentication
- JWT tokens from Supabase Auth
- Tokens stored securely in SecureStore (mobile)
- All API endpoints require valid token
- Service role key used for admin operations

### Storage
- Row Level Security (RLS) on storage
- Users can only access their own files
- Signed URLs for direct uploads
- File size limits enforced

### API
- Rate limiting (100 requests per 15 minutes)
- CORS configured for mobile app
- Input validation on all endpoints
- Error messages sanitized

## Monitoring

### Error Tracking (Sentry)
- Automatic error capture
- Source maps for stack traces
- Performance monitoring
- Release tracking

### Analytics (PostHog)
- User behavior tracking
- Feature usage metrics
- Funnel analysis
- A/B testing capability

### Logging (Pino)
- Structured JSON logs
- Pretty printing in development
- Log levels (debug, info, warn, error)
- Request/response logging

## Scalability

### Current Architecture
- Single backend instance
- Supabase handles database scaling
- Inngest handles job queue
- Stateless API design

### Future Improvements
- Horizontal scaling of backend
- CDN for static assets
- Migration to R2 for storage
- Caching layer (Redis)
- WebSocket for real-time updates

## Deployment

### Backend (Railway)
- Automatic deployments from Git
- Environment variables in dashboard
- Health check endpoint
- Automatic restarts on failure

### Mobile (EAS Build)
- iOS and Android builds
- Over-the-air updates
- Separate production/staging builds
- App store distribution

## Migration Path to R2

When ready to migrate from Supabase Storage to Cloudflare R2:

1. **Setup R2 Bucket**
   - Create bucket in Cloudflare
   - Configure CORS
   - Set up access keys

2. **Update Backend**
   - Add R2 SDK
   - Create storage abstraction layer
   - Support both Supabase and R2

3. **Migrate Files**
   - Script to copy files from Supabase to R2
   - Verify integrity
   - Update database references

4. **Switch Traffic**
   - Feature flag for R2
   - Gradual rollout
   - Monitor for issues

5. **Cleanup**
   - Remove Supabase storage code
   - Delete old files
   - Update documentation
