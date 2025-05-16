import { useState, useCallback, useEffect } from "react";
import type { FlashcardDTO, GetFlashcardsResponseDTO } from "@/types";

interface UseFlashcardsReturn {
  flashcards: FlashcardDTO[];
  isLoading: boolean;
  error: string | null;
  fetchFlashcards: () => Promise<void>;
  updateFlashcard: (flashcard: FlashcardDTO) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
}

export function useFlashcards(): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlashcards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/flashcards");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Nie udało się pobrać fiszek" }));
        throw new Error(errorData.error || "Nie udało się pobrać fiszek");
      }

      const data: GetFlashcardsResponseDTO = await response.json();
      if (!data.flashcards) {
        throw new Error("Nie udało się pobrać fiszek");
      }
      setFlashcards(data.flashcards);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się pobrać fiszek";
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateFlashcard = useCallback(
    async (flashcard: FlashcardDTO) => {
      const previousFlashcards = [...flashcards];

      try {
        setError(null);

        // Optimistic update
        setFlashcards((current) => current.map((f) => (f.id === flashcard.id ? flashcard : f)));

        const response = await fetch(`/api/flashcards/${flashcard.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            front: flashcard.front,
            back: flashcard.back,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Nie udało się zaktualizować fiszki" }));
          throw new Error(errorData.error || "Nie udało się zaktualizować fiszki");
        }

        const updatedData = await response.json();
        if (!updatedData) {
          throw new Error("Nie udało się zaktualizować fiszki");
        }

        // Update with server response to ensure consistency
        setFlashcards((current) => current.map((f) => (f.id === flashcard.id ? { ...f, ...updatedData } : f)));
      } catch (err) {
        setFlashcards(previousFlashcards);
        const errorMessage = err instanceof Error ? err.message : "Nie udało się zaktualizować fiszki";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [flashcards]
  );

  const deleteFlashcard = useCallback(
    async (id: string) => {
      const previousFlashcards = [...flashcards];

      try {
        setError(null);

        // Optimistic delete
        setFlashcards((current) => current.filter((flashcard) => flashcard.id !== id));

        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Nie udało się usunąć fiszki" }));
          throw new Error(errorData.error || "Nie udało się usunąć fiszki");
        }
      } catch (err) {
        setFlashcards(previousFlashcards);
        const errorMessage = err instanceof Error ? err.message : "Nie udało się usunąć fiszki";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [flashcards]
  );

  useEffect(() => {
    fetchFlashcards().catch((error) => {
      console.error("Error fetching flashcards:", error);
    });
  }, [fetchFlashcards]);

  return {
    flashcards,
    isLoading,
    error,
    fetchFlashcards,
    updateFlashcard,
    deleteFlashcard,
  };
}
