# Observability Setup – PostHog & Sentry

Guide de configuration pour activer le monitoring et l'analytics sur Tilawa.

---

## 🎯 PostHog (Product Analytics)

### Backend

**Variables d'environnement** (`backend/.env`) :

```env
POSTHOG_API_KEY=phc_your_project_api_key
POSTHOG_HOST=https://app.posthog.com
```

**Events trackés** :

| Event | Déclenché quand | Properties |
|-------|-----------------|------------|
| `audio_uploaded` | Upload réussi | `filename`, `size`, `mimetype`, `estimatedDuration` |
| `audio_upload_failed` | Upload échoué | `error`, `filename` |
| `auphonic_production_created` | Production Auphonic créée | `productionId`, `title` |
| `auphonic_production_failed` | Création production échouée | `error`, `audioUrl` |
| `auphonic_start_failed` | Démarrage production échoué | `error`, `productionId` |
| `auphonic_status_check_failed` | Vérification statut échouée | `error`, `productionId` |

**Vérification** :

```bash
# Tester que PostHog est bien initialisé
curl http://localhost:3000/health
# Vérifier les logs Fastify pour "PostHog initialized"
```

---

### Mobile

**Installation** (déjà fait) :

```json
"posthog-react-native": "^3.1.0"
```

**Configuration** (`mobile/app/_layout.tsx` ou point d'entrée) :

```typescript
import PostHog from 'posthog-react-native';

// Initialize PostHog
const posthog = await PostHog.initAsync(
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY!,
  {
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  }
);

// Identifier l'utilisateur après login
posthog.identify(userId, {
  email: user.email,
  name: user.full_name
});
```

**Variables d'environnement** (`mobile/.env`) :

```env
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_project_api_key
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Events clés à tracker** :

```typescript
// App lifecycle
posthog.capture('app_opened');
posthog.capture('onboarding_completed');

// Recording
posthog.capture('recording_started', { surahNumber, surahName });
posthog.capture('recording_completed', { duration, surahNumber });
posthog.capture('recording_discarded');

// Playback
posthog.capture('play_started', { recitationId, surahNumber });
posthog.capture('play_completed', { recitationId, duration });
posthog.capture('play_paused', { recitationId, position });

// Social
posthog.capture('recitation_liked', { recitationId });
posthog.capture('reciter_followed', { reciterId });
```

---

## 🚨 Sentry (Error Tracking)

### Backend

**Variables d'environnement** (`backend/.env`) :

```env
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
NODE_ENV=production  # ou development, staging
```

**Configuration** (déjà en place dans `backend/src/index.js`) :

```javascript
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}
```

**Vérification** :

```bash
# Tester une erreur volontaire
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer invalid_token"
# Vérifier dans Sentry Dashboard que l'erreur apparaît
```

---

### Mobile

**Installation** (déjà fait) :

```json
"@sentry/react-native": "^5.15.2"
```

**Configuration** (`mobile/app/_layout.tsx` ou `index.js`) :

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || __DEV__ ? 'development' : 'production',
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 10000,
  tracesSampleRate: 1.0,
});
```

**Variables d'environnement** (`mobile/.env`) :

```env
EXPO_PUBLIC_SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
```

**Wrapper du composant racine** :

```typescript
export default Sentry.wrap(RootLayout);
```

**Capture manuelle d'erreurs** :

```typescript
try {
  await uploadRecitation(file);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'upload' },
    extra: { fileSize: file.size }
  });
  throw error;
}
```

---

## 📊 Dashboards recommandés

### PostHog

1. **User Journey**
   - Funnel : `app_opened` → `recording_started` → `recording_completed` → `audio_uploaded`
   - Drop-off à chaque étape

2. **Audio Performance**
   - Nombre d'uploads par jour
   - Taille moyenne des fichiers
   - Durée moyenne des récitations
   - Taux d'échec upload

3. **Engagement**
   - DAU/MAU
   - Récitations jouées par user
   - Likes par récitation

### Sentry

1. **Error Rate**
   - Erreurs par endpoint
   - Erreurs par user
   - Erreurs critiques (500, crashes)

2. **Performance**
   - Temps de réponse par route
   - Latence upload
   - Latence Auphonic

---

## ✅ Checklist activation

- [ ] Créer projet PostHog (https://app.posthog.com)
- [ ] Créer projet Sentry (https://sentry.io)
- [ ] Ajouter les DSN/API keys dans `.env` (backend + mobile)
- [ ] Tester un upload avec succès → vérifier event `audio_uploaded` dans PostHog
- [ ] Tester un upload avec échec → vérifier event `audio_upload_failed` + erreur Sentry
- [ ] Initialiser PostHog mobile avec `identify` après login
- [ ] Wrapper le composant racine mobile avec `Sentry.wrap()`
- [ ] Créer les dashboards de base dans PostHog
- [ ] Configurer les alertes Sentry (erreurs critiques, spike d'erreurs)

---

**Dernière mise à jour** : 30 novembre 2025
