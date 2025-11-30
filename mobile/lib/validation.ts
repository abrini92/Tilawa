/**
 * Input Validation Service
 * Validates user inputs before sending to backend
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Validate password
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }

  return { isValid: true };
}

/**
 * Validate name
 */
export function validateName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { isValid: false, error: 'Name is too long (max 50 characters)' };
  }

  return { isValid: true };
}

/**
 * Validate comment
 */
export function validateComment(comment: string): ValidationResult {
  if (!comment || comment.trim().length === 0) {
    return { isValid: false, error: 'Comment cannot be empty' };
  }

  if (comment.length > 500) {
    return { isValid: false, error: 'Comment is too long (max 500 characters)' };
  }

  return { isValid: true };
}

/**
 * Validate audio file
 */
export function validateAudioFile(fileUri: string, duration?: number): ValidationResult {
  if (!fileUri) {
    return { isValid: false, error: 'No audio file selected' };
  }

  // Check file extension
  const validExtensions = ['.m4a', '.mp3', '.wav', '.aac'];
  const hasValidExtension = validExtensions.some(ext => fileUri.toLowerCase().endsWith(ext));
  
  if (!hasValidExtension) {
    return { isValid: false, error: 'Invalid audio format. Please use M4A, MP3, WAV, or AAC' };
  }

  // Check duration (max 30 minutes)
  if (duration && duration > 1800) {
    return { isValid: false, error: 'Audio is too long (max 30 minutes)' };
  }

  return { isValid: true };
}

/**
 * Validate surah selection
 */
export function validateSurahSelection(surahNumber: number, verseFrom: number, verseTo: number): ValidationResult {
  if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
    return { isValid: false, error: 'Please select a valid Surah' };
  }

  if (!verseFrom || verseFrom < 1) {
    return { isValid: false, error: 'Invalid starting verse' };
  }

  if (!verseTo || verseTo < verseFrom) {
    return { isValid: false, error: 'Ending verse must be greater than or equal to starting verse' };
  }

  return { isValid: true };
}

/**
 * Sanitize text input
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Validate bio
 */
export function validateBio(bio: string): ValidationResult {
  if (bio.length > 200) {
    return { isValid: false, error: 'Bio is too long (max 200 characters)' };
  }

  return { isValid: true };
}
