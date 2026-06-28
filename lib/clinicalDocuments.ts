import { supabase } from "@/lib/supabase";
import { logReferralActivity, REFERRAL_ACTIVITY_ACTIONS } from "@/lib/referralActivityLog";
import type { ReferralDocument, ReferralDocumentType } from "@/types/referralDocument";

export const CLINICAL_PACKETS_BUCKET = "clinical-packets";

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function buildClinicalPacketPath(referralId: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${referralId}/${Date.now()}-${safeName}`;
}

export function sortDocumentsNewestFirst(documents: ReferralDocument[]): ReferralDocument[] {
  return [...documents].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
}

export function groupDocumentsByReferralId(
  documents: ReferralDocument[],
): Map<string, ReferralDocument[]> {
  const grouped = new Map<string, ReferralDocument[]>();

  for (const document of sortDocumentsNewestFirst(documents)) {
    const existing = grouped.get(document.referralId);

    if (existing) {
      existing.push(document);
      continue;
    }

    grouped.set(document.referralId, [document]);
  }

  return grouped;
}

export async function getClinicalPacketSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(CLINICAL_PACKETS_BUCKET)
    .createSignedUrl(path, 3600);

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.signedUrl) {
    throw new Error("Unable to create a download link for the document.");
  }

  return data.signedUrl;
}

export async function downloadClinicalPacket(path: string, filename: string): Promise<void> {
  const { data, error } = await supabase.storage.from(CLINICAL_PACKETS_BUCKET).download(path);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Document file not found.");
  }

  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

export async function uploadReferralDocument(
  referralId: string,
  file: File,
  documentType: ReferralDocumentType | string,
  uploadedBy: string,
): Promise<ReferralDocument> {
  const filePath = buildClinicalPacketPath(referralId, file.name);
  const uploadedAt = new Date().toISOString();

  const { error: uploadError } = await supabase.storage
    .from(CLINICAL_PACKETS_BUCKET)
    .upload(filePath, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data, error: insertError } = await supabase
    .from("referral_documents")
    .insert({
      referralId,
      fileName: file.name,
      filePath,
      documentType,
      uploadedAt,
      uploadedBy,
    })
    .select("id, referralId, fileName, filePath, documentType, uploadedAt, uploadedBy")
    .single();

  if (insertError) {
    await supabase.storage.from(CLINICAL_PACKETS_BUCKET).remove([filePath]);
    throw new Error(insertError.message);
  }

  if (!data) {
    throw new Error("Failed to save referral document metadata.");
  }

  await logReferralActivity(
    referralId,
    REFERRAL_ACTIVITY_ACTIONS.DOCUMENT_UPLOADED,
    `${documentType}: ${file.name}`,
    uploadedBy,
  );

  return data as ReferralDocument;
}
