/**
 * Get time-based gradient colors based on Islamic prayer times
 * Creates a spiritual, contextual background that changes throughout the day
 */
export function getTimeBasedGradient(): [string, string] {
  const hour = new Date().getHours();
  
  // Fajr (dawn) - 5am-7am
  // Soft orange/pink representing the break of dawn
  if (hour >= 5 && hour < 7) {
    return ['#FFF5E6', '#FFE4CC'];
  }
  
  // Dhuhr (noon) - 12pm-3pm
  // Bright, warm yellow representing midday sun
  if (hour >= 12 && hour < 15) {
    return ['#FFFBF0', '#FFF8E1'];
  }
  
  // Asr (afternoon) - 3pm-6pm
  // Golden tones representing late afternoon
  if (hour >= 15 && hour < 18) {
    return ['#FFF3E0', '#FFE0B2'];
  }
  
  // Maghrib (sunset) - 6pm-8pm
  // Purple/pink representing sunset
  if (hour >= 18 && hour < 20) {
    return ['#F3E5F5', '#E1BEE7'];
  }
  
  // Isha (night) - 8pm-5am
  // Deep blue representing night
  return ['#E8EAF6', '#C5CAE9'];
}

/**
 * Convert Western numerals to Arabic-Indic numerals
 * Used for displaying Surah numbers in Arabic script
 */
export function convertToArabicNumerals(num: number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map(digit => arabicNumerals[parseInt(digit)])
    .join('');
}
