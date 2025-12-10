import { memo, Suspense } from 'react';
// @ts-ignore - react-window types compatibility
import { FixedSizeList } from 'react-window';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Trash2, 
  MessageSquare,
  CheckCheck 
} from 'lucide-react';
import { formatPostName } from '@/lib/postNameFormatter';
import { EnrichedSubmission, ImageUrlCache } from '@/types/admin';
import { useVirtualizedList } from '@/hooks/useVirtualizedList';

/**
 * Admin Submission List Component
 * 
 * Displays paginated list of submissions with inline actions.
 * Supports bulk operations and lazy-loaded components for performance.
 * Memoized to prevent unnecessary re-renders.
 * 
 * @component
 */

/**
 * Props for AdminSubmissionList component
 */
interface AdminSubmissionListProps {
  /** Filtered and enriched submissions to display */
  submissions: EnrichedSubmission[];
  /** Current active page number (1-indexed) */
  currentPage: number;
  /** Number of items per page */
  itemsPerPage: number;
  /** Total number of pages based on filtered submissions */
  totalPages: number;
  /** Set of selected submission IDs for bulk operations */
  selectedSubmissions: Set<string>;
  /** Set of submission IDs with expanded comment sections */
  expandedComments: Set<string>;
  /** Map of submission IDs to signed image URLs */
  imageUrls: ImageUrlCache;
  /** Whether actions are read-only (for guest users) */
  isReadOnly: boolean;
  
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when submission status changes */
  onStatusChange: (submissionId: string, newStatus: string) => void;
  /** Callback to approve submission */
  onApprove: (submissionId: string) => void;
  /** Callback to reject submission */
  onReject: (submissionId: string) => void;
  /** Callback to delete submission */
  onDelete: (submissionId: string) => void;
  /** Callback to view audit log */
  onAuditLog: (submissionId: string) => void;
  /** Callback to toggle comment section visibility */
  onToggleComments: (submissionId: string) => void;
  /** Callback to toggle single submission selection */
  onToggleSelection: (submissionId: string) => void;
  /** Callback to toggle all submissions on current page */
  onToggleSelectAll: () => void;
  /** Callback to approve all selected submissions */
  onBulkApprove: () => void;
  /** Callback when image is clicked for zoom view */
  onImageZoom: (url: string, index: number) => void;
  
  /** Lazy-loaded comments component */
  SubmissionComments?: React.ComponentType<any>;
  /** Lazy-loaded image display component */
  SubmissionImageDisplay?: React.ComponentType<any>;
}

