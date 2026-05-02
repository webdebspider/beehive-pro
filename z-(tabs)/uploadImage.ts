import { supabase } from './supabase';

export async function uploadImageAsync(uri: string) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const fileName = `inspection_${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('hive-images') // 👈 make sure this bucket exists
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('hive-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}