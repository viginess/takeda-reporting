import { getSupabaseAdmin } from "../utils/services/supabase.js";

const ARCHIVE_BUCKET = "archived-reports";

/**
 * Ensures the archive bucket exists.
 */
async function ensureBucketExists(supabase: any) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
      console.error("[Storage] Failed to list buckets:", listError);
      return;
  }

  const exists = buckets?.find((b: any) => b.name === ARCHIVE_BUCKET);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(ARCHIVE_BUCKET, {
      public: false,
      allowedMimeTypes: ["application/json"],
    });
    if (createError) {
      console.error("[Storage] Failed to create bucket:", createError);
    } else {
      console.log("[Storage] Created missing bucket:", ARCHIVE_BUCKET);
    }
  }
}

export async function uploadReportToArchive(referenceId: string, reportData: any): Promise<string> {
  const supabase = getSupabaseAdmin();
  const filePath = `${referenceId}.json`;
  const fileContent = JSON.stringify(reportData);

  // Ensure bucket exists first
  await ensureBucketExists(supabase);

  const { error } = await supabase.storage
    .from(ARCHIVE_BUCKET)
    .upload(filePath, fileContent, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    console.error("[Storage] Upload failed:", error);
    throw error;
  }

  return filePath;
}

export async function getReportFromArchive(filePath: string): Promise<any> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(ARCHIVE_BUCKET)
    .download(filePath);

  if (error) {
    console.error("[Storage] Download failed:", error);
    throw error;
  }
  
  const text = await data.text();
  return JSON.parse(text);
}
