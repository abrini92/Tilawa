/**
 * Quran Audio Service
 * Fetches audio URLs from Al-Quran Cloud API
 */

export interface QuranReciter {
  id: string;
  name: string;
  arabicName: string;
  style: string;
}

export const AVAILABLE_RECITERS: QuranReciter[] = [
  {
    id: 'ar.alafasy',
    name: 'Mishary Rashid Al-Afasy',
    arabicName: 'مشاري بن راشد العفاسي',
    style: 'Murattal',
  },
  {
    id: 'ar.abdulbasitmurattal',
    name: 'Abdul Basit Abdul Samad',
    arabicName: 'عبد الباسط عبد الصمد',
    style: 'Murattal',
  },
  {
    id: 'ar.abdurrahmaansudais',
    name: 'Abdur-Rahman As-Sudais',
    arabicName: 'عبد الرحمن السديس',
    style: 'Murattal',
  },
  {
    id: 'ar.shaatree',
    name: 'Abu Bakr Ash-Shaatree',
    arabicName: 'أبو بكر الشاطري',
    style: 'Murattal',
  },
  {
    id: 'ar.husary',
    name: 'Mahmoud Khalil Al-Husary',
    arabicName: 'محمود خليل الحصري',
    style: 'Murattal',
  },
];

interface SurahAudio {
  surahNumber: number;
  surahName: string;
  arabicName: string;
  verses: VerseAudio[];
}

interface VerseAudio {
  number: number;
  text: string;
  audio: string;
}

/**
 * Get audio for a complete Surah
 */
export async function getSurahAudio(
  surahNumber: number,
  reciterId: string = 'ar.alafasy'
): Promise<SurahAudio | null> {
  try {
    const response = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahNumber}/${reciterId}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error('Failed to fetch surah audio');
    }

    return {
      surahNumber: data.data.number,
      surahName: data.data.englishName,
      arabicName: data.data.name,
      verses: data.data.ayahs.map((ayah: any) => ({
        number: ayah.numberInSurah,
        text: ayah.text,
        audio: ayah.audio,
      })),
    };
  } catch (error) {
    console.error('Error fetching surah audio:', error);
    return null;
  }
}

/**
 * Get audio URL for a specific verse
 */
export function getVerseAudioUrl(
  surahNumber: number,
  verseNumber: number,
  reciter: string = 'Alafasy_128kbps'
): string {
  const surahPadded = surahNumber.toString().padStart(3, '0');
  const versePadded = verseNumber.toString().padStart(3, '0');
  
  return `https://everyayah.com/data/${reciter}/${surahPadded}${versePadded}.mp3`;
}

/**
 * Get audio URL for a range of verses (concatenated)
 * Note: This returns individual verse URLs - you'll need to play them sequentially
 */
export function getVerseRangeAudioUrls(
  surahNumber: number,
  fromVerse: number,
  toVerse: number,
  reciter: string = 'Alafasy_128kbps'
): string[] {
  const urls: string[] = [];
  
  for (let verse = fromVerse; verse <= toVerse; verse++) {
    urls.push(getVerseAudioUrl(surahNumber, verse, reciter));
  }
  
  return urls;
}

/**
 * Get complete Surah audio URL (single file)
 * Using Al-Quran Cloud's edition endpoint
 */
export async function getCompleteSurahAudioUrl(
  surahNumber: number,
  reciterId: string = 'ar.alafasy'
): Promise<string | null> {
  try {
    const surahAudio = await getSurahAudio(surahNumber, reciterId);
    
    if (!surahAudio || surahAudio.verses.length === 0) {
      return null;
    }

    // Return the first verse audio URL as a sample
    // In production, you'd want to concatenate all verses or use a complete surah file
    return surahAudio.verses[0].audio;
  } catch (error) {
    console.error('Error getting complete surah audio:', error);
    return null;
  }
}

/**
 * Search for reciters
 */
export function searchReciters(query: string): QuranReciter[] {
  const lowerQuery = query.toLowerCase();
  return AVAILABLE_RECITERS.filter(
    (reciter) =>
      reciter.name.toLowerCase().includes(lowerQuery) ||
      reciter.arabicName.includes(query)
  );
}

/**
 * Get reciter by ID
 */
export function getReciterById(id: string): QuranReciter | undefined {
  return AVAILABLE_RECITERS.find((reciter) => reciter.id === id);
}
