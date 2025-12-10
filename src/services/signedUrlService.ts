/**
 * Signed URL Service
 * Batch generation of signed URLs for screenshots
 * ✅ Fase 1: Performance - 50 requests → 1 request
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface SignedUrlResult {
  path: string;
  signedUrl: string | null;
  error?: string;
}

/**
 * Generates multiple signed URLs in a single batch call
 * @param paths - Array of file paths in the screenshots bucket
 * @param expiresIn - Expiration time in seconds (default 24 hours)
 * @returns Map of original path to signed URL
 */
export async function getBatchSignedUrls(
  paths: string[],
  expiresIn: number = 86400
): Promise<Record<string, string>> {
  if (!paths || paths.length === 0) {
    return {};
  }

  logger.time('[SignedURL] Batch generation');
  
  try {
    // Filter valid paths and remove duplicates
    const validPaths = [...new Set(paths.filter(Boolean))];
    
    if (validPaths.length === 0) {
      return {};
    }

    // Use Supabase's createSignedUrls (batch API)
    const { data, error } = await supabase.storage
      .from('screenshots')
      .createSignedUrls(validPaths, expiresIn);

    logger.timeEnd('[SignedURL] Batch generation');

    if (error) {
      logger.error('[SignedURL] Batch error:', error);
      return {};
    }

    // Map paths to signed URLs
    const urlMap: Record<string, string> = {};
    data?.forEach((item) => {
      if (item.signedUrl && item.path) {
        urlMap[item.path] = item.signedUrl;
      }
    });

    logger.info(`[SignedURL] Generated ${Object.keys(urlMap).length}/${validPaths.length} URLs`);
    return urlMap;
  } catch (error) {
    logger.error('[SignedURL] Batch exception:', error);
    return {};
  }
}

/**
 * Extracts file path from a screenshot URL
 * @param screenshotUrl - Full screenshot URL or path
 * @returns Extracted path or null
 */
export function extractPathFromUrl(screenshotUrl: string | null): string | null {
  if (!screenshotUrl) return null;
  
  // If it's already a path (no protocol), return as-is
  if (!screenshotUrl.includes('://')) {
    return screenshotUrl;
  }
  
  // Extract path after /screenshots/
  const match = screenshotUrl.split('/screenshots/')[1];
  return match || null;
}

/**
 * Prepares paths from an array of screenshot URLs
 * Returns both the paths array and a map to original URLs
 */
export function prepareBatchPaths(
  screenshotUrls: (string | null)[]
): { paths: string[]; urlToPathMap: Record<string, string> } {
  const paths: string[] = [];
  const urlToPathMap: Record<string, string> = {};

  screenshotUrls.forEach((url) => {
    if (url) {
      const path = extractPathFromUrl(url);
      if (path) {
        paths.push(path);
        urlToPathMap[url] = path;
      }
    }
  });

  return { paths, urlToPathMap };
}
