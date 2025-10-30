import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { SubmissionImageDisplay } from "./SubmissionImageDisplay";
import { useEffect } from "react";

interface SubmissionZoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: {
    id: string;
    screenshot_path: string | null;
    screenshot_url?: string | null;
    profile_screenshot_path?: string | null; // 🆕
    followers_range?: string; // 🆕
    status: string;
    profiles?: {
      full_name: string;
      email: string;
      instagram?: string;
    };
    posts?: {
      post_number?: number;
      events?: {
        title: string;
      };
    };
  };
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const SubmissionZoomDialog = ({
  open,
  onOpenChange,
  submission,
  onApprove,
  onReject,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}: SubmissionZoomDialogProps) => {
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, hasNext, hasPrevious, onNext, onPrevious, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 flex flex-col">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Imagens lado a lado com legendas visíveis */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-black relative" style={{ height: 'calc(95vh - 200px)' }}>
            {/* Imagem da Postagem */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <SubmissionImageDisplay
                  screenshotPath={submission.screenshot_path}
                  screenshotUrl={submission.screenshot_url}
                  className="max-h-[60vh] max-w-full w-auto object-contain"
                  loading="eager"
                />
              </div>
              <div className="text-center bg-blue-600/90 text-white px-3 py-1.5 rounded-md text-sm font-medium flex-shrink-0">
                📸 Print da Postagem
              </div>
            </div>
            
            {/* Imagem do Perfil (se existir) */}
            {submission.profile_screenshot_path && (
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  <SubmissionImageDisplay
                    screenshotPath={submission.profile_screenshot_path}
                    className="max-h-[60vh] max-w-full w-auto object-contain"
                    loading="eager"
                  />
                </div>
                <div className="text-center bg-green-600/90 text-white px-3 py-1.5 rounded-md text-sm font-medium flex-shrink-0">
                  👤 Print do Perfil
                </div>
              </div>
            )}
            
            {/* Navegação por setas */}
            {hasPrevious && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white z-10"
                onClick={onPrevious}
              >
                <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
              </Button>
            )}
            
            {hasNext && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white z-10"
                onClick={onNext}
              >
                <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
              </Button>
            )}
          </div>
          
          {/* Informações e ações - altura fixa */}
          <div className="bg-background p-3 sm:p-4 border-t flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base sm:text-lg truncate">
                  {submission.profiles?.full_name || 'Nome não disponível'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {submission.profiles?.email || 'Email não disponível'}
                </p>
                {submission.profiles?.instagram && (
                  <p className="text-xs sm:text-sm font-medium text-primary mt-1 truncate">
                    @{submission.profiles.instagram}
                  </p>
                )}
                {/* 🆕 Mostrar faixa de seguidores */}
                {submission.followers_range && (
                  <p className="text-xs font-medium text-green-600 mt-1">
                    👥 {submission.followers_range}
                  </p>
                )}
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                {submission.posts?.post_number && (
                  <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                    Postagem #{submission.posts.post_number}
                  </p>
                )}
                {submission.posts?.events?.title && (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {submission.posts.events.title}
                  </p>
                )}
              </div>
            </div>
            
            {/* Botões de ação (apenas se pendente) */}
            {submission.status === 'pending' && (
              <div className="flex gap-2 mb-2">
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-sm sm:text-base"
                  onClick={() => onApprove(submission.id)}
                >
                  <Check className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Aprovar
                </Button>
                <Button
                  className="flex-1 text-sm sm:text-base"
                  variant="destructive"
                  onClick={() => onReject(submission.id)}
                >
                  <X className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Rejeitar
                </Button>
              </div>
            )}
            
            {/* Hint de navegação */}
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
              Use as setas ← → do teclado para navegar | ESC para fechar
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
