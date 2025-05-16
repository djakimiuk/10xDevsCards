import { useCallback, useState, useEffect } from "react";
import type { FlashcardDTO } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditFlashcardModalProps {
  flashcard: FlashcardDTO | null;
  onSave: (flashcard: FlashcardDTO) => Promise<void>;
  onClose: () => void;
  error?: string | null;
}

const MAX_LENGTH = 500;

export function EditFlashcardModal({ flashcard, onSave, onClose, error: externalError }: EditFlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
    }
  }, [flashcard]);

  useEffect(() => {
    setError(externalError || null);
  }, [externalError]);

  const validateForm = () => {
    if (!front.trim()) {
      console.log("[EditFlashcardModal] Front validation failed - empty value");
      return false;
    }
    if (front.length > MAX_LENGTH || back.length > MAX_LENGTH) {
      console.log("[EditFlashcardModal] Content length validation failed");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!flashcard) return;

    if (!validateForm()) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        ...flashcard,
        front: front.trim(),
        back: back.trim(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się zaktualizować fiszki";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFrontChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setFront(value);
      setError(null);
    }
  }, []);

  const handleBackChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setBack(value);
      setError(null);
    }
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isSubmitting) {
        onClose();
      }
    },
    [isSubmitting, onClose]
  );

  return (
    <Dialog open={!!flashcard} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>Wprowadź zmiany w swojej fiszce. Kliknij zapisz, gdy skończysz.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4 py-4"
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="front">Przód</Label>
              <Textarea
                id="front"
                name="front"
                value={front}
                onChange={handleFrontChange}
                placeholder="Wpisz treść przedniej strony fiszki"
                className="resize-none"
                disabled={isSubmitting}
                maxLength={MAX_LENGTH}
                required
                aria-required="true"
                aria-invalid={!front.trim()}
                aria-describedby="front-count"
              />
              <p id="front-count" className="text-sm text-muted-foreground">
                {front.length}/{MAX_LENGTH} znaków
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="back">Tył</Label>
              <Textarea
                id="back"
                name="back"
                value={back}
                onChange={handleBackChange}
                placeholder="Wpisz treść tylnej strony fiszki"
                className="resize-none"
                disabled={isSubmitting}
                maxLength={MAX_LENGTH}
                aria-describedby="back-count"
              />
              <p id="back-count" className="text-sm text-muted-foreground">
                {back.length}/{MAX_LENGTH} znaków
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Anuluj edycję"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !front.trim() || front.length > MAX_LENGTH || back.length > MAX_LENGTH}
              aria-label="Zapisz zmiany"
            >
              {isSubmitting ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
