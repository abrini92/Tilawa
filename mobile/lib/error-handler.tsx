/**
 * Error Handler with Retry Logic
 * Exponential backoff + User-friendly messages
 */

import { Alert } from 'react-native';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number) => void;
}

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(2, attempt),
          maxDelay
        );
        
        onRetry?.(attempt + 1);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  throw lastError;
}

/**
 * Handle errors with user-friendly messages
 */
export function handleError(error: any, context?: string) {
  console.error(`Error in ${context}:`, error);

  // Show user-friendly message
  const message = getUserFriendlyMessage(error);
  Alert.alert(
    'Oops!',
    message,
    [{ text: 'OK', style: 'cancel' }]
  );
}

/**
 * Convert technical errors to user-friendly messages
 */
function getUserFriendlyMessage(error: any): string {
  if (!error) return 'Something went wrong. Please try again.';

  const message = error.message?.toLowerCase() || '';

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your internet connection.';
  }

  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Session expired. Please sign in again.';
  }

  if (message.includes('forbidden') || message.includes('403')) {
    return 'You don\'t have permission to do this.';
  }

  if (message.includes('not found') || message.includes('404')) {
    return 'Content not found.';
  }

  if (message.includes('server') || message.includes('500')) {
    return 'Server error. We\'re working on it!';
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
