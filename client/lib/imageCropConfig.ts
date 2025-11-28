/**
 * Image Crop Configuration
 * Define image dimensions for different upload types
 */

export const IMAGE_CROP_CONFIG = {
  product: {
    width: parseInt(import.meta.env.VITE_PRODUCT_IMAGE_WIDTH || "800"),
    height: parseInt(import.meta.env.VITE_PRODUCT_IMAGE_HEIGHT || "800"),
    get aspectRatio() {
      return this.width / this.height;
    },
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  category: {
    width: parseInt(import.meta.env.VITE_CATEGORY_IMAGE_WIDTH || "600"),
    height: parseInt(import.meta.env.VITE_CATEGORY_IMAGE_HEIGHT || "400"),
    get aspectRatio() {
      return this.width / this.height;
    },
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  avatar: {
    width: 200,
    height: 200,
    get aspectRatio() {
      return 1; // Square
    },
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
} as const;

export type ImageCropType = keyof typeof IMAGE_CROP_CONFIG;

/**
 * Get crop configuration for a specific image type
 */
export function getImageCropConfig(type: ImageCropType) {
  return IMAGE_CROP_CONFIG[type];
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  type: ImageCropType
): { valid: boolean; error?: string } {
  const config = getImageCropConfig(type);

  // Check file type
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Please select a valid image file" };
  }

  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `Image size must be less than ${formatFileSize(config.maxFileSize)}`,
    };
  }

  return { valid: true };
}
