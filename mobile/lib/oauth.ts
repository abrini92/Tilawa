import { supabase } from './supabase';
import { Alert, Linking } from 'react-native';

/**
 * Sign in with Google using Supabase OAuth
 * Opens the system browser for authentication
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;

    if (data?.url) {
      // Open the OAuth URL in the system browser
      const supported = await Linking.canOpenURL(data.url);
      
      if (supported) {
        await Linking.openURL(data.url);
        return { 
          success: true, 
          message: 'Please complete sign in in your browser, then return to the app' 
        };
      } else {
        throw new Error('Cannot open authentication URL');
      }
    }

    return { success: false, error: 'No authentication URL provided' };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign in with Apple using Supabase OAuth
 * Opens the system browser for authentication
 */
export async function signInWithApple() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
    });

    if (error) throw error;

    if (data?.url) {
      // Open the OAuth URL in the system browser
      const supported = await Linking.canOpenURL(data.url);
      
      if (supported) {
        await Linking.openURL(data.url);
        return { 
          success: true, 
          message: 'Please complete sign in in your browser, then return to the app' 
        };
      } else {
        throw new Error('Cannot open authentication URL');
      }
    }

    return { success: false, error: 'No authentication URL provided' };
  } catch (error: any) {
    console.error('Apple Sign In Error:', error);
    return { success: false, error: error.message };
  }
}
