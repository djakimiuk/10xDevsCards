import { useState, useRef, useCallback, useEffect } from "react";
import type {
  CreateGenerationRequestCommand,
  GenerationRequestDTO,
  AICandidateFlashcardDTO,
  UpdateAICandidateFlashcardCommand,
  CandidateViewModel,
  CandidateUIState,
} from "@/types";

// Pomocnicza funkcja do obsługi błędów HTTP
const handleHttpError = async (response: Response): Promise<string> => {
  if (response.status === 401) {
    return "You are not authorized. Please log in again.";
  }
  if (response.status === 404) {
    return "The requested resource was not found.";
  }
  if (response.status === 400) {
    try {
      const data = await response.json();
      return data.message || "Invalid request data.";
    } catch {
      return "Invalid request data.";
    }
  }
  return "An unexpected error occurred. Please try again.";
};

// Pomocnicza funkcja do obsługi błędów sieciowych
const handleNetworkError = (error: unknown): string => {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Network error. Please check your internet connection.";
  }
  return error instanceof Error ? error.message : "An unexpected error occurred.";
};

export function useGenerationProcess() {
  // Stan tekstu źródłowego i walidacji
  const [sourceText, setSourceText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Stan procesu generowania
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationRequest, setGenerationRequest] = useState<GenerationRequestDTO | null>(null);
  const [candidates, setCandidates] = useState<CandidateViewModel[]>([]);

  // Ref dla interwału pollingu
  const pollingIntervalId = useRef<NodeJS.Timeout | null>(null);

  // Walidacja tekstu wejściowego
  const validateSourceText = useCallback((text: string): string | null => {
    if (text.length < 1000) {
      return "Text must be at least 1000 characters long";
    }
    if (text.length > 10000) {
      return "Text cannot be longer than 10000 characters";
    }
    return null;
  }, []);

  // Rozpoczęcie procesu generowania
  const startGeneration = useCallback(async () => {
    const validationError = validateSourceText(sourceText);
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCandidates([]);

    try {
      const command: CreateGenerationRequestCommand = { source_text: sourceText };
      const response = await fetch("/api/generation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(await handleHttpError(response));
      }

      const request: GenerationRequestDTO = await response.json();
      setGenerationRequest(request);
      startPolling(request.id);
    } catch (err) {
      setError(handleNetworkError(err));
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, validateSourceText]);

  // Rozpoczęcie pollingu dla kandydatów
  const startPolling = useCallback((requestId: string) => {
    if (pollingIntervalId.current) {
      clearInterval(pollingIntervalId.current);
    }

    const pollCandidates = async () => {
      try {
        const response = await fetch(`/api/ai-candidates?generationRequestId=${requestId}`);
        if (!response.ok) {
          throw new Error(await handleHttpError(response));
        }

        const data = await response.json();
        const newCandidates: CandidateViewModel[] = data.aiCandidates.map((dto: AICandidateFlashcardDTO) => ({
          id: dto.id,
          requestId: dto.request_id,
          front: dto.front,
          back: dto.back,
          createdAt: dto.created_at,
          uiState: "idle",
        }));

        setCandidates(newCandidates);

        if (newCandidates.length > 0) {
          clearInterval(pollingIntervalId.current!);
          pollingIntervalId.current = null;
        }
      } catch (err) {
        setError(handleNetworkError(err));
        clearInterval(pollingIntervalId.current!);
        pollingIntervalId.current = null;
      }
    };

    pollingIntervalId.current = setInterval(pollCandidates, 2000);
    pollCandidates();
  }, []);

  // Oznaczenie kandydata do akceptacji
  const markForAcceptance = useCallback((candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, uiState: c.uiState === "marked_for_acceptance" ? "idle" : "marked_for_acceptance" }
          : c
      )
    );
  }, []);

  // Oznaczenie kandydata do odrzucenia
  const markForRejection = useCallback((candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, uiState: c.uiState === "marked_for_rejection" ? "idle" : "marked_for_rejection" }
          : c
      )
    );
  }, []);

  // Aktualizacja kandydata (edycja)
  const updateCandidate = useCallback(async (candidateId: string, data: UpdateAICandidateFlashcardCommand) => {
    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, uiState: "saving_edit" } : c)));

    try {
      const response = await fetch(`/api/ai-candidates/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await handleHttpError(response));
      }

      const updated: AICandidateFlashcardDTO = await response.json();
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                front: updated.front,
                back: updated.back,
                uiState: "idle",
                editData: undefined,
              }
            : c
        )
      );
    } catch (err) {
      const errorMessage = handleNetworkError(err);
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                uiState: "error",
                errorMessage,
              }
            : c
        )
      );
    }
  }, []);

  // Ustawienie trybu edycji
  const setCandidateToEdit = useCallback((candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              uiState: "editing",
              editData: { front: c.front, back: c.back },
            }
          : c
      )
    );
  }, []);

  // Anulowanie trybu edycji
  const cancelEdit = useCallback((candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              uiState: "idle",
              editData: undefined,
            }
          : c
      )
    );
  }, []);

  // Zapisanie wszystkich oznaczonych kandydatów
  const saveAllMarkedCandidates = useCallback(async () => {
    setIsBulkSaving(true);
    let hasErrors = false;

    try {
      for (const candidate of candidates) {
        if (candidate.uiState === "marked_for_acceptance") {
          setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, uiState: "saving" } : c)));

          try {
            const response = await fetch(`/api/ai-candidates/${candidate.id}/accept`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });

            if (!response.ok) {
              throw new Error(await handleHttpError(response));
            }

            setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, uiState: "saved" } : c)));
          } catch (err) {
            hasErrors = true;
            const errorMessage = handleNetworkError(err);
            setCandidates((prev) =>
              prev.map((c) => (c.id === candidate.id ? { ...c, uiState: "error", errorMessage } : c))
            );
          }
        } else if (candidate.uiState === "marked_for_rejection") {
          setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, uiState: "saving" } : c)));

          try {
            const response = await fetch(`/api/ai-candidates/${candidate.id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              throw new Error(await handleHttpError(response));
            }

            setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, uiState: "rejected" } : c)));
          } catch (err) {
            hasErrors = true;
            const errorMessage = handleNetworkError(err);
            setCandidates((prev) =>
              prev.map((c) => (c.id === candidate.id ? { ...c, uiState: "error", errorMessage } : c))
            );
          }
        }
      }

      if (hasErrors) {
        setError("Some flashcards failed to save. Please check individual cards for details.");
      }
    } finally {
      setIsBulkSaving(false);
    }
  }, [candidates]);

  // Zapisanie tylko zaakceptowanych kandydatów
  const saveOnlyAcceptedCandidates = useCallback(async () => {
    setIsBulkSaving(true);
    let hasErrors = false;

    try {
      for (const candidate of candidates) {
        if (candidate.uiState === "marked_for_acceptance") {
          setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, uiState: "saving" } : c)));

          try {
            const response = await fetch(`/api/ai-candidates/${candidate.id}/accept`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });

            if (!response.ok) {
              throw new Error(await handleHttpError(response));
            }

            setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, uiState: "saved" } : c)));
          } catch (err) {
            hasErrors = true;
            const errorMessage = handleNetworkError(err);
            setCandidates((prev) =>
              prev.map((c) => (c.id === candidate.id ? { ...c, uiState: "error", errorMessage } : c))
            );
          }
        }
      }

      if (hasErrors) {
        setError("Some flashcards failed to save. Please check individual cards for details.");
      }
    } finally {
      setIsBulkSaving(false);
    }
  }, [candidates]);

  // Czyszczenie interwału przy odmontowaniu
  useEffect(() => {
    return () => {
      if (pollingIntervalId.current) {
        clearInterval(pollingIntervalId.current);
      }
    };
  }, []);

  return {
    sourceText,
    setSourceText,
    validationError,
    isLoading,
    isBulkSaving,
    error,
    candidates,
    startGeneration,
    markForAcceptance,
    updateCandidate,
    markForRejection,
    setCandidateToEdit,
    cancelEdit,
    saveAllMarkedCandidates,
    saveOnlyAcceptedCandidates,
  };
}
