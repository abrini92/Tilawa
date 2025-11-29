#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration mobile...\n');

// Check if .env exists
try {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const required = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_API_URL'
  ];
  
  const optional = [
    'EXPO_PUBLIC_POSTHOG_API_KEY',
    'SENTRY_DSN'
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
  
  console.log('\n⚙️  Variables optionnelles:');
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
    console.log('\n❌ Configuration incomplète. Éditez le fichier .env');
    console.log('   EXPO_PUBLIC_API_URL devrait être: http://localhost:3000\n');
    process.exit(1);
  } else {
    console.log('\n✅ Configuration OK!\n');
  }
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('❌ Fichier .env non trouvé!');
    console.log('   Copiez .env.example vers .env:\n');
    console.log('   cp .env.example .env\n');
    process.exit(1);
  } else {
    throw error;
  }
}
