import { memo, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SubmissionZoomDialog } from "@/components/SubmissionZoomDialog";

// Lazy loaded components
const EventDialog = lazy(() => import("@/components/EventDialog").then(m => ({ default: m.EventDialog })));
const PostDialog = lazy(() => import("@/components/PostDialog").then(m => ({ default: m.PostDialog })));
const AddManualSubmissionDialog = lazy(() => import("@/components/AddManualSubmissionDialog").then(m => ({ default: m.AddManualSubmissionDialog })));
const SuggestionDialog = lazy(() => import("@/components/SuggestionDialog").then(m => ({ default: m.SuggestionDialog })));
const SubmissionAuditLog = lazy(() => import("@/components/SubmissionAuditLog").then(m => ({ default: m.SubmissionAuditLog })));

interface RejectionTemplate {
  id: string;
  title: string;
  message: string;
}

interface ExportColumn {
  key: string;
  label: string;
}

interface AdminDialogsProps {
  // Event Dialog
  eventDialogOpen: boolean;
  setEventDialogOpen: (open: boolean) => void;
  selectedEvent: any;
  setSelectedEvent: (event: any) => void;
  onEventCreated: () => void;

  // Post Dialog
  postDialogOpen: boolean;
  setPostDialogOpen: (open: boolean) => void;
  selectedPost: any;
  setSelectedPost: (post: any) => void;
  onPostCreated: () => void;

  // Rejection Dialog
  rejectionDialogOpen: boolean;
  setRejectionDialogOpen: (open: boolean) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  rejectionTemplate: string;
  setRejectionTemplate: (template: string) => void;
  rejectionTemplatesFromDB: RejectionTemplate[];
  onConfirmRejection: () => void;

  // Audit Log Dialog
  auditLogSubmissionId: string | null;
  setAuditLogSubmissionId: (id: string | null) => void;

  // Delete Event Dialog
  eventToDelete: string | null;
  setEventToDelete: (id: string | null) => void;
  onDeleteEvent: (id: string) => void;

  // Delete Post Dialog
  postToDelete: { id: string; submissionsCount: number } | null;
  setPostToDelete: (post: { id: string; submissionsCount: number } | null) => void;
  onDeletePost: () => void;

  // Delete Submission Dialog
  submissionToDelete: string | null;
  setSubmissionToDelete: (id: string | null) => void;
  onDeleteSubmission: () => void;

  // Image Zoom Dialog
  selectedImageForZoom: string | null;
  setSelectedImageForZoom: (url: string | null) => void;

  // Manual Submission Dialog
  addSubmissionDialogOpen: boolean;
  setAddSubmissionDialogOpen: (open: boolean) => void;
  onSubmissionSuccess: () => void;
  submissionEventFilter: string;

  // Zoom Dialog
  zoomDialogOpen: boolean;
  setZoomDialogOpen: (open: boolean) => void;
  zoomSubmission: any;
  onZoomApprove: (id: string) => Promise<void>;
  onZoomReject: (id: string) => void;
  onZoomNext: () => void;
  onZoomPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;

  // Suggestion Dialog
  suggestionDialogOpen: boolean;
  setSuggestionDialogOpen: (open: boolean) => void;
  userId: string;
  agencyId?: string;

  // Column Selection Dialog
  showColumnSelectionDialog: boolean;
  setShowColumnSelectionDialog: (open: boolean) => void;
  availableExportColumns: ExportColumn[];
  selectedExportColumns: string[];
  setSelectedExportColumns: (columns: string[]) => void;
  onExecuteExport: () => void;
}

