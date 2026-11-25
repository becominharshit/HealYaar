import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateResizedDimensions,
  validateVisionFileBeforeUpload,
  MAX_PDF_RAW_BYTES,
  MAX_IMAGE_LONGEST_EDGE_PX,
  isImageFile,
  isPdfFile
} from './visionUploadHelpers';

test('calculateResizedDimensions preserves aspect ratio when longest edge exceeds 1600px', () => {
  const landscape = calculateResizedDimensions(3200, 1600, MAX_IMAGE_LONGEST_EDGE_PX);
  assert.deepEqual(landscape, { width: 1600, height: 800 });

  const portrait = calculateResizedDimensions(1200, 2400, MAX_IMAGE_LONGEST_EDGE_PX);
  assert.deepEqual(portrait, { width: 800, height: 1600 });

  const small = calculateResizedDimensions(1024, 768, MAX_IMAGE_LONGEST_EDGE_PX);
  assert.deepEqual(small, { width: 1024, height: 768 });
});

test('validateVisionFileBeforeUpload blocks non-image PDFs exceeding 3 MB raw', () => {
  const oversizedPdf = validateVisionFileBeforeUpload({
    name: 'full_lab_panel.pdf',
    type: 'application/pdf',
    size: MAX_PDF_RAW_BYTES + 1
  });
  assert.equal(oversizedPdf.valid, false);
  if (!oversizedPdf.valid) {
    assert.match(oversizedPdf.error, /3 MB/i);
  }

  const oversizedPdfByExtension = validateVisionFileBeforeUpload({
    name: 'scan.PDF',
    type: '',
    size: 4 * 1024 * 1024
  });
  assert.equal(oversizedPdfByExtension.valid, false);
});

test('validateVisionFileBeforeUpload allows PDFs <= 3 MB and large images (compressed via canvas)', () => {
  const validPdf = validateVisionFileBeforeUpload({
    name: 'cbc_report.pdf',
    type: 'application/pdf',
    size: MAX_PDF_RAW_BYTES
  });
  assert.deepEqual(validPdf, { valid: true });

  const largeImage = validateVisionFileBeforeUpload({
    name: 'rx_photo.jpg',
    type: 'image/jpeg',
    size: 8 * 1024 * 1024
  });
  assert.deepEqual(largeImage, { valid: true });
  assert.equal(isImageFile({ name: 'rx_photo.jpg', type: 'image/jpeg' }), true);
  assert.equal(isPdfFile({ name: 'rx_photo.jpg', type: 'image/jpeg' }), false);
});
