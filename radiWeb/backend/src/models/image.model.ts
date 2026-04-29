export type ImageFormat = 'DICOM' | 'PNG' | 'JPG';

export interface Image {
  id: number;
  study_id: number;
  original_filename: string;
  blob_url: string;
  preview_url: string | null;
  format: ImageFormat;
  resolution: string | null;
  file_size_kb: number;
  quality_approved: boolean;
  uploaded_at: Date;
  uploaded_by: number;
}

export interface CreateImageDto {
  study_id: number;
  original_filename: string;
  blob_url: string;
  preview_url?: string;
  format: ImageFormat;
  resolution?: string;
  file_size_kb: number;
}