export const AdminDialogs = memo(({
  // Event Dialog
  eventDialogOpen,
  setEventDialogOpen,
  selectedEvent,
  setSelectedEvent,
  onEventCreated,

  // Post Dialog
  postDialogOpen,
  setPostDialogOpen,
  selectedPost,
  setSelectedPost,
  onPostCreated,

  // Rejection Dialog
  rejectionDialogOpen,
  setRejectionDialogOpen,
  rejectionReason,
  setRejectionReason,
  rejectionTemplate,
  setRejectionTemplate,
  rejectionTemplatesFromDB,
  onConfirmRejection,

  // Audit Log Dialog
  auditLogSubmissionId,
  setAuditLogSubmissionId,

  // Delete Event Dialog
  eventToDelete,
  setEventToDelete,
  onDeleteEvent,

  // Delete Post Dialog
  postToDelete,
  setPostToDelete,
  onDeletePost,

  // Delete Submission Dialog
  submissionToDelete,
  setSubmissionToDelete,
  onDeleteSubmission,

  // Image Zoom Dialog
  selectedImageForZoom,
  setSelectedImageForZoom,

  // Manual Submission Dialog
  addSubmissionDialogOpen,
  setAddSubmissionDialogOpen,
  onSubmissionSuccess,
  submissionEventFilter,

  // Zoom Dialog
  zoomDialogOpen,
  setZoomDialogOpen,
  zoomSubmission,
  onZoomApprove,
  onZoomReject,
  onZoomNext,
  onZoomPrevious,
  hasNext,
  hasPrevious,

  // Suggestion Dialog
  suggestionDialogOpen,
  setSuggestionDialogOpen,
  userId,
  agencyId,

  // Column Selection Dialog
  showColumnSelectionDialog,
  setShowColumnSelectionDialog,
  availableExportColumns,
  selectedExportColumns,
  setSelectedExportColumns,
  onExecuteExport,
}: AdminDialogsProps) => {
  return (
    <>
      {/* Event Dialog */}
      <Suspense fallback={null}>
        <EventDialog
          open={eventDialogOpen}
          onOpenChange={(open) => {
            setEventDialogOpen(open);
            if (!open) setSelectedEvent(null);
          }}
          onEventCreated={onEventCreated}
          event={selectedEvent}
        />
      </Suspense>

      {/* Post Dialog */}
      <Suspense fallback={null}>
        <PostDialog
          open={postDialogOpen}
          onOpenChange={(open) => {
            setPostDialogOpen(open);
            if (!open) setSelectedPost(null);
          }}
          onPostCreated={onPostCreated}
          post={selectedPost}
        />
      </Suspense>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Submissão</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para que o usuário possa corrigir
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Template de Resposta</Label>
              <Select
                value={rejectionTemplate}
                onValueChange={(value) => {
                  setRejectionTemplate(value);
                  if (value === "custom") {
                    setRejectionReason("");
                  } else {
                    const template = rejectionTemplatesFromDB.find((t) => t.id === value);
                    if (template) {
                      setRejectionReason(template.message);
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Template customizado</SelectItem>
                  {rejectionTemplatesFromDB.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Rejeição</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da rejeição..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="min-h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onConfirmRejection}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={!!auditLogSubmissionId} onOpenChange={(open) => !open && setAuditLogSubmissionId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>Visualize todas as mudanças de status desta submissão</DialogDescription>
          </DialogHeader>

          {auditLogSubmissionId && (
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <SubmissionAuditLog submissionId={auditLogSubmissionId} />
            </Suspense>
          )}

          <DialogFooter>
            <Button onClick={() => setAuditLogSubmissionId(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Dialog */}
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento e todos os seus dados relacionados serão permanentemente
              excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => eventToDelete && onDeleteEvent(eventToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Post Dialog */}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir postagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A postagem será permanentemente excluída.
              {postToDelete && postToDelete.submissionsCount > 0 && (
                <span className="block mt-2 font-semibold text-destructive">
                  ⚠️ Atenção: {postToDelete.submissionsCount} submissão(ões) associada(s) também será(ão) deletada(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir{" "}
              {postToDelete && postToDelete.submissionsCount > 0
                ? `tudo (${postToDelete.submissionsCount} submissão${postToDelete.submissionsCount > 1 ? "ões" : ""})`
                : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Submission Dialog */}
      <AlertDialog open={!!submissionToDelete} onOpenChange={(open) => !open && setSubmissionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir submissão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A submissão será permanentemente excluída do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteSubmission}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Zoom Dialog */}
      <Dialog open={!!selectedImageForZoom} onOpenChange={() => setSelectedImageForZoom(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
          <DialogHeader>
            <DialogTitle>Imagem da Submissão</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center w-full h-full">
            {selectedImageForZoom && (
              <img
                src={selectedImageForZoom}
                alt="Screenshot ampliado"
                className="max-w-full max-h-[85vh] object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Manual Submission Dialog */}
      <Suspense fallback={null}>
        <AddManualSubmissionDialog
          open={addSubmissionDialogOpen}
          onOpenChange={setAddSubmissionDialogOpen}
          onSuccess={onSubmissionSuccess}
          selectedEventId={submissionEventFilter !== "all" ? submissionEventFilter : undefined}
        />
      </Suspense>

      {/* Zoom Dialog with navigation */}
      {zoomSubmission && (
        <SubmissionZoomDialog
          open={zoomDialogOpen}
          onOpenChange={setZoomDialogOpen}
          submission={zoomSubmission}
          onApprove={onZoomApprove}
          onReject={onZoomReject}
          onNext={onZoomNext}
          onPrevious={onZoomPrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
        />
      )}

      {/* Suggestion Dialog */}
      <Suspense fallback={null}>
        <SuggestionDialog
          open={suggestionDialogOpen}
          onOpenChange={setSuggestionDialogOpen}
          userId={userId}
          agencyId={agencyId}
        />
      </Suspense>

      {/* Column Selection Dialog */}
      <AlertDialog open={showColumnSelectionDialog} onOpenChange={setShowColumnSelectionDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Selecione as colunas para exportar</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha quais informações deseja incluir no relatório Excel
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {availableExportColumns.map((col) => (
              <div key={col.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={col.key}
                  checked={selectedExportColumns.includes(col.key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedExportColumns([...selectedExportColumns, col.key]);
                    } else {
                      setSelectedExportColumns(selectedExportColumns.filter((k) => k !== col.key));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor={col.key}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {col.label}
                </label>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onExecuteExport} disabled={selectedExportColumns.length === 0}>
              Exportar ({selectedExportColumns.length} coluna{selectedExportColumns.length !== 1 ? "s" : ""})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

AdminDialogs.displayName = "AdminDialogs";
