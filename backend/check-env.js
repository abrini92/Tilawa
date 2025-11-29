#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Vérification de la configuration...\n');

// Check if .env exists
try {
  const envPath = join(__dirname, '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const optional = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'AUPHONIC_API_KEY',
    'INNGEST_EVENT_KEY',
    'SENTRY_DSN',
    'POSTHOG_API_KEY'
  ];
  
  let hasErrors = false;
  
  console.log('✅ Variables requises:');
  for (const key of required) {
    const regex = new RegExp(`${key}=(.+)`);
    const match = envContent.match(regex);
    if (match && match[1] && !match[1].startsWith('your_')) {
      console.log(`  ✓ ${key}`);
    } else {
      console.log(`  ✗ ${key} - MANQUANT ou non configuré`);
      hasErrors = true;
    }
  }
  
  console.log('\n⚙️  Variables optionnelles (pour production):');
  for (const key of optional) {
    const regex = new RegExp(`${key}=(.+)`);
    const match = envContent.match(regex);
    if (match && match[1] && !match[1].startsWith('your_')) {
      console.log(`  ✓ ${key}`);
    } else {
      console.log(`  - ${key} - Non configuré (optionnel)`);
    }
  }
  
  if (hasErrors) {
    console.log('\n❌ Configuration incomplète. Éditez le fichier .env avec vos credentials Supabase.');
    console.log('   Voir: https://supabase.com → Settings → API\n');
    process.exit(1);
  } else {
    console.log('\n✅ Configuration minimale OK! Vous pouvez démarrer le serveur.\n');
  }
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('❌ Fichier .env non trouvé!');
    console.log('   Copiez .env.example vers .env et configurez vos credentials:\n');
    console.log('   cp .env.example .env\n');
    process.exit(1);
  } else {
    throw error;
  }
}
