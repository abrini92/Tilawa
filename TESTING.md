# 🧪 Tilawa - Testing Checklist

## 🌐 LANDING PAGE TESTS

### Visual/UX
- [ ] Logo displays correctly
- [ ] Countdown timer shows correct time
- [ ] Background animations are smooth
- [ ] Parallax effect works on mouse move
- [ ] Mobile responsive (test on phone)

### Functionality
- [ ] Email input accepts valid emails
- [ ] Email input rejects invalid emails
- [ ] "Get notified" button works
- [ ] Success message shows after submission
- [ ] Subscriber count increments
- [ ] User number displays correctly
- [ ] Social media links work
- [ ] Footer links work

### Supabase Integration
- [ ] Email saves to `waitlist` table
- [ ] Duplicate emails show error message
- [ ] Subscriber count fetches from database
- [ ] RLS policies allow public insert/select

---

## 📱 MOBILE APP TESTS

### Authentication
- [ ] Sign up with new email works
- [ ] Sign in with existing email works
- [ ] Invalid credentials show error
- [ ] Session persists after app restart
- [ ] Logout works

### Home/Feed Screen
- [ ] Mock recitations display
- [ ] Cards show reciter name, surah, plays
- [ ] Clicking card opens player
- [ ] Scroll is smooth

### Audio Player
- [ ] Modal opens when clicking recitation
- [ ] Reciter info displays correctly
- [ ] Play button shows
- [ ] Close button works
- [ ] (Audio playback - to implement)

### Upload/Recording Screen
- [ ] All 114 surahs display
- [ ] Scroll through list works
- [ ] Clicking surah loads verses
- [ ] Loading spinner shows
- [ ] Verses display in Arabic (RTL)
- [ ] Verse numbers show correctly
- [ ] Record button works
- [ ] Recording permission requested
- [ ] Current verse highlights during recording
- [ ] Stop recording works
- [ ] Preview screen shows
- [ ] Re-record button works
- [ ] Upload button works (to implement backend)

### Profile Screen
- [ ] User info displays
- [ ] (Other features - to implement)

---

## 🔧 BACKEND API TESTS (When implemented)

### Upload Endpoint
- [ ] Accepts audio file
- [ ] Validates file type (audio only)
- [ ] Validates file size (< 50MB)
- [ ] Saves to Supabase Storage
- [ ] Creates recitation record
- [ ] Returns success response

### List Recitations
- [ ] Returns all public recitations
- [ ] Sorted by created_at desc
- [ ] Includes user info
- [ ] Pagination works

### Increment Plays
- [ ] Play count increments
- [ ] No duplicate counts

---

## 🐛 KNOWN ISSUES

### High Priority
- [ ] Audio recording needs real implementation
- [ ] Audio playback needs real implementation
- [ ] Upload to backend needs implementation

### Medium Priority
- [ ] Auto-scroll verses during recording
- [ ] Better error messages
- [ ] Loading states everywhere

### Low Priority
- [ ] Dark mode
- [ ] Internationalization (AR/FR/EN)
- [ ] Offline mode

---

## 📊 PERFORMANCE TESTS

### Landing Page
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No console errors

### Mobile App
- [ ] App launches < 2s
- [ ] Smooth 60fps animations
- [ ] No memory leaks
- [ ] Battery usage acceptable

---

## 🔒 SECURITY TESTS

### Supabase RLS
- [ ] Users can only update own profile
- [ ] Users can only upload own recitations
- [ ] Anyone can view public recitations
- [ ] Service role key not exposed

### API
- [ ] Rate limiting works
- [ ] Input validation works
- [ ] SQL injection prevented
- [ ] XSS prevented

---

## ✅ TEST SCENARIOS

### Happy Path
1. User visits landing page
2. Enters email and submits
3. Sees success message with user number
4. Downloads mobile app
5. Signs up with same email
6. Browses feed
7. Clicks on recitation → plays audio
8. Goes to Upload
9. Selects Al-Fatiha
10. Records recitation
11. Uploads successfully
12. Sees own recitation in feed

### Error Paths
1. Invalid email → shows error
2. Duplicate email → shows "already registered"
3. Network error → shows retry option
4. Recording permission denied → shows instructions
5. Upload fails → shows error + retry

---

**Run these tests before beta launch!**
