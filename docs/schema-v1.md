# Tilawa Database Schema v1 (FROZEN)

**Date de gel** : 30 novembre 2025  
**Statut** : Production-ready pour MVP

---

## 🎯 Objectif

Ce document décrit le modèle de données **v1** de Tilawa, gelé pour la phase MVP.  
Toute modification majeure nécessitera une migration planifiée.

---

## 📊 Tables principales

### 1. `waitlist`

Collecte des emails pour la landing page.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PK, auto-généré |
| `email` | text | Email unique |
| `user_number` | serial | Numéro d'inscription (auto-incrémenté) |
| `created_at` | timestamptz | Date d'inscription |

**RLS** : Ouvert en lecture/écriture (anyone can join).

---

### 2. `profiles`

Extension de `auth.users` pour les données publiques du profil.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PK, FK vers `auth.users` |
| `email` | text | Email (unique) |
| `full_name` | text | Nom complet |
| `avatar_url` | text | URL de l'avatar |
| `bio` | text | Biographie |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Dernière mise à jour |

**RLS** :
- Lecture : publique.
- Écriture : uniquement le propriétaire (`auth.uid() = id`).

---

### 3. `recitations`

Enregistrements audio de récitations du Qur'an.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PK, auto-généré |
| `user_id` | uuid | FK vers `auth.users` |
| `surah_number` | int | Numéro de sourate (1-114) |
| `surah_name` | text | Nom de la sourate |
| `verse_from` | int | Verset de début |
| `verse_to` | int | Verset de fin |
| `audio_url` | text | URL du fichier audio (Supabase Storage) |
| `duration` | int | Durée en secondes |
| `plays` | int | Nombre de lectures (default: 0) |
| `status` | text | `processing`, `ready`, `failed` |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Dernière mise à jour |

**RLS** :
- Lecture : publique (seulement `status = 'ready'`).
- Insertion : utilisateur authentifié (son propre `user_id`).
- Mise à jour : propriétaire uniquement.

**Indexes** :
- `recitations_user_id_idx` sur `user_id`
- `recitations_surah_number_idx` sur `surah_number`
- `recitations_created_at_idx` sur `created_at DESC`

---

## 🗄️ Storage Buckets

### Bucket : `recitations`

**Configuration** :
- **Public** : Oui
- **Taille max** : 50 MB
- **MIME types autorisés** : `audio/mpeg`, `audio/wav`, `audio/x-wav`, `audio/webm`, `audio/mp4`, `audio/aac`

**Policies** :
- **SELECT** : Anyone can view.
- **INSERT** : Authenticated users only.
- **UPDATE/DELETE** : Owner only (via `auth.uid()` match sur le dossier).

**Structure des fichiers** :
```
recitations/
  {user_id}/
    {timestamp}-{filename}.mp3
```

---

## ⚙️ Fonctions SQL

### `get_waitlist_count()`

Retourne le nombre total d'inscrits à la waitlist.

```sql
select count(*) from waitlist;
```

### `increment_plays(recitation_id uuid)`

Incrémente le compteur de lectures d'une récitation.

```sql
update recitations set plays = plays + 1 where id = recitation_id;
```

---

## 🔄 Triggers

### `update_updated_at_column()`

Trigger automatique sur `profiles` et `recitations` pour mettre à jour `updated_at` à chaque modification.

---

## 🚧 Évolutions prévues (post-MVP)

- **`likes`** : table pour les likes sur les récitations.
- **`follows`** : table pour le social graph (follow/followers).
- **`mosques`** : table pour les mosquées (affiliation des récitateurs).
- **`comments`** : commentaires sur les récitations.
- **`playlists`** : playlists personnalisées.

---

## 📝 Notes importantes

- **Pas de modification de ce schéma avant la fin du MVP** (sauf bugs critiques).
- Toute nouvelle colonne doit être **nullable** ou avoir une **valeur par défaut** pour éviter les migrations complexes.
- Les migrations futures seront versionnées dans `backend/migrations/`.

---

**Dernière mise à jour** : 30 novembre 2025
