# ✅ Actions manuelles restantes (5-10 minutes)

## 1. Créer le bucket Supabase `recitations`

**Étapes** :
1. Va sur https://supabase.com/dashboard
2. Ton projet → **Storage**
3. Clic **New bucket**
4. Configuration :
   - Name : `recitations`
   - Public bucket : **YES** ✅
   - File size limit : `50000000` (50 MB)
   - Allowed MIME types : `audio/mpeg, audio/wav, audio/x-wav, audio/webm, audio/mp4, audio/aac`
5. Clic **Create bucket**

---

## 2. Exécuter le schéma SQL

**Étapes** :
1. Supabase Dashboard → **SQL Editor**
2. Clic **New query**
3. Copie tout le contenu de `backend/supabase-schema.sql`
4. Clic **Run**
5. Vérifie qu'il n'y a pas d'erreurs

**Vérifications** :
- Tables créées : `waitlist`, `profiles`, `recitations`
- Policies RLS actives
- Fonctions créées : `get_waitlist_count`, `increment_plays`

---

## 3. Récupérer la Service Role Key Supabase

**Étapes** :
1. Supabase Dashboard → **Settings** → **API**
2. Copie la **service_role key** (secret, ne pas commit)
3. Colle dans `backend/.env` ligne 9 :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdGNtbnprcXh6cWVmZ3FqbWNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzAwNzU4MiwiZXhwIjoyMDQ4NTgzNTgyfQ.VOTRE_CLE_ICI
   ```

---

## 4. Créer le projet Sentry (optionnel mais recommandé)

**Étapes** :
1. Va sur https://sentry.io
2. Crée un compte (gratuit)
3. **Backend** :
   - New Project → **Node.js**
   - Name : `tilawa-backend`
   - Copie le DSN
   - Colle dans `backend/.env` ligne 20
4. **Mobile** :
   - New Project → **React Native**
   - Name : `tilawa-mobile`
   - Copie le DSN
   - Colle dans `mobile/app.json` ligne 50 (remplace `YOUR_MOBILE_DSN`)

---

## 5. Tester l'upload

**Prérequis** :
- Backend lancé : `cd backend && npm start`
- Bucket `recitations` créé
- Service role key configurée

**Test rapide** :

```bash
cd backend

# 1. Obtenir un JWT token
# Va sur Supabase Dashboard → Authentication → Users
# Crée un user test et copie son Access Token

# 2. Créer un fichier audio de test (1 seconde)
# Si tu as ffmpeg:
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 -q:a 9 -acodec libmp3lame test-audio.mp3

# Sinon, utilise n'importe quel fichier .mp3 que tu as

# 3. Lancer le test
./test-upload.sh test-audio.mp3 "TON_JWT_TOKEN_ICI"
```

**Vérifications** :
- ✅ Réponse `success: true`
- ✅ Fichier visible dans Supabase Storage → bucket `recitations`
- ✅ Event `audio_uploaded` dans PostHog Dashboard (https://app.posthog.com)

---

## 6. Vérifier PostHog

**Étapes** :
1. Va sur https://app.posthog.com
2. Ton projet → **Events**
3. Cherche `audio_uploaded`
4. Vérifie les properties : `filename`, `size`, `mimetype`, `estimatedDuration`

---

## Résumé des fichiers modifiés

✅ **Code** :
- `backend/supabase-schema.sql` : bucket `recitations` + policies
- `backend/src/routes/upload.js` : sécurité (taille, MIME, durée)
- `backend/src/routes/auphonic.js` : tracking PostHog erreurs
- `backend/.env` : PostHog API key ajoutée
- `mobile/app.json` : placeholder Sentry DSN

✅ **Documentation** :
- `docs/schema-v1.md` : schéma DB gelé
- `docs/observability-setup.md` : guide PostHog + Sentry
- `docs/week1-checklist.md` : checklist complète
- `backend/README-TESTS.md` : guide de tests détaillé
- `backend/test-upload.sh` : script de test automatique

---

## Checklist finale

- [ ] Bucket `recitations` créé dans Supabase
- [ ] SQL schema exécuté
- [ ] Service role key dans `backend/.env`
- [ ] (Optionnel) Sentry DSN configuré
- [ ] Test upload réussi
- [ ] Event PostHog visible

**Une fois tout coché** : ✅ **Semaine 1 terminée !**

---

**Questions / Problèmes** :
- Backend ne démarre pas → vérifie les logs, probablement un problème de `.env`
- Upload échoue → vérifie que le bucket existe et que la service role key est correcte
- PostHog ne reçoit rien → vérifie que l'API key est correcte et que le backend est bien démarré
