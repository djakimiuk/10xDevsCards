import { useState, useEffect } from "react";
import type { FlashcardDTO } from "@/types";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { useFlashcards } from "./hooks/useFlashcards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export function FlashcardsPage() {
  const { flashcards, isLoading, error, fetchFlashcards, updateFlashcard, deleteFlashcard } = useFlashcards();
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDTO | null>(null);
  const [deletingFlashcard, setDeletingFlashcard] = useState<FlashcardDTO | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const handleUpdateFlashcard = async (flashcard: FlashcardDTO) => {
    try {
      setEditError(null);
      await updateFlashcard(flashcard);
      setEditingFlashcard(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się zaktualizować fiszki";
      setEditError(errorMessage);
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    try {
      setDeleteError(null);
      await deleteFlashcard(id);
      setDeletingFlashcard(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się usunąć fiszki";
      setDeleteError(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div role="status" aria-label="Ładowanie fiszek" className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="sr-only">Ładowanie...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flashcards.map((flashcard) => (
          <Card key={flashcard.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fiszka</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Utworzono: {new Date(flashcard.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Edytuj fiszkę"
                    onClick={() => {
                      updateFlashcard(flashcard);
                      setEditingFlashcard(flashcard);
                      setEditError(null);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edytuj</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Usuń fiszkę"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      deleteFlashcard(flashcard.id);
                      setDeletingFlashcard(flashcard);
                      setDeleteError(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Usuń</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Przód</h3>
                <p className="text-sm" data-testid={`flashcard-front-${flashcard.id}`}>
                  {flashcard.front}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tył</h3>
                <p className="text-sm" data-testid={`flashcard-back-${flashcard.id}`}>
                  {flashcard.back}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EditFlashcardModal
        flashcard={editingFlashcard}
        onSave={handleUpdateFlashcard}
        onClose={() => {
          setEditingFlashcard(null);
          setEditError(null);
        }}
        error={editError}
      />

      <DeleteConfirmationModal
        flashcard={deletingFlashcard}
        onConfirm={handleDeleteFlashcard}
        onCancel={() => {
          setDeletingFlashcard(null);
          setDeleteError(null);
        }}
        error={deleteError}
      />
    </div>
  );
}
