# 🕌 Tilawa - Preserve the Sacred Art

> Discover, elevate, and preserve the next generation of Quran reciters.  
> **90% Mission, 10% Business.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## ✨ Features

### 🎙️ **Recording Studio**
- Record Quran recitations with all 114 Surahs
- Real-time verse display with Arabic text
- Auto-highlighting of current verse
- Professional audio recording with `expo-av`

### 🎵 **Audio Player**
- Spotify-level playback experience
- Real-time waveform visualization
- Interactive progress bar with seek
- Haptic feedback on all interactions

### 📖 **Quran Integration**
- Al-Quran Cloud API integration
- 5+ professional reciters (Mishary, Abdul Basit, Sudais, etc.)
- Verse-by-verse audio playback
- Complete Surah audio support

### 👥 **Social Features**
- Like recitations
- Follow reciters
- Community feed
- Social sharing

### 🎨 **Modern Design**
- Glassmorphism UI
- Apple-style minimalism
- Emerald color scheme
- Dark mode ready

---

## 🚀 Tech Stack

### **Mobile App**
- **Framework:** React Native + Expo Router
- **Language:** TypeScript
- **State:** Zustand
- **Audio:** expo-av + Audio Queue System
- **UI:** Custom components with haptic feedback

### **Backend**
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **API:** Al-Quran Cloud

### **Web**
- **Framework:** Next.js 14
- **Styling:** TailwindCSS
- **Deployment:** Vercel

---

## 📱 Getting Started

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
expo-cli
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tilawa.git
cd tilawa
```

2. **Install dependencies**
```bash
# Mobile
cd mobile
npm install

# Web
cd ../web
npm install

# Backend
cd ../backend
npm install
```

3. **Setup environment variables**

Create `.env` files in each directory:

**`/mobile/.env`:**
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=your_api_url
```

**`/web/.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Setup Supabase**
```bash
# Run the SQL schema
# Go to Supabase Dashboard > SQL Editor
# Execute: /backend/supabase-setup-simple.sql
```

5. **Run the apps**
```bash
# Mobile
cd mobile
npm start
# Press 'i' for iOS or 'a' for Android

# Web
cd web
npm run dev
# Visit http://localhost:3000
```

---

## 📊 Project Structure

```
tilawa/
├── mobile/                 # React Native mobile app
│   ├── app/               # Expo Router pages
│   │   ├── (auth)/       # Auth screens
│   │   └── (tabs)/       # Main app tabs
│   ├── components/        # Reusable components
│   ├── lib/              # Utilities & services
│   └── assets/           # Images, fonts, etc.
├── web/                   # Next.js landing page
│   ├── app/              # Next.js 14 app directory
│   ├── components/       # React components
│   └── lib/              # Utilities
├── backend/               # Backend services
│   ├── supabase-schema.sql
│   └── api/              # API routes (future)
└── README.md
```

---

## 🎯 Roadmap

### **Phase 1: MVP** ✅ (Current)
- [x] Landing page with email capture
- [x] Mobile app with auth
- [x] Recording studio with 114 Surahs
- [x] Audio player with real Quran audio
- [x] Feed with likes
- [x] Supabase integration

### **Phase 2: Beta** (Week 1-2)
- [ ] Upload to Supabase Storage
- [ ] Push notifications
- [ ] Search & filters
- [ ] Mini-player (persistent)
- [ ] Offline mode
- [ ] Analytics (PostHog)

### **Phase 3: Launch** (Week 3-4)
- [ ] Social graph (follow/followers)
- [ ] Personalized feed
- [ ] Comments & discussions
- [ ] Masterclasses
- [ ] Premium features

### **Phase 4: Scale** (Month 2-3)
- [ ] AI Tajweed feedback
- [ ] Multiple reciters
- [ ] Challenges & competitions
- [ ] Verified reciter badges
- [ ] Mobile app stores (iOS/Android)

---

## 💰 Business Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 uploads/month, Community feed, Basic player |
| **Premium** | $9.99/mo | Unlimited uploads, No ads, HD audio, Analytics |
| **Scholar** | $49.99/mo | Everything + AI Tajweed feedback, Masterclasses, Verified badge |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Al-Quran Cloud** for the amazing Quran API
- **Supabase** for the backend infrastructure
- **Expo** for the mobile framework
- All the reciters who inspire this project

---

## 📞 Contact

- **Website:** [tilawa.app](https://tilawa.app)
- **Email:** contact@tilawa.app
- **Twitter:** [@tilawaapp](https://twitter.com/tilawaapp)

---

<div align="center">

**Built with ❤️ for the Ummah**

*Preserving the sacred art of Quranic recitation, one voice at a time.*

</div>
