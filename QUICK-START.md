# Tilawa - Quick Start Guide

**Date** : 30 novembre 2025  
**Objectif** : Lancer l'app complète avec Recording Studio + Auphonic

---

## ✅ Checklist de démarrage

### 1. Backend - Configuration (2 min)

**Fichier** : `backend/.env`

✅ **Déjà configuré** :
- Supabase URL + Keys
- PostHog API Key
- Sentry DSN
- **Auphonic API Key** ✅

**Rien à faire** : Tout est prêt !

---

### 2. Database - Ajouter colonnes Auphonic (1 min)

**Étapes** :
1. Aller sur https://supabase.com/dashboard/project/totcmnzkqxzqefgqjmcf/sql/new
2. Copier le contenu de `backend/ADD-AUPHONIC-COLUMNS.sql`
3. Cliquer "Run"
4. Vérifier qu'il n'y a pas d'erreur

**Colonnes ajoutées** :
- `audio_url_original`
- `audio_url_enhanced`
- `auphonic_production_id`
- `enhancement`

---

### 3. Auphonic - Configurer webhook (2 min)

**Étapes** :
1. Aller sur https://auphonic.com/accounts/settings
2. Section "Webhooks"
3. Ajouter webhook URL : `https://your-backend-url.com/api/auphonic/webhook`
   - ⚠️ Remplacer par ton URL backend réelle
   - Si local : utiliser ngrok ou similaire
4. Sauvegarder

---

### 4. Backend - Démarrer (30 sec)

```bash
cd backend
npm install  # Si pas déjà fait
npm start
```

**Vérifier** :
- ✅ Server listening at http://0.0.0.0:3000
- ✅ PostHog initialized
- ✅ Sentry initialized
- ✅ Pas d'erreur

---

### 5. Mobile - Démarrer (30 sec)

```bash
cd mobile
npm install  # Si pas déjà fait
npx expo start
```

**Scanner QR code** avec Expo Go (iOS/Android)

---

## 🧪 Test complet (5 min)

### Flow à tester

1. **Sign-in** dans l'app
2. **Studio tab** → Sélectionner une sourate (ex: Al-Fatiha)
3. **Recording** → Enregistrer 10 secondes
4. **Enhancement** → Choisir "Studio"
5. **Upload** → Attendre confirmation
6. **Feed** → Vérifier que la récitation apparaît (status: processing)
7. **Attendre 2-5 minutes** (traitement Auphonic)
8. **Refresh feed** → Status devrait passer à "ready"

### Vérifications

**Dans Supabase** :
- Table `recitations` → nouveau record
- Colonnes remplies :
  - `audio_url_original` : URL fichier brut
  - `auphonic_production_id` : UUID production
  - `enhancement` : 'studio'
  - `status` : 'processing' puis 'ready'

**Dans PostHog** :
- Event `audio_uploaded`
- Event `auphonic_processing_completed` (après 2-5 min)

**Dans Auphonic Dashboard** :
- Production visible avec status "Done"

---

## 🐛 Troubleshooting

### Backend ne démarre pas
```bash
# Vérifier les variables d'environnement
cat backend/.env

# Vérifier les dépendances
cd backend && npm install
```

### Upload échoue
- Vérifier que le bucket `recitations` existe dans Supabase Storage
- Vérifier que la service role key est correcte
- Vérifier les logs backend

### Auphonic ne traite pas
- Vérifier que `AUPHONIC_API_KEY` est configuré
- Vérifier les logs backend pour erreurs Auphonic
- Vérifier le webhook URL dans Auphonic Dashboard

### Mobile ne se connecte pas au backend
- Vérifier `EXPO_PUBLIC_API_URL` dans `mobile/.env`
- Si local : utiliser l'IP locale (pas localhost)
- Exemple : `http://192.168.1.10:3000`

---

## 📊 Monitoring

### PostHog Events à surveiller
- `audio_uploaded` : Upload réussi
- `audio_upload_failed` : Upload échoué
- `auphonic_processing_completed` : Traitement terminé
- `auphonic_processing_failed` : Traitement échoué

### Sentry
- Erreurs backend capturées automatiquement
- Erreurs mobile capturées automatiquement

---

## 🚀 Prochaines étapes

### Après le premier test réussi

1. **Tester les 4 presets** :
   - Clean
   - Studio
   - Mosque Light
   - Mosque Deep

2. **Comparer qualité audio** :
   - Écouter fichier brut vs traité
   - Vérifier noise reduction
   - Vérifier reverb (mosque presets)

3. **Stress test** :
   - Uploader plusieurs fichiers
   - Vérifier que tous sont traités
   - Vérifier les temps de traitement

4. **Beta privée** :
   - Inviter 5-10 testeurs
   - Récolter feedback
   - Itérer

---

## 📝 Commandes utiles

### Backend
```bash
# Démarrer
npm start

# Logs en temps réel
npm start | grep -E "(Auphonic|PostHog|error)"

# Tester une route
curl http://localhost:3000/health
```

### Mobile
```bash
# Démarrer
npx expo start

# Clear cache
npx expo start -c

# Build iOS
npx expo run:ios

# Build Android
npx expo run:android
```

### Database
```bash
# Voir les récitations récentes
SELECT id, surah_name, status, enhancement, auphonic_production_id, created_at 
FROM recitations 
ORDER BY created_at DESC 
LIMIT 10;

# Voir les récitations en processing
SELECT * FROM recitations WHERE status = 'processing';

# Voir les récitations avec Auphonic
SELECT * FROM recitations WHERE auphonic_production_id IS NOT NULL;
```

---

## ✅ Checklist finale

Avant de lancer en production :

- [ ] Backend démarré et accessible
- [ ] Database colonnes Auphonic ajoutées
- [ ] Auphonic webhook configuré
- [ ] Mobile build et testé sur device
- [ ] Test complet réussi (Recording → Enhancement → Upload → Processing → Ready)
- [ ] PostHog events visibles
- [ ] Sentry configuré
- [ ] Les 4 presets testés
- [ ] Qualité audio validée

---

**Une fois tout coché** : ✅ **L'app est prête pour la beta privée !**

---

**Support** : Si problème, vérifier les logs backend et PostHog events.
