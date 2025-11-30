# Guide de test – Upload & Observability

## Prérequis

1. **Backend lancé** :
   ```bash
   cd backend
   npm install
   npm start
   # Doit tourner sur http://localhost:3000
   ```

2. **Supabase configuré** :
   - Bucket `recitations` créé
   - SQL schema exécuté
   - Service role key dans `.env`

3. **PostHog & Sentry configurés** :
   - API keys dans `.env`
   - Projets créés

---

## Test 1 : Upload valide

### Obtenir un JWT token

**Option A : Via Supabase Dashboard**
1. Va sur https://supabase.com/dashboard
2. Ton projet → Authentication → Users
3. Crée un user test ou utilise un existant
4. Copie le **Access Token** (JWT)

**Option B : Via l'app mobile**
1. Lance l'app mobile
2. Inscris-toi / connecte-toi
3. Le token est stocké dans AsyncStorage
4. Ou récupère-le via les DevTools React Native

### Lancer le test

```bash
cd backend

# Avec un vrai fichier audio
./test-upload.sh /path/to/audio.mp3 "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Ou créer un fichier audio de test (1 seconde de silence)
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 -q:a 9 -acodec libmp3lame test-audio.mp3
./test-upload.sh test-audio.mp3 "YOUR_JWT_TOKEN"
```

### Vérifications

1. **Console backend** :
   - Logs Fastify : `POST /api/upload 200`
   - Pas d'erreur

2. **PostHog Dashboard** :
   - Event `audio_uploaded` visible
   - Properties : `filename`, `size`, `mimetype`, `estimatedDuration`

3. **Supabase Storage** :
   - Fichier visible dans bucket `recitations`
   - Path : `{user_id}/{timestamp}-{filename}`

---

## Test 2 : Upload invalide (MIME type)

```bash
# Créer un fichier texte
echo "test" > test.txt

# Tenter l'upload (doit échouer avec 400)
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.txt"

# Réponse attendue:
# {
#   "error": "Invalid file type. Only audio files are allowed.",
#   "allowedTypes": ["audio/mpeg", "audio/mp3", ...]
# }
```

**Vérifications** :
- Event PostHog `audio_upload_failed`
- Pas de fichier dans Supabase Storage

---

## Test 3 : Upload trop gros

```bash
# Créer un fichier > 50MB
dd if=/dev/zero of=large-file.mp3 bs=1M count=60

# Tenter l'upload (doit échouer avec 413)
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@large-file.mp3"

# Réponse attendue:
# {
#   "error": "File too large",
#   "maxSize": 52428800,
#   "receivedSize": 62914560
# }
```

---

## Test 4 : Auphonic production

**Prérequis** : `AUPHONIC_API_KEY` configuré dans `.env`

```bash
# 1. Upload un fichier audio d'abord
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-audio.mp3")

AUDIO_URL=$(echo $UPLOAD_RESPONSE | jq -r '.file.url')

# 2. Créer une production Auphonic
curl -X POST http://localhost:3000/api/auphonic/production \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"audioUrl\": \"$AUDIO_URL\", \"title\": \"Test Recitation\"}"

# Réponse attendue:
# {
#   "success": true,
#   "production": {
#     "uuid": "abc123...",
#     "status": "waiting",
#     ...
#   }
# }
```

**Vérifications** :
- Event PostHog `auphonic_production_created`
- Production visible dans Auphonic Dashboard

---

## Test 5 : Sentry error tracking

```bash
# Provoquer une erreur volontaire (token invalide)
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer invalid_token_here" \
  -F "file=@test-audio.mp3"

# Réponse: 401 Unauthorized
```

**Vérifications** :
- Erreur capturée dans Sentry Dashboard
- Type : `Unauthorized`
- Endpoint : `/api/upload`

---

## Checklist finale

- [ ] Upload valide fonctionne
- [ ] Event PostHog `audio_uploaded` visible
- [ ] Fichier dans Supabase Storage
- [ ] Upload MIME invalide → erreur 400
- [ ] Upload trop gros → erreur 413
- [ ] Event PostHog `audio_upload_failed` pour les échecs
- [ ] Auphonic production créée (si API key configurée)
- [ ] Sentry capture les erreurs

---

**Si tous les tests passent** : ✅ Semaine 1 terminée !

**Prochaine étape** : Beta privée avec utilisateurs réels.
