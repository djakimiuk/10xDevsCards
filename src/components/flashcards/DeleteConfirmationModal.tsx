import { useState, useCallback, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FlashcardDTO } from "@/types";

interface DeleteConfirmationModalProps {
  flashcard: FlashcardDTO | null;
  onConfirm: (id: string) => Promise<void>;
  onCancel: () => void;
  error?: string | null;
}

export function DeleteConfirmationModal({
  flashcard,
  onConfirm,
  onCancel,
  error: initialError,
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  const handleDelete = useCallback(async () => {
    if (!flashcard) return;

    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm(flashcard.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się usunąć fiszki";
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [flashcard, onConfirm]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isDeleting) {
        onCancel();
      }
    },
    [isDeleting, onCancel]
  );

  useEffect(() => {
    setError(initialError || null);
  }, [initialError]);

  if (!flashcard) return null;

  return (
    <AlertDialog open={!!flashcard} onOpenChange={handleOpenChange}>
      <AlertDialogContent role="dialog" aria-label="Usuń fiszkę">
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń fiszkę</AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć tę fiszkę? Tej operacji nie można cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive" role="alert" data-testid="delete-error-alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Przód</h3>
            <div
              className="whitespace-pre-wrap font-mono text-sm bg-muted p-2 rounded-md"
              data-testid={`delete-modal-front-${flashcard.id}`}
              aria-label="Przód fiszki"
            >
              {flashcard.front}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Tył</h3>
            <div
              className="whitespace-pre-wrap font-mono text-sm bg-muted p-2 rounded-md"
              data-testid={`delete-modal-back-${flashcard.id}`}
              aria-label="Tył fiszki"
            >
              {flashcard.back}
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} aria-label="Anuluj usuwanie">
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            aria-label="Potwierdź usunięcie"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
