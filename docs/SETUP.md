# Tilawa Setup Guide

Complete setup instructions for the Tilawa platform.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Expo CLI: `npm install -g expo-cli`
- Railway CLI: `npm install -g @railway/cli` (for deployment)
- EAS CLI: `npm install -g eas-cli` (for mobile builds)

## 1. Clone and Install

```bash
git clone <your-repo-url>
cd Tilawa

# Install backend dependencies
cd backend
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

## 2. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be ready

### Configure Storage
1. Navigate to Storage in Supabase dashboard
2. Click "Create Bucket"
3. Name it `audio-files`
4. Set to Public or configure RLS policies

### Set Up RLS Policies

Go to SQL Editor and run:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Get Credentials
1. Go to Settings > API
2. Copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (for backend only)

## 3. Auphonic Setup

1. Sign up at [auphonic.com](https://auphonic.com)
2. Go to Account > API
3. Generate a new API key
4. Copy the key

## 4. Inngest Setup

1. Sign up at [inngest.com](https://inngest.com)
2. Create a new app
3. Go to Settings > Keys
4. Copy:
   - Event Key
   - Signing Key

## 5. Sentry Setup

### Backend Project
1. Create account at [sentry.io](https://sentry.io)
2. Create new project (Node.js)
3. Copy DSN

### Mobile Project
1. Create new project (React Native)
2. Copy DSN

## 6. PostHog Setup

1. Sign up at [posthog.com](https://posthog.com) or [app.posthog.com](https://app.posthog.com)
2. Create a new project
3. Copy API key from Settings

## 7. Configure Environment Variables

### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

AUPHONIC_API_KEY=your_auphonic_key
AUPHONIC_API_URL=https://auphonic.com/api

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

SENTRY_DSN=your_sentry_dsn

POSTHOG_API_KEY=your_posthog_key
POSTHOG_HOST=https://app.posthog.com
```

### Mobile (.env)

```bash
cd mobile
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

EXPO_PUBLIC_API_URL=http://localhost:3000

EXPO_PUBLIC_POSTHOG_API_KEY=your_posthog_key
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com

SENTRY_DSN=your_mobile_sentry_dsn
```

## 8. Run Development Servers

### Backend

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:3000`

Test with:
```bash
curl http://localhost:3000/health
```

### Mobile

```bash
cd mobile
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on your phone

## 9. Test the Setup

### Test Authentication
1. Open mobile app
2. Click "Sign Up"
3. Enter email and password
4. Check email for verification link
5. Sign in with credentials

### Test Upload
1. Sign in to mobile app
2. Go to Upload tab
3. Select an audio file
4. Upload should succeed
5. Check Supabase Storage bucket for file

### Test Backend API

```bash
# Health check
curl http://localhost:3000/health

# Sign in (get token from Supabase)
curl -X POST http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 10. Deploy to Production

### Backend (Railway)

```bash
cd backend
railway login
railway init
railway up
```

Add all environment variables in Railway dashboard.

### Mobile (EAS Build)

```bash
cd mobile
eas login
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Troubleshooting

### Backend won't start
- Check all environment variables are set
- Verify Supabase credentials
- Check port 3000 is not in use

### Mobile app crashes
- Run `npm install` again
- Clear Expo cache: `expo start -c`
- Check environment variables

### Upload fails
- Verify Supabase storage bucket exists
- Check RLS policies are set up
- Ensure user is authenticated

### Auphonic integration fails
- Verify API key is correct
- Check Auphonic account has credits
- Review backend logs for errors

## Next Steps

- Set up push notifications
- Configure custom domain
- Set up CI/CD pipeline
- Add more audio processing features
- Plan migration to R2 storage
