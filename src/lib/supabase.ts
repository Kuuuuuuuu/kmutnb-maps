import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// `null` when env vars are missing so the app still runs (floor images just
// stay as placeholders) instead of crashing on a bad client.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

if (!supabase && import.meta.env.DEV) {
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — " +
      "floor images and room search are disabled. Add them to .env.",
  );
}

// Storage bucket that holds photos attached to issue reports. Public-read (like
// `floor-images`) so the stored URL renders directly; uploads are gated by RLS
// to the signed-in user's own `{uid}/` folder.
export const REPORT_PHOTO_BUCKET = "report-photos";

// The photo comes out of the report dialog as a base64 data URL (FileReader).
// Convert it back to a Blob so we can upload the real bytes to Storage.
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(header)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

// Keep folder names safe for Storage paths: the building's osm_id / place_id
// can in theory carry odd characters, so restrict to a plain slug.
function slugifyFolder(value: string | null | undefined): string {
  const cleaned = (value ?? "").replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned || "campus";
}

/**
 * Uploads a report photo (base64 data URL) to Storage under `{folder}/...`
 * (folder = the building osm_id / place id the report is about, or `campus`)
 * and returns its public URL, or `null` if there's no client, no data, or the
 * upload fails. Callers should treat a `null` as "submit the report without a
 * photo" rather than aborting the whole report.
 */
export async function uploadReportPhoto(
  folder: string | null | undefined,
  dataUrl: string,
): Promise<string | null> {
  if (!supabase || !dataUrl) {
    return null;
  }
  try {
    const blob = dataUrlToBlob(dataUrl);
    const ext = MIME_EXTENSIONS[blob.type] ?? "jpg";
    const path = `${slugifyFolder(folder)}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(REPORT_PHOTO_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) {
      if (import.meta.env.DEV) {
        console.warn("[supabase] report photo upload failed:", error.message);
      }
      return null;
    }
    return supabase.storage.from(REPORT_PHOTO_BUCKET).getPublicUrl(path).data
      .publicUrl;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[supabase] report photo upload error:", err);
    }
    return null;
  }
}
