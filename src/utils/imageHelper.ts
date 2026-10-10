/**
 * Utility functions for validating and processing images for quiz questions and options
 */

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
];

export const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates image size (< 10MB) and format (common image types)
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  if (!file) {
    return { valid: false, error: 'Không tìm thấy tệp ảnh.' };
  }

  // 1. Kiểm tra định dạng ảnh phổ biến
  const fileType = file.type ? file.type.toLowerCase() : '';
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  const hasValidMime = ALLOWED_IMAGE_TYPES.includes(fileType);

  if (!hasValidMime && !hasValidExtension) {
    return {
      valid: false,
      error: 'Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp ảnh phổ biến (PNG, JPG, JPEG, WEBP, GIF, SVG, BMP).',
    };
  }

  // 2. Kiểm tra dung lượng ảnh (nhỏ hơn 10MB)
  if (file.size >= MAX_IMAGE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Dung lượng ảnh (${sizeInMB} MB) vượt quá giới hạn cho phép (nhỏ hơn 10MB). Vui lòng chọn ảnh dung lượng dưới 10MB!`,
    };
  }

  return { valid: true };
};

/**
 * Formats file size in readable unit
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Reads and optionally optimizes the image to base64 Data URL.
 * Preserves crisp visual detail while preventing browser memory bloat and storage quota issues.
 */
export const readAndProcessImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lỗi khi đọc tệp ảnh từ máy tính.'));

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;

      // Keep SVG and GIF as-is to preserve vector scaling and animations
      const isSvgOrGif = file.type === 'image/svg+xml' || file.type === 'image/gif' || 
                         file.name.toLowerCase().endsWith('.svg') || file.name.toLowerCase().endsWith('.gif');
      if (isSvgOrGif) {
        resolve(rawDataUrl);
        return;
      }

      // If file is already small (< 400KB), return directly
      if (file.size < 400 * 1024) {
        resolve(rawDataUrl);
        return;
      }

      // Optimize raster images if large (resize to max 1600px width/height and quality 0.88)
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl); // fallback to raw
      img.onload = () => {
        try {
          const maxDim = 1600;
          let { width, height } = img;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          // Draw with high quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Use webp if supported, or jpeg/png
          const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
          const outputType = isPng ? 'image/png' : 'image/jpeg';
          const optimized = canvas.toDataURL(outputType, 0.88);
          resolve(optimized);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
};
