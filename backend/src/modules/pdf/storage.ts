import { getSupabaseAdmin } from '../../utils/services/supabase.js';

/**
 * Stores the generated Safety PDF in Supabase Storage.
 * @param reportId The ID or reference of the report.
 * @param pdfBuffer The PDF data buffer.
 * @returns The file path of the stored PDF.
 */
export async function storeSafetyPDF(reportId: string, pdfBuffer: Buffer): Promise<string> {
  const supabase = getSupabaseAdmin();
  const bucketName = 'reports-xml'; // Using the same bucket to avoid creating new ones, but in a separate folder
  const filePath = `pdfs/${reportId}.pdf`;

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.error('Supabase Storage Error (PDF):', error);
    throw new Error(`Failed to upload Safety PDF: ${error.message}`);
  }

  return filePath;
}

/**
 * Generates a temporary signed URL for an admin to download a private PDF file.
 */
export async function getSignedPDFUrl(filePath: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from('reports-xml')
    .createSignedUrl(filePath, 3600); // URL valid for 1 hour

  if (error) throw error;
  return data.signedUrl;
}