const AdminSubmissionListComponent = ({
  submissions,
  currentPage,
  itemsPerPage,
  totalPages,
  selectedSubmissions,
  expandedComments,
  imageUrls,
  isReadOnly,
  onPageChange,
  onStatusChange,
  onApprove,
  onReject,
  onDelete,
  onAuditLog,
  onToggleComments,
  onToggleSelection,
  onToggleSelectAll,
  onBulkApprove,
  onImageZoom,
  SubmissionComments,
  SubmissionImageDisplay,
}: AdminSubmissionListProps) => {
  if (submissions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhuma submissão encontrada com os filtros aplicados</p>
      </Card>
    );
  }

  // Calcular submissions da página atual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = submissions.slice(startIndex, startIndex + itemsPerPage);
  const allSelected = selectedSubmissions.size === paginatedSubmissions.length && paginatedSubmissions.length > 0;

  // ✅ OTIMIZAÇÃO: Usar virtualização para listas grandes
  const shouldVirtualize = paginatedSubmissions.length > 15;
  // ✅ FASE 2: Altura reduzida dos cards (de 450 para 380)
  const ITEM_HEIGHT = 380;

  // ✅ FASE 2: Preparar URLs para prefetch das próximas 5 imagens
  const getPrefetchUrls = (currentIndex: number): string[] => {
    const urls: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const nextSubmission = paginatedSubmissions[currentIndex + i];
      if (nextSubmission) {
        urls.push(imageUrls[nextSubmission.id] || nextSubmission.screenshot_url || '');
      }
    }
    return urls.filter(Boolean);
  };

  const { listRef, itemCount, itemHeight, containerHeight, overscanCount } = 
    useVirtualizedList({
      items: paginatedSubmissions,
      itemHeight: ITEM_HEIGHT,
      containerHeight: Math.min(paginatedSubmissions.length * ITEM_HEIGHT, 3000), // Max 3000px
      overscanCount: 2,
    });

  // Renderizar item individual com layout compacto
  const renderSubmissionCard = ({ index, style }: { index: number; style?: React.CSSProperties }) => {
    const submission = paginatedSubmissions[index];
    const prefetchUrls = getPrefetchUrls(index);
    
    return (
      <div style={style} className={shouldVirtualize ? "px-1" : ""}>
        <Card key={submission.id} className="p-4 mb-3">
          {/* ✅ FASE 2: Layout horizontal compacto */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Coluna esquerda: Imagem com altura reduzida */}
            {SubmissionImageDisplay && submission.screenshot_url && (
              <div className="lg:w-48 lg:flex-shrink-0">
                {/* ✅ FASE 2: Altura reduzida de h-64 para h-36 lg:h-48 */}
                <div className="w-full h-36 lg:h-48 bg-muted rounded-lg overflow-hidden">
                  <Suspense fallback={<Skeleton className="w-full h-full" />}>
                    <SubmissionImageDisplay
                      screenshotUrl={imageUrls[submission.id] || submission.screenshot_url}
                      submissionId={submission.id}
                      onImageClick={() => onImageZoom(imageUrls[submission.id] || submission.screenshot_url, startIndex + index)}
                      className="w-full h-full object-cover"
                      enablePrefetch={index < 3}
                      prefetchUrls={prefetchUrls}
                    />
                  </Suspense>
                </div>
              </div>
            )}

            {/* Coluna direita: Informações e ações */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header compacto */}
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedSubmissions.has(submission.id)}
                  onCheckedChange={() => onToggleSelection(submission.id)}
                  className="mt-1"
                />
                
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={submission.profiles?.avatar_url} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate">{submission.profiles?.full_name || 'Nome não disponível'}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {submission.profiles?.instagram && (
                          <span>@{submission.profiles.instagram}</span>
                        )}
                        {submission.profiles?.email && (
                          <span className="hidden sm:inline">• {submission.profiles.email}</span>
                        )}
                      </div>
                    </div>
                    
                    <Badge 
                      variant={
                        submission.status === 'approved' ? 'default' :
                        submission.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }
                      className="flex-shrink-0"
                    >
                      {submission.status === 'approved' ? 'Aprovado' :
                       submission.status === 'rejected' ? 'Reprovado' :
                       'Pendente'}
                    </Badge>
                  </div>

                  {/* Informações do post - layout inline */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {formatPostName(submission.posts?.post_type, submission.posts?.post_number)}
                      </span>
                      {submission.posts?.events?.title && (
                        <span className="text-muted-foreground/70">
                          ({submission.posts.events.title})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(submission.submitted_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Motivo de rejeição compacto */}
              {submission.status === 'rejected' && submission.rejection_reason && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-xs text-destructive">
                    <span className="font-semibold">Rejeição:</span> {submission.rejection_reason}
                  </p>
                </div>
              )}

              {/* ✅ FASE 2: Ações em linha única */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                {/* Botões de aprovação para pendentes - maiores em mobile */}
                {submission.status === 'pending' && (
                  <>
                    <Button
                      size="default"
                      className="bg-green-500 hover:bg-green-600 h-10 sm:h-9 min-w-[100px]"
                      onClick={() => onApprove(submission.id)}
                      disabled={isReadOnly}
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="default"
                      variant="destructive"
                      className="h-10 sm:h-9 min-w-[100px]"
                      onClick={() => onReject(submission.id)}
                      disabled={isReadOnly}
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </>
                )}
                
                {/* Seletor de Status compacto */}
                <Select
                  value={submission.status}
                  onValueChange={(newStatus) => onStatusChange(submission.id, newStatus)}
                >
                  <SelectTrigger className="w-[140px] h-10 sm:h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="default"
                  className="h-10 sm:h-9"
                  onClick={() => onAuditLog(submission.id)}
                >
                  Histórico
                </Button>

                <Button
                  size="default"
                  variant="ghost"
                  className="h-10 sm:h-9 text-muted-foreground"
                  onClick={() => onToggleComments(submission.id)}
                >
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  {expandedComments.has(submission.id) ? 'Ocultar' : 'Comentários'}
                </Button>

                <Button
                  size="default"
                  variant="ghost"
                  className="h-10 sm:h-9 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                  onClick={() => onDelete(submission.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Seção de Comentários expandível */}
              {expandedComments.has(submission.id) && SubmissionComments && (
                <div className="pt-2">
                  <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                    <SubmissionComments
                      submissionId={submission.id}
                      onCommentAdded={() => {}}
                    />
                  </Suspense>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <>
      {/* Ações em lote */}
      {selectedSubmissions.size > 0 && (
        <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedSubmissions.size} submiss{selectedSubmissions.size === 1 ? 'ão' : 'ões'} selecionada{selectedSubmissions.size === 1 ? '' : 's'}
            </span>
            <Button
              size="sm"
              onClick={onBulkApprove}
              disabled={isReadOnly}
              className="bg-green-500 hover:bg-green-600"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Aprovar Selecionadas
            </Button>
          </div>
        </Card>
      )}

      {/* Lista de submissões */}
      <div className="space-y-4">
        {/* Checkbox de selecionar todas */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onToggleSelectAll}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
            Selecionar todas desta página
          </label>
        </div>

        {/* Cards de submissões */}
        {shouldVirtualize ? (
          <FixedSizeList
            ref={listRef}
            height={containerHeight}
            itemCount={itemCount}
            itemSize={itemHeight}
            width="100%"
            overscanCount={overscanCount}
          >
            {renderSubmissionCard}
          </FixedSizeList>
        ) : (
          <div className="space-y-4">
            {paginatedSubmissions.map((submission: any, index: number) => 
              renderSubmissionCard({ index })
            )}
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a{' '}
            {Math.min(startIndex + itemsPerPage, submissions.length)} de{' '}
            {submissions.length} submissões
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export const AdminSubmissionList = memo(AdminSubmissionListComponent);
