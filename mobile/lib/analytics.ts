/**
 * Analytics Service - PostHog
 * Track user events and behavior
 */

import PostHog from 'posthog-react-native';

// Initialize PostHog
const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

let posthog: PostHog | null = null;

if (posthogApiKey) {
  posthog = new PostHog(posthogApiKey, { host: posthogHost });
}

/**
 * Track an event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!posthog) {
    console.log('[Analytics]', eventName, properties);
    return;
  }

  posthog.capture(eventName, properties);
}

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!posthog) return;

  posthog.identify(userId, properties);
}

/**
 * Reset user (on logout)
 */
export function resetUser() {
  if (!posthog) return;

  posthog.reset();
}

/**
 * Pre-defined events for Tilawa
 */
export const Events = {
  // App lifecycle
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  
  // Authentication
  SIGN_UP_STARTED: 'sign_up_started',
  SIGN_UP_COMPLETED: 'sign_up_completed',
  SIGN_IN_COMPLETED: 'sign_in_completed',
  SIGN_OUT: 'sign_out',
  
  // Recitations
  RECITATION_PLAYED: 'recitation_played',
  RECITATION_PAUSED: 'recitation_paused',
  RECITATION_COMPLETED: 'recitation_completed',
  RECITATION_LIKED: 'recitation_liked',
  RECITATION_SHARED: 'recitation_shared',
  
  // Recording
  RECORDING_STARTED: 'recording_started',
  RECORDING_STOPPED: 'recording_stopped',
  RECORDING_COMPLETED: 'recording_completed',
  RECORDING_UPLOADED: 'recording_uploaded',
  SURAH_SELECTED: 'surah_selected',
  
  // Social
  USER_FOLLOWED: 'user_followed',
  USER_UNFOLLOWED: 'user_unfollowed',
  COMMENT_POSTED: 'comment_posted',
  
  // Search
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  
  // Engagement
  FEED_SCROLLED: 'feed_scrolled',
  PROFILE_VIEWED: 'profile_viewed',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
} as const;

/**
 * Helper functions for common events
 */
export const Analytics = {
  // App
  appOpened: () => trackEvent(Events.APP_OPENED),
  
  // Auth
  signUp: (method: string) => trackEvent(Events.SIGN_UP_COMPLETED, { method }),
  signIn: (method: string) => trackEvent(Events.SIGN_IN_COMPLETED, { method }),
  signOut: () => trackEvent(Events.SIGN_OUT),
  
  // Recitations
  playRecitation: (recitationId: string, surahNumber: number, reciter: string) => 
    trackEvent(Events.RECITATION_PLAYED, { recitationId, surahNumber, reciter }),
  
  likeRecitation: (recitationId: string) => 
    trackEvent(Events.RECITATION_LIKED, { recitationId }),
  
  // Recording
  startRecording: (surahNumber: number, surahName: string) => 
    trackEvent(Events.RECORDING_STARTED, { surahNumber, surahName }),
  
  completeRecording: (surahNumber: number, duration: number, retakes: number) => 
    trackEvent(Events.RECORDING_COMPLETED, { surahNumber, duration, retakes }),
  
  uploadRecording: (surahNumber: number, fileSize: number) => 
    trackEvent(Events.RECORDING_UPLOADED, { surahNumber, fileSize }),
  
  // Search
  search: (query: string, resultsCount: number) => 
    trackEvent(Events.SEARCH_PERFORMED, { query, resultsCount }),
  
  // Errors
  error: (errorType: string, errorMessage: string, context?: string) => 
    trackEvent(Events.ERROR_OCCURRED, { errorType, errorMessage, context }),
};

export default Analytics;
