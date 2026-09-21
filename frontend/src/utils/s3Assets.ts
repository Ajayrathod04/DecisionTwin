/**
 * DecisionTwin S3 Asset Resolution Layer
 * 
 * Provides a production-grade URL resolver for static assets (images, models, icons).
 * Uses VITE_S3_ASSET_BASE_URL when configured, with clean fallback to local public asset paths.
 */

const S3_BASE_URL = import.meta.env.VITE_S3_ASSET_BASE_URL || '';

/**
 * Resolves an asset path to its full URL (either S3 bucket URL or local public asset path).
 * @param path relative path to asset (e.g. '/assets/logo.svg' or 'hero_bg.png')
 * @returns Fully qualified asset URL or clean local fallback
 */
export function getAssetUrl(path: string): string {
  if (!path) return '';
  
  // If path is already absolute HTTP/HTTPS URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Sanitize leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  if (S3_BASE_URL) {
    const cleanBase = S3_BASE_URL.endsWith('/') ? S3_BASE_URL.slice(0, -1) : S3_BASE_URL;
    return `${cleanBase}/${cleanPath}`;
  }

  return `/${cleanPath}`;
}

export const S3_CONFIG = {
  bucketName: 'decisiontwin-assets-ap-south-1',
  region: 'ap-south-1',
  s3BaseUrl: S3_BASE_URL || 'https://decisiontwin-assets-ap-south-1.s3.ap-south-1.amazonaws.com',
  isS3Configured: Boolean(S3_BASE_URL),
};
