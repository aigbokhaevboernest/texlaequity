import { supabase } from "@/integrations/supabase/client";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const DOC_TYPES = [...IMAGE_TYPES, "application/pdf"];

export function validateFile(file: File, opts?: { maxBytes?: number; types?: string[] }): string | null {
  const max = opts?.maxBytes ?? MAX_UPLOAD_BYTES;
  const types = opts?.types ?? IMAGE_TYPES;
  if (file.size > max) return `File too large. Max ${(max / 1024 / 1024).toFixed(0)} MB.`;
  if (types.length && !types.includes(file.type)) {
    return `Unsupported format. Allowed: ${types.map((t) => t.split("/")[1]).join(", ")}.`;
  }
  return null;
}

export function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
}

export async function uploadToBucket(
  bucket: string,
  folder: string,
  file: File,
): Promise<{ path: string; publicUrl: string | null; error: string | null }> {
  const path = `${folder}/${Date.now()}-${sanitizeName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) return { path: "", publicUrl: null, error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl, error: null };
}

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}