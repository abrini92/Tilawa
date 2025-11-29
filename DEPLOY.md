# 🚀 Tilawa - Deployment Guide

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Supabase Setup (15 min)
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Create new project "Tilawa"
- [ ] Copy Project URL and anon key
- [ ] Go to SQL Editor
- [ ] Run `/backend/supabase-schema.sql`
- [ ] Go to Storage → Create bucket "recitations" (public)
- [ ] Verify tables created: `waitlist`, `profiles`, `recitations`

### 2. Environment Variables
Update all `.env` files with real Supabase credentials:

**`/web/.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**`/mobile/.env`:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_API_URL=https://your-backend-url.com
```

**`/backend/.env`:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## 🌐 DEPLOY LANDING PAGE (Vercel)

### Step 1: Push to GitHub
```bash
cd /Users/abderrahim/Desktop/Tilawa
git init
git add .
git commit -m "feat: MVP complete - landing page + mobile app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tilawa.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub → Select "tilawa"
4. Framework Preset: **Next.js**
5. Root Directory: **`web`**
6. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Click "Deploy"
8. Wait 2-3 minutes
9. ✅ Your landing page is live!

### Step 3: Custom Domain (Optional)
1. Vercel Dashboard → Settings → Domains
2. Add `tilawa.app` or your domain
3. Update DNS records as instructed

---

## 📱 MOBILE APP - TEST BUILD

### iOS Simulator (Local Testing)
```bash
cd /Users/abderrahim/Desktop/Tilawa/mobile
npm start
# Press 'i' for iOS simulator
```

### Android Emulator (Local Testing)
```bash
cd /Users/abderrahim/Desktop/Tilawa/mobile
npm start
# Press 'a' for Android emulator
```

### Build for TestFlight (iOS)
```bash
cd /Users/abderrahim/Desktop/Tilawa/mobile
npx eas build --platform ios --profile preview
```

### Build for Internal Testing (Android)
```bash
cd /Users/abderrahim/Desktop/Tilawa/mobile
npx eas build --platform android --profile preview
```

---

## 🔧 BACKEND API (Optional - if needed)

### Deploy on Railway/Render
1. Go to [railway.app](https://railway.app) or [render.com](https://render.com)
2. New Project → Deploy from GitHub
3. Select `backend` folder
4. Add environment variables
5. Deploy

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Landing Page
- [ ] Visit your Vercel URL
- [ ] Test email signup
- [ ] Check Supabase → waitlist table has new entry
- [ ] Verify subscriber count updates

### Mobile App
- [ ] Sign up with test account
- [ ] Browse Feed (should show mock recitations)
- [ ] Go to Upload → Select Al-Fatiha
- [ ] Verify 7 verses load from API
- [ ] Test recording (should work locally)

---

## 🎯 NEXT STEPS (After Deployment)

1. **Share landing page** with friends/family
2. **Collect 100 emails** for beta launch
3. **Test mobile app** with 5-10 users
4. **Fix bugs** based on feedback
5. **Launch beta** in 30 days!

---

## 📞 SUPPORT

If something doesn't work:
1. Check Supabase logs
2. Check Vercel deployment logs
3. Check browser console for errors
4. Verify all environment variables are set

---

**Good luck with the launch! 🚀**
