import { getSupabaseAdmin } from '../../utils/supabase.js';

/**
 * Stores the generated E2B XML in Supabase Storage.
 * @param reportId The ID or reference of the report.
 * @param xml The XML content string.
 * @returns The public URL of the stored file.
 */
export async function storeE2BR3(reportId: string, xml: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const bucketName = 'reports-xml';
  const filePath = `e2b-r3/${reportId}.xml`;

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, xml, {
      contentType: 'text/xml',
      upsert: true,
    });

  if (error) {
    console.error('Supabase Storage Error:', error);
    throw new Error(`Failed to upload E2B XML: ${error.message}`);
  }

  // RETURN the path instead of public URL for private buckets.
  // The admin panel will generate a signed URL when needed.
  return filePath;
}

/**
 * Generates a temporary signed URL for an admin to download a private XML file.
 */
export async function getSignedE2BUrl(filePath: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from('reports-xml')
    .createSignedUrl(filePath, 3600); // URL valid for 1 hour

  if (error) throw error;
  return data.signedUrl;
}
