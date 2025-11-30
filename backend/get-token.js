// Script pour obtenir un token JWT Supabase
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables Supabase manquantes dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔐 Génération d\'un token de test...');
console.log('');

// Option 1: Se connecter avec email/password
const email = 'abrini.crf@outlook.fr';
const password = process.argv[2]; // Mot de passe en argument

if (!password) {
  console.log('❌ Usage: node get-token.js <password>');
  console.log('');
  console.log('Exemple: node get-token.js monMotDePasse123');
  console.log('');
  console.log('Si tu ne connais pas le mot de passe, réinitialise-le dans Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/totcmnzkqxzqefgqjmcf/auth/users');
  process.exit(1);
}

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (error) {
  console.error('❌ Erreur de connexion:', error.message);
  console.log('');
  console.log('💡 Solutions:');
  console.log('1. Vérifie que le mot de passe est correct');
  console.log('2. Ou réinitialise le mot de passe dans Supabase Dashboard');
  process.exit(1);
}

if (data.session) {
  console.log('✅ Connexion réussie !');
  console.log('');
  console.log('📋 Access Token (JWT):');
  console.log('');
  console.log(data.session.access_token);
  console.log('');
  console.log('💡 Copie ce token pour les tests d\'upload');
  console.log('');
  console.log('Expire le:', new Date(data.session.expires_at * 1000).toLocaleString());
} else {
  console.error('❌ Pas de session créée');
}
