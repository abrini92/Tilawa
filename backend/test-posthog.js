// Test PostHog - Envoie un event simple pour vérifier la connexion
import { PostHog } from 'posthog-node';
import 'dotenv/config';

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://app.posthog.com';

if (!POSTHOG_API_KEY) {
  console.error('❌ POSTHOG_API_KEY manquant dans .env');
  process.exit(1);
}

console.log('🚀 Test PostHog');
console.log('📊 API Key:', POSTHOG_API_KEY.substring(0, 10) + '...');
console.log('🌐 Host:', POSTHOG_HOST);
console.log('');

const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST
});

// Envoyer un event de test
console.log('📤 Envoi d\'un event de test...');

posthog.capture({
  distinctId: 'test-user-' + Date.now(),
  event: 'test-event',
  properties: {
    message: 'Test depuis le backend Tilawa',
    timestamp: new Date().toISOString(),
    environment: 'development'
  }
});

// Flush pour envoyer immédiatement
console.log('⏳ Envoi en cours...');
await posthog.flush();

// Attendre que l'event soit envoyé
await posthog.shutdown();

console.log('✅ Event envoyé avec succès !');
console.log('');
console.log('👉 Va sur PostHog Dashboard > Events');
console.log('   Tu devrais voir l\'event "backend_test_event"');
console.log('   https://app.posthog.com');
