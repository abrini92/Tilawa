#!/bin/bash

# 🚀 Script de déploiement rapide Tilawa
# Usage: ./deploy.sh

echo "🚀 Déploiement Tilawa Landing Page"
echo "=================================="

# Vérifier si on est dans le bon dossier
if [ ! -d "web" ]; then
    echo "❌ Erreur: Exécute ce script depuis le dossier Tilawa"
    exit 1
fi

# Vérifier si Git est initialisé
if [ ! -d ".git" ]; then
    echo "📦 Initialisation Git..."
    git init
    git add .
    git commit -m "Initial commit - Tilawa MVP"
    echo "✅ Git initialisé"
else
    echo "✅ Git déjà initialisé"
fi

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "📥 Installation Vercel CLI..."
    npm install -g vercel
fi

# Se connecter à Vercel
echo ""
echo "🔐 Connexion à Vercel..."
echo "Si tu n'es pas connecté, une fenêtre de navigateur va s'ouvrir."
vercel login

# Déployer
echo ""
echo "🚀 Déploiement en cours..."
cd web
vercel --prod

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Configure ton domaine dans Vercel Dashboard"
echo "2. Ajoute les DNS records chez ton registrar"
echo "3. Attends la propagation DNS (5-30 min)"
echo "4. Teste ton site !"
echo ""
echo "🎉 Félicitations ! Ta landing page est live !"
