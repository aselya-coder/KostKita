import { supabase } from '@/lib/supabase';

export type BucketName = 'kos-images' | 'item-images' | 'avatars';

/**
 * Uploads a file to a Supabase storage bucket and returns its public URL.
 * 
 * @param bucket - The name of the bucket ('kos-images', 'item-images', 'avatars')
 * @param path - The path inside the bucket (e.g., 'user_id/filename.jpg')
 * @param file - The file object to upload
 * @returns An object containing the public URL or an error
 */
export const uploadFile = async (
  bucket: BucketName,
  path: string,
  file: File
): Promise<{ url: string | null; error: any }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Supabase Storage Error:', error);
      return { url: null, error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (error: any) {
    console.error('Upload catch error:', error.message);
    return { url: null, error };
  }
};

/**
 * Uploads multiple files and returns an array of public URLs.
 */
export const uploadMultipleFiles = async (
  bucket: BucketName,
  userId: string,
  files: File[]
): Promise<{ urls: string[]; errors: any[] }> => {
  const urls: string[] = [];
  const errors: any[] = [];

  for (const file of files) {
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const path = `${userId}/${fileName}`;
    
    const { url, error } = await uploadFile(bucket, path, file);
    
    if (url) {
      urls.push(url);
    } else {
      errors.push(error);
    }
  }

  return { urls, errors };
};
