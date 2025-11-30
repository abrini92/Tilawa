# Installation des dépendances pour le Carrousel Surah

## Packages requis

Exécutez ces commandes dans le dossier `/mobile` :

```bash
# Core dependencies
npm install react-native-reanimated@^3.6.0
npm install react-native-gesture-handler@^2.14.0
npm install react-native-snap-carousel@^4.0.0-beta.6
npm install fuse.js@^7.0.0
npm install expo-blur@~13.0.2
npm install @react-native-async-storage/async-storage@^1.21.0

# Types
npm install --save-dev @types/react-native-snap-carousel
```

## Configuration requise

### 1. babel.config.js

Ajoutez le plugin Reanimated :

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // ← Ajouter en DERNIER
    ],
  };
};
```

### 2. app.json

Ajoutez les permissions :

```json
{
  "expo": {
    "plugins": [
      [
        "expo-blur",
        {
          "ios": {
            "blurIntensity": 80
          }
        }
      ]
    ]
  }
}
```

### 3. Redémarrer Metro

Après installation :

```bash
# Arrêter Metro
# Puis redémarrer
npx expo start -c
```

## Vérification

Si tout est installé correctement, vous ne devriez plus voir d'erreurs TypeScript dans :
- `/lib/surahStore.ts`
- `/animations/heartAnimation.tsx`
- `/components/PageIndicators.tsx`
- `/components/SurahCard.tsx`
- `/components/SearchModal.tsx`
- `/components/FavoritesModal.tsx`
- `/screens/SurahCarouselScreen.tsx`

## Troubleshooting

Si vous voyez encore des erreurs :

1. Supprimez `node_modules` et `package-lock.json`
2. Réinstallez : `npm install`
3. Redémarrez Metro : `npx expo start -c`
4. Rebuild l'app : `npx expo run:ios` ou `npx expo run:android`
