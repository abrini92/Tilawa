#!/bin/bash

# Script de test pour l'upload audio
# Usage: ./test-upload.sh <audio-file.mp3> <jwt-token>

set -e

AUDIO_FILE=$1
JWT_TOKEN=$2
API_URL=${API_URL:-http://localhost:3000}

if [ -z "$AUDIO_FILE" ] || [ -z "$JWT_TOKEN" ]; then
  echo "Usage: ./test-upload.sh <audio-file.mp3> <jwt-token>"
  echo ""
  echo "Pour obtenir un JWT token:"
  echo "1. Connecte-toi via l'app mobile ou web"
  echo "2. Récupère le token depuis Supabase Dashboard > Authentication > Users"
  echo "   ou depuis le localStorage/AsyncStorage de l'app"
  exit 1
fi

if [ ! -f "$AUDIO_FILE" ]; then
  echo "❌ Fichier audio introuvable: $AUDIO_FILE"
  exit 1
fi

echo "🚀 Test upload vers $API_URL/api/upload"
echo "📁 Fichier: $AUDIO_FILE"
echo ""

# Test 1: Upload valide
echo "✅ Test 1: Upload valide"
RESPONSE=$(curl -s -X POST "$API_URL/api/upload" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@$AUDIO_FILE")

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
  echo "✅ Upload réussi!"
  FILE_URL=$(echo "$RESPONSE" | jq -r '.file.url')
  echo "📎 URL: $FILE_URL"
else
  echo "❌ Upload échoué"
  exit 1
fi

echo ""
echo "---"
echo ""

# Test 2: Upload sans token (doit échouer avec 401)
echo "❌ Test 2: Upload sans token (doit échouer)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/api/upload" \
  -F "file=@$AUDIO_FILE")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Erreur 401 attendue (Unauthorized)"
else
  echo "❌ Code HTTP inattendu: $HTTP_CODE"
fi

echo ""
echo "---"
echo ""

# Test 3: Vérifier PostHog events
echo "📊 Vérifie maintenant dans PostHog Dashboard:"
echo "   https://app.posthog.com"
echo "   Event: audio_uploaded"
echo "   Properties: filename, size, mimetype, estimatedDuration"

echo ""
echo "📊 Vérifie dans Supabase Storage:"
echo "   https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets/recitations"

echo ""
echo "✅ Tests terminés!"
