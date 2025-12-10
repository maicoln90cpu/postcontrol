import { useState, useEffect, memo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageOff, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmissionImageDisplayProps {
  screenshotPath?: string | null;
  screenshotUrl?: string | null;
  submissionId?: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onImageClick?: () => void;
  /** Enable prefetch for next images in view */
  enablePrefetch?: boolean;
  /** URLs to prefetch in background */
  prefetchUrls?: string[];
}

/**
 * Component that displays submission screenshots with:
 * - Shimmer loading animation
 * - Error state with icon
 * - Zoom on click capability
 * - Image prefetching for next items
 */
export const SubmissionImageDisplay = memo(({
  screenshotPath,
  screenshotUrl,
  submissionId,
  alt = 'Screenshot',
  className = 'w-full h-full object-cover',
  loading = 'lazy',
  onImageClick,
  enablePrefetch = false,
  prefetchUrls = []
}: SubmissionImageDisplayProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate signed URL
  useEffect(() => {
    const generateUrl = async () => {
      try {
        setLoadingUrl(true);
        setError(false);
        setImageLoaded(false);

        if (screenshotPath) {
          const { data, error: urlError } = await supabase.storage
            .from('screenshots')
            .createSignedUrl(screenshotPath, 3600);

          if (urlError) throw urlError;
          setImageUrl(data.signedUrl);
        } else if (screenshotUrl) {
          setImageUrl(screenshotUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoadingUrl(false);
      }
    };

    generateUrl();
  }, [screenshotPath, screenshotUrl]);

  // Prefetch next images using IntersectionObserver
  useEffect(() => {
    if (!enablePrefetch || prefetchUrls.length === 0 || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Prefetch next 5 images in background
            prefetchUrls.slice(0, 5).forEach((url) => {
              if (url) {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.as = 'image';
                link.href = url;
                document.head.appendChild(link);
              }
            });
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [enablePrefetch, prefetchUrls]);

  // Shimmer loading state
  if (loadingUrl) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-muted rounded-lg">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // Error state with icon
  if (error || !imageUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/50 text-muted-foreground rounded-lg border border-dashed border-muted-foreground/30">
        <ImageOff className="h-8 w-8 opacity-50" />
        <span className="text-xs">Imagem não disponível</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-lg",
        onImageClick && "hover:ring-2 hover:ring-primary/50 transition-all duration-200"
      )}
      onClick={onImageClick}
    >
      {/* Shimmer while image loads */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      )}
      
      <img
        src={imageUrl}
        alt={alt}
        className={cn(
          className,
          "transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        loading={loading}
        width={1080}
        height={1920}
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        onError={() => setError(true)}
      />
      
      {/* Zoom overlay on hover */}
      {onImageClick && imageLoaded && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      )}
    </div>
  );
});

SubmissionImageDisplay.displayName = 'SubmissionImageDisplay';
