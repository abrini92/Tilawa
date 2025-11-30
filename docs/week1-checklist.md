# Semaine 1 : Stabilisation Socle – Checklist

**Objectif** : Avoir un backend production-ready avec observabilité, sécurité et schéma de données gelé.

---

## ✅ Tâches complétées

### 1. Schéma Supabase gelé

- [x] Schéma SQL v1 finalisé (`backend/supabase-schema.sql`)
- [x] Bucket `recitations` standardisé (au lieu de `audio-files`)
- [x] Policies RLS complètes (select, insert, update, delete)
- [x] Documentation schéma v1 (`docs/schema-v1.md`)
- [x] Backend aligné sur bucket `recitations` (`upload.js`)

**Actions à faire manuellement** :
1. Aller dans Supabase Dashboard > Storage
2. Créer le bucket `recitations` avec :
   - Public : YES
   - Max file size : 50MB
   - Allowed MIME types : `audio/mpeg, audio/wav, audio/x-wav, audio/webm, audio/mp4, audio/aac`
3. Exécuter le SQL complet dans SQL Editor

---

### 2. Sécurité upload renforcée

- [x] Validation MIME types (audio uniquement)
- [x] Limite taille : 50 MB
- [x] Limite durée estimée : 15 minutes
- [x] Messages d'erreur clairs (400, 413)
- [x] Tracking des échecs dans PostHog

**Constantes définies** (`upload.js`) :
```javascript
MAX_FILE_SIZE = 50 MB
MAX_DURATION_SECONDS = 15 minutes
ALLOWED_MIME_TYPES = audio/mpeg, audio/wav, etc.
```

---

### 3. Instrumentation PostHog

- [x] Events backend :
  - `audio_uploaded` (avec size, mimetype, estimatedDuration)
  - `audio_upload_failed` (avec error, filename)
  - `auphonic_production_created`
  - `auphonic_production_failed`
  - `auphonic_start_failed`
  - `auphonic_status_check_failed`

- [x] Mobile déjà initialisé (`app/_layout.tsx`)
- [x] Documentation complète (`docs/observability-setup.md`)

**Actions à faire** :
1. Créer projet PostHog : https://app.posthog.com
2. Copier API key dans `.env` (backend + mobile)
3. Tester un upload → vérifier event dans PostHog dashboard

---

### 4. Sentry activé

- [x] Backend : init dans `index.js` (si `SENTRY_DSN` présent)
- [x] Mobile : init dans `_layout.tsx` (via expo-constants)
- [x] Error handler backend capture automatiquement
- [x] Documentation setup (`docs/observability-setup.md`)

**Actions à faire** :
1. Créer projet Sentry : https://sentry.io
2. Copier DSN dans `.env` (backend)
3. Ajouter dans `mobile/app.json` :
   ```json
   "extra": {
     "sentryDsn": "https://your_dsn@sentry.io/project"
   }
   ```
4. Tester une erreur → vérifier dans Sentry dashboard

---

## 🔄 Tâches restantes

### 5. Tests upload + Auphonic + webhook

**À faire** :

#### Tests manuels (minimum viable)
1. **Upload direct** :
   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test-audio.mp3"
   ```
   - ✅ Vérifier réponse `success: true`
   - ✅ Vérifier fichier dans Supabase Storage
   - ✅ Vérifier event PostHog `audio_uploaded`

2. **Upload trop gros** :
   ```bash
   # Fichier > 50MB
   curl -X POST http://localhost:3000/api/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@large-file.mp3"
   ```
   - ✅ Vérifier erreur 413
   - ✅ Vérifier event PostHog `audio_upload_failed`

3. **Auphonic production** :
   ```bash
   curl -X POST http://localhost:3000/api/auphonic/production \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"audioUrl": "https://...", "title": "Test"}'
   ```
   - ✅ Vérifier réponse avec `production.uuid`
   - ✅ Vérifier event PostHog `auphonic_production_created`

4. **Webhook Auphonic** :
   ```bash
   curl -X POST http://localhost:3000/api/auphonic/webhook \
     -H "Content-Type: application/json" \
     -d '{"uuid": "test-uuid", "status": "Done", "output_files": [...]}'
   ```
   - ✅ Vérifier logs Fastify
   - ✅ Vérifier event Inngest envoyé

#### Tests automatisés (optionnel Semaine 1, recommandé Semaine 2)
- Créer `backend/test/upload.test.js` avec :
  - Test upload valide
  - Test upload MIME invalide
  - Test upload trop gros
  - Test upload trop long
- Framework : `vitest` ou `tap` (compatible Fastify)

---

## 📋 Checklist finale avant déploiement

### Backend
- [ ] `.env` configuré avec toutes les clés (Supabase, PostHog, Sentry, Auphonic)
- [ ] Bucket `recitations` créé dans Supabase
- [ ] SQL schema exécuté dans Supabase
- [ ] Tests manuels upload passés
- [ ] Tests manuels Auphonic passés
- [ ] Sentry capture bien les erreurs
- [ ] PostHog reçoit bien les events

### Mobile
- [ ] `.env` configuré (Supabase, PostHog)
- [ ] `app.json` contient `sentryDsn` dans `extra`
- [ ] Test upload depuis mobile → vérifier dans Supabase Storage
- [ ] Test erreur mobile → vérifier dans Sentry

### Documentation
- [x] Schéma v1 documenté
- [x] Observability setup documenté
- [x] `.env.example` à jour (backend + mobile)

---

## 🎯 Critères de succès Semaine 1

1. **Upload audio fonctionne end-to-end** (mobile → backend → Supabase Storage)
2. **Validations de sécurité actives** (taille, MIME, durée)
3. **PostHog reçoit les events clés** (upload success/fail)
4. **Sentry capture les erreurs** (backend + mobile)
5. **Schéma DB gelé et documenté**

---

**Prochaine étape** : Semaine 2 – Beta privée avec 10–50 utilisateurs réels.

---

**Dernière mise à jour** : 30 novembre 2025
