import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface SubmissionImageDisplayProps {
  screenshotPath: string | null;
  screenshotUrl?: string | null; // For backward compatibility with old URLs
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Component that displays submission screenshots by generating signed URLs on-demand
 * This prevents URL expiration issues and improves security
 */
export const SubmissionImageDisplay = ({
  screenshotPath,
  screenshotUrl,
  alt = 'Screenshot',
  className = 'w-full h-full object-cover',
  loading = 'lazy'
}: SubmissionImageDisplayProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const generateUrl = async () => {
      try {
        setLoadingUrl(true);
        setError(false);

        // If we have a path, generate a fresh signed URL
        if (screenshotPath) {
          const { data, error: urlError } = await supabase.storage
            .from('screenshots')
            .createSignedUrl(screenshotPath, 3600); // 1 hour expiry

          if (urlError) throw urlError;
          setImageUrl(data.signedUrl);
        } 
        // Fallback to old URL if available (for backward compatibility)
        else if (screenshotUrl) {
          setImageUrl(screenshotUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error generating signed URL:', err);
        setError(true);
      } finally {
        setLoadingUrl(false);
      }
    };

    generateUrl();
  }, [screenshotPath, screenshotUrl]);

  if (loadingUrl) {
    return <Skeleton className="w-full h-full" />;
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
        Imagem não disponível
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setError(true)}
    />
  );
};
