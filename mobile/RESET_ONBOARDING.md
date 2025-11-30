# RESET ONBOARDING POUR TESTS

## Méthode 1 : Via Simulator
1. Ouvre le menu dev (Cmd + D)
2. Settings
3. Clear AsyncStorage
4. Reload (R)

## Méthode 2 : Via Code (Temporaire)

Ajoute ce bouton dans sign-in.tsx pour tester :

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dans le composant
const resetOnboarding = async () => {
  await AsyncStorage.removeItem('@tilawa_onboarding_complete');
  alert('Onboarding reset! Reload app.');
};

// Dans le render
<TouchableOpacity onPress={resetOnboarding}>
  <Text>Reset Onboarding (DEV)</Text>
</TouchableOpacity>
```

## Méthode 3 : Via Terminal

```bash
# iOS Simulator
xcrun simctl get_app_container booted com.yourcompany.tilawa data
# Puis supprimer le dossier Documents/RCTAsyncLocalStorage*

# Android
adb shell run-as com.yourcompany.tilawa rm -rf /data/data/com.yourcompany.tilawa/databases
```

## C'EST NORMAL !

L'onboarding ne doit être vu qu'UNE SEULE FOIS par user.
Une fois complété, il ne revient jamais (sauf si tu désinstalles l'app).

C'est le comportement attendu ! ✅
