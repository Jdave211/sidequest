import { decode } from 'base-64';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageUploadOptions {
  bucketName?: string;
  folder?: string;
  contentType?: string;
  maxSizeBytes?: number;
}

/**
 * Uploads a single image from local URI to Supabase Storage
 * @param imageUri - Local file URI from ImagePicker
 * @param userId - User ID for folder organization
 * @param options - Upload configuration options
 * @returns Promise with upload result
 */
export async function uploadImageToSupabase(
  imageUri: string,
  userId: string,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> {
  try {
    const {
      bucketName = 'sidequest-images',
      folder = userId,
      contentType = 'image/jpeg',
      maxSizeBytes = 10 * 1024 * 1024 // 10MB default
    } = options;

    console.log('[ImageUpload] Starting upload for:', imageUri);

    // Check file size first
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      return { success: false, error: 'File does not exist' };
    }

    if (fileInfo.size && fileInfo.size > maxSizeBytes) {
      return { 
        success: false, 
        error: `File too large. Max size: ${Math.round(maxSizeBytes / 1024 / 1024)}MB` 
      };
    }

    // Read file as base64
    const base64String = await FileSystem.readAsStringAsync(imageUri, { 
      encoding: FileSystem.EncodingType.Base64 
    });
    
    if (!base64String) {
      return { success: false, error: 'Failed to read file' };
    }

    console.log('[ImageUpload] Base64 length:', base64String.length);

    // Convert base64 to Uint8Array
    const binaryString = decode(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2);
    const fileExtension = contentType.includes('png') ? 'png' : 'jpg';
    const fileName = `${timestamp}-${randomId}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    console.log('[ImageUpload] Uploading to path:', filePath);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, bytes, { 
        contentType,
        upsert: false 
      });

    if (error) {
      console.error('[ImageUpload] Supabase error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    const publicUrl = publicUrlData.publicUrl;
    console.log('[ImageUpload] Upload successful:', publicUrl);

    return { success: true, url: publicUrl };

  } catch (error) {
    console.error('[ImageUpload] Upload failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Uploads multiple images from local URIs to Supabase Storage
 * @param imageUris - Array of local file URIs from ImagePicker
 * @param userId - User ID for folder organization
 * @param options - Upload configuration options
 * @returns Promise with array of upload results
 */
export async function uploadMultipleImagesToSupabase(
  imageUris: string[],
  userId: string,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult[]> {
  console.log('[ImageUpload] Uploading multiple images:', imageUris.length);
  
  const results = await Promise.allSettled(
    imageUris.map(uri => uploadImageToSupabase(uri, userId, options))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`[ImageUpload] Image ${index} failed:`, result.reason);
      return { 
        success: false, 
        error: result.reason instanceof Error ? result.reason.message : 'Upload failed' 
      };
    }
  });
}

/**
 * Gets successful URLs from upload results
 * @param results - Array of upload results
 * @returns Array of successful URLs
 */
export function getSuccessfulImageUrls(results: ImageUploadResult[]): string[] {
  return results
    .filter(result => result.success && result.url)
    .map(result => result.url!);
}

/**
 * Gets error messages from failed uploads
 * @param results - Array of upload results
 * @returns Array of error messages
 */
export function getUploadErrors(results: ImageUploadResult[]): string[] {
  return results
    .filter(result => !result.success && result.error)
    .map(result => result.error!);
}
