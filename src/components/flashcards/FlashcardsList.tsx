import type { FlashcardDTO } from "@/types";
import { FlashcardRow } from "./FlashcardRow";

interface FlashcardsListProps {
  flashcards: FlashcardDTO[];
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}

export function FlashcardsList({ flashcards, onEdit, onDelete }: FlashcardsListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No flashcards</h3>
        <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new flashcard.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {flashcards.map((flashcard) => (
        <FlashcardRow
          key={flashcard.id}
          flashcard={flashcard}
          onEdit={() => onEdit(flashcard)}
          onDelete={() => onDelete(flashcard)}
        />
      ))}
    </div>
  );
}
