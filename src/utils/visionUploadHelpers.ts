export const MAX_PDF_RAW_BYTES = 3 * 1024 * 1024; // 3 MB raw PDF cap
export const MAX_IMAGE_BASE64_CHARS = 3_800_000; // Strictly under 3.8 MB base64 for Vercel 4.5 MB body limit
export const MAX_PDF_BASE64_CHARS = 4_200_000; // Matches /api/ai 4.2 MB encoded payload check
export const MAX_IMAGE_LONGEST_EDGE_PX = 1600;
export const DEFAULT_JPEG_QUALITY = 0.8;

export class VisionUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VisionUploadValidationError';
  }
}

export interface FileLikeMetadata {
  name: string;
  type: string;
  size: number;
}

export function isImageFile(file: Pick<FileLikeMetadata, 'name' | 'type'>): boolean {
  if (file.type.toLowerCase().startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
}

export function isPdfFile(file: Pick<FileLikeMetadata, 'name' | 'type'>): boolean {
  if (isImageFile(file)) return false;
  return file.type.toLowerCase() === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export function validateVisionFileBeforeUpload(
  file: FileLikeMetadata
): { valid: true } | { valid: false; error: string } {
  if (isPdfFile(file) && file.size > MAX_PDF_RAW_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `PDF file "${file.name}" is ${sizeMb} MB, which exceeds the 3 MB limit for PDF uploads. Please compress the PDF or upload a photo of the document instead.`
    };
  }
  return { valid: true };
}

export function calculateResizedDimensions(
  width: number,
  height: number,
  maxEdge = MAX_IMAGE_LONGEST_EDGE_PX
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: 1, height: 1 };
  }
  if (width <= maxEdge && height <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  if (width >= height) {
    const scale = maxEdge / width;
    return {
      width: maxEdge,
      height: Math.max(1, Math.round(height * scale))
    };
  }
  const scale = maxEdge / height;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: maxEdge
  };
}

function stripDataUrlPrefix(dataUrl: string): string {
  const commaIdx = dataUrl.indexOf(',');
  return commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new VisionUploadValidationError('Unable to decode image file. Please try another JPG, PNG, or WEBP photo.'));
    };
    img.src = objectUrl;
  });
}

function renderCanvasToJpegBase64(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  quality: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new VisionUploadValidationError('Browser canvas is unavailable for image compression.');
  }

  // Fill white background so transparent PNGs compress cleanly to JPEG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return stripDataUrlPrefix(dataUrl);
}

/**
 * Resize and compress any image via HTML Canvas (max 1600px longest edge, JPEG quality 0.8)
 * so the resulting base64 payload remains strictly under 3.8 MB.
 */
export async function compressImageToJpegBase64(
  file: File,
  maxEdge = MAX_IMAGE_LONGEST_EDGE_PX,
  initialQuality = DEFAULT_JPEG_QUALITY
): Promise<{ base64Data: string; mimeType: 'image/jpeg' }> {
  const img = await loadImageElement(file);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  let { width, height } = calculateResizedDimensions(srcWidth, srcHeight, maxEdge);
  const qualities = [initialQuality, 0.7, 0.6, 0.5];

  for (const quality of qualities) {
    const base64Data = renderCanvasToJpegBase64(img, width, height, quality);
    if (base64Data.length < MAX_IMAGE_BASE64_CHARS) {
      return { base64Data, mimeType: 'image/jpeg' };
    }
  }

  // Secondary dimension step-down if image entropy is still unusually high
  for (const scaleFactor of [0.75, 0.5]) {
    width = Math.max(1, Math.round(width * scaleFactor));
    height = Math.max(1, Math.round(height * scaleFactor));
    const base64Data = renderCanvasToJpegBase64(img, width, height, 0.7);
    if (base64Data.length < MAX_IMAGE_BASE64_CHARS) {
      return { base64Data, mimeType: 'image/jpeg' };
    }
  }

  throw new VisionUploadValidationError(
    'Image remains larger than the 3.8 MB upload limit even after compression. Please crop or choose a smaller image.'
  );
}

export async function prepareVisionPayload(
  file: File,
  readRawBase64: (f: File) => Promise<string>
): Promise<{ base64Data: string; mimeType: string }> {
  const validation = validateVisionFileBeforeUpload(file);
  if (!validation.valid) {
    throw new VisionUploadValidationError(validation.error);
  }

  if (isImageFile(file)) {
    return compressImageToJpegBase64(file);
  }

  const base64Data = await readRawBase64(file);
  if (base64Data.length > MAX_PDF_BASE64_CHARS) {
    throw new VisionUploadValidationError(
      'Uploaded document exceeds the 3 MB size limit. Please upload a smaller file.'
    );
  }

  return {
    base64Data,
    mimeType: file.type || 'application/pdf'
  };
}
