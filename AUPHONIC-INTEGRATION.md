# Auphonic Integration - Complete Implementation

**Date** : 30 novembre 2025  
**Objectif** : Traitement audio professionnel avec Auphonic

---

## ✅ Implémentation complète

### 1. Backend - Route Upload (`backend/src/routes/upload.js`)

**Flow** :
1. Mobile upload fichier audio brut
2. Backend sauvegarde dans Supabase Storage
3. Backend envoie à Auphonic avec preset selon `enhancement`
4. Auphonic traite l'audio
5. Webhook Auphonic notifie la fin
6. Backend met à jour la DB avec URL du fichier traité

**Presets Auphonic** :

#### Clean
```javascript
{
  denoise: true,        // Noise reduction
  hipfilter: true,      // Remove low-frequency rumble
}
```

#### Studio
```javascript
{
  denoise: true,        // Noise reduction
  leveler: true,        // Loudness normalization
  normloudness: true,   // EBU R128 standard
  hipfilter: true,      // Remove rumble
  gate: true,           // Noise gate
  compressor: true,     // Dynamic range compression
}
```

#### Mosque Light
```javascript
{
  ...studio,
  reverb: {
    enabled: true,
    room_size: 0.3,     // Small room
    damping: 0.5,
    wet_level: 0.15,    // Subtle (15%)
  }
}
```

#### Mosque Deep
```javascript
{
  ...studio,
  reverb: {
    enabled: true,
    room_size: 0.8,     // Large hall/mosque
    damping: 0.3,
    wet_level: 0.35,    // Pronounced (35%)
  }
}
```

---

### 2. Webhook Auphonic (`backend/src/routes/auphonic.js`)

**Événements gérés** :
- `status === 'Done'` → Audio traité disponible
- `status === 'Error'` → Traitement échoué

**Actions** :
1. Extraire `download_url` du fichier traité
2. Envoyer event Inngest `auphonic/completed`
3. Tracker dans PostHog :
   - `auphonic_processing_completed`
   - `auphonic_processing_failed`

---

### 3. Mobile - Upload Service (`mobile/lib/upload.ts`)

**Paramètres envoyés** :
```typescript
FormData {
  file: {
    uri: string,
    name: string,
    type: 'audio/m4a'
  },
  enhancement: 'clean' | 'studio' | 'mosque_light' | 'mosque_deep'
}
```

**Réponse backend** :
```typescript
{
  success: true,
  file: {
    path: string,
    url: string,      // URL fichier brut
    size: number
  },
  auphonicProductionId: string  // UUID production Auphonic
}
```

---

### 4. Database Schema

**Colonne ajoutée** :
```sql
ALTER TABLE recitations 
ADD COLUMN enhancement text 
CHECK (enhancement IN ('clean', 'studio', 'mosque_light', 'mosque_deep'));
```

**Colonnes à ajouter pour tracking Auphonic** :
```sql
ALTER TABLE recitations 
ADD COLUMN auphonic_production_id text,
ADD COLUMN audio_url_original text,  -- URL fichier brut
ADD COLUMN audio_url_enhanced text;  -- URL fichier traité (updated by webhook)
```

---

## 🔄 Flow complet

### Upload initial
```
Mobile → Backend /api/upload
  ↓
Backend sauvegarde dans Storage (fichier brut)
  ↓
Backend crée production Auphonic
  ↓
Backend démarre production
  ↓
Backend retourne success + auphonicProductionId
  ↓
Mobile affiche "Processing..." (optionnel)
```

### Traitement Auphonic
```
Auphonic traite l'audio (2-5 minutes)
  ↓
Auphonic envoie webhook → Backend /api/auphonic/webhook
  ↓
Backend reçoit download_url du fichier traité
  ↓
Backend envoie event Inngest auphonic/completed
  ↓
Inngest worker télécharge fichier traité
  ↓
Inngest worker upload dans Supabase Storage
  ↓
Inngest worker update recitations.audio_url_enhanced
  ↓
Mobile feed affiche fichier traité
```

---

## 🎯 Configuration requise

### 1. Variables d'environnement backend

```env
# Auphonic
AUPHONIC_API_KEY=your_auphonic_api_key_here
AUPHONIC_API_URL=https://auphonic.com/api

# Webhook URL (pour que Auphonic puisse notifier)
WEBHOOK_URL=https://your-backend.com/api/auphonic/webhook
```

### 2. Configuration Auphonic Dashboard

1. Aller sur https://auphonic.com
2. Créer un compte
3. Générer une API key
4. Configurer le webhook URL dans les settings

---

## 📊 Events PostHog trackés

**Backend** :
- `audio_uploaded` (avec `enhancement` property)
- `auphonic_processing_completed`
- `auphonic_processing_failed`
- `auphonic_production_created`
- `auphonic_start_failed`

**Mobile** :
- `audio_upload_started`
- `audio_upload_completed`
- `audio_upload_failed`

---

## 🧪 Tests à faire

### 1. Test sans Auphonic (fallback)
```bash
# Ne pas configurer AUPHONIC_API_KEY
# Upload doit fonctionner avec fichier brut uniquement
```

### 2. Test avec Auphonic
```bash
# Configurer AUPHONIC_API_KEY
# Upload → vérifier production créée
# Attendre webhook (2-5 min)
# Vérifier fichier traité dans DB
```

### 3. Test chaque preset
- Clean → vérifier noise reduction only
- Studio → vérifier compression + clarity
- Mosque Light → vérifier subtle reverb
- Mosque Deep → vérifier pronounced reverb

---

## 🐛 Gestion d'erreurs

### Si Auphonic échoue
- Backend log l'erreur
- Upload continue avec fichier brut
- User voit sa récitation immédiatement
- Pas de blocage

### Si webhook ne revient pas
- Fichier brut reste disponible
- Possibilité de retry manuel (admin)
- Event PostHog pour monitoring

---

## 🚀 Optimisations futures

### Phase 2
1. **Polling status** : Mobile peut poll `/api/auphonic/production/:uuid` pour voir progression
2. **Notification push** : Quand traitement terminé
3. **A/B comparison** : Permettre d'écouter brut vs traité
4. **Batch processing** : Traiter plusieurs fichiers en parallèle

### Phase 3
1. **Custom presets** : User peut créer ses propres presets
2. **Advanced controls** : Sliders pour reverb, compression, etc.
3. **Real-time preview** : Preview enhancement avant upload (local processing)

---

## 📝 Documentation Auphonic API

**Endpoints utilisés** :
- `POST /productions.json` - Créer production
- `POST /production/:uuid/start.json` - Démarrer
- `GET /production/:uuid.json` - Status
- Webhook callback - Notification fin traitement

**Docs** : https://auphonic.com/api/

---

## ✅ Status

**Implémenté** :
- ✅ Presets pour 4 types d'enhancement
- ✅ Création + démarrage production automatique
- ✅ Webhook handler
- ✅ PostHog tracking
- ✅ Fallback si Auphonic indisponible
- ✅ Mobile envoie enhancement type

**À faire** :
- [ ] Configurer AUPHONIC_API_KEY en production
- [ ] Configurer webhook URL
- [ ] Créer Inngest worker pour `auphonic/completed`
- [ ] Ajouter colonnes DB (auphonic_production_id, audio_url_enhanced)
- [ ] Tester end-to-end avec vraie clé API

---

**Prochaine étape** : Créer l'Inngest worker pour gérer le webhook
