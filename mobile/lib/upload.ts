import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export type EnhancementType = 'clean' | 'studio' | 'mosque_light' | 'mosque_deep';

/**
 * Upload audio file to backend
 */
export async function uploadAudio(
  fileUri: string,
  surahNumber: number,
  surahName: string,
  duration: number,
  enhancement?: EnhancementType
): Promise<UploadResult> {
  try {
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      return { success: false, error: 'File not found' };
    }

    // Create form data
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = fileUri.split('/').pop() || `surah_${surahNumber}.m4a`;
    
    // Append file
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: 'audio/m4a', // expo-av records in m4a on iOS
    } as any);
    
    // Append enhancement type
    if (enhancement) {
      formData.append('enhancement', enhancement);
    }

    // Upload to backend
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || `Upload failed with status ${response.status}` 
      };
    }

    // Create recitation record in database
    const { error: dbError } = await supabase
      .from('recitations')
      .insert({
        user_id: session.user.id,
        surah_number: surahNumber,
        surah_name: surahName,
        verse_from: 1,
        verse_to: 999, // Full surah for now
        audio_url: data.file.url,  // Original URL for now
        audio_url_original: data.file.url,
        auphonic_production_id: data.auphonicProductionId || null,
        duration: duration,
        status: data.auphonicProductionId ? 'processing' : 'ready',  // Processing if Auphonic, ready otherwise
        enhancement: enhancement || 'studio'
      });

    if (dbError) {
      console.error('Failed to create recitation record:', dbError);
      return { 
        success: false, 
        error: 'Upload succeeded but failed to save metadata' 
      };
    }

    return { 
      success: true, 
      url: data.file.url 
    };

  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Upload using signed URL (alternative method)
 */
export async function uploadAudioDirect(
  fileUri: string,
  surahNumber: number,
  surahName: string,
  duration: number
): Promise<UploadResult> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { success: false, error: 'Not authenticated' };
    }

    const filename = `surah_${surahNumber}_${Date.now()}.m4a`;

    // Get signed URL from backend
    const signedUrlResponse = await fetch(`${API_URL}/api/upload/signed-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        contentType: 'audio/m4a'
      }),
    });

    if (!signedUrlResponse.ok) {
      return { success: false, error: 'Failed to get upload URL' };
    }

    const { signedUrl, path } = await signedUrlResponse.json();

    // Read file as base64
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload directly to Supabase Storage
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'audio/m4a',
      },
      body: Uint8Array.from(atob(fileContent), c => c.charCodeAt(0)),
    });

    if (!uploadResponse.ok) {
      return { success: false, error: 'Failed to upload file' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('recitations')
      .getPublicUrl(path);

    // Create recitation record
    const { error: dbError } = await supabase
      .from('recitations')
      .insert({
        user_id: session.user.id,
        surah_number: surahNumber,
        surah_name: surahName,
        verse_from: 1,
        verse_to: 999,
        audio_url: publicUrl,
        duration: duration,
        status: 'ready'
      });

    if (dbError) {
      console.error('Failed to create recitation record:', dbError);
      return { success: false, error: 'Upload succeeded but failed to save metadata' };
    }

    return { success: true, url: publicUrl };

  } catch (error) {
    console.error('Direct upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}
