import { useState, useCallback } from "react";
import type { CandidateViewModel, UpdateAICandidateFlashcardCommand } from "@/types";
import type { FlashcardCandidate } from "@/lib/services/openrouter.types";
import { logger } from "@/lib/logger";

// Helper function to handle HTTP errors
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

// Helper function to handle network errors
const handleNetworkError = (error: unknown): string => {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Network error. Please check your internet connection.";
  }
  return error instanceof Error ? error.message : "An unexpected error occurred.";
};

// Helper function to convert FlashcardCandidate to CandidateViewModel
const convertToViewModel = (candidate: FlashcardCandidate): CandidateViewModel => ({
  id: candidate.id ?? crypto.randomUUID(),
  requestId: candidate.requestId ?? crypto.randomUUID(),
  front: candidate.front,
  back: candidate.back,
  confidence: candidate.confidence,
  explanation: candidate.explanation,
  createdAt: candidate.createdAt ?? new Date().toISOString(),
  uiState: "idle",
  editData: null,
  errorMessage: null,
});

export function useGenerationProcess() {
  // Source text state and validation
  const [sourceText, setSourceText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Generation process state
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateViewModel[]>([]);

  // Input text validation
  const validateSourceText = useCallback((text: string): string | null => {
    if (text.length < 100) {
      return "Text must be at least 100 characters long";
    }
    if (text.length > 10000) {
      return "Text cannot be longer than 10000 characters";
    }
    return null;
  }, []);

  // Start generation process
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
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });

      if (!response.ok) {
        throw new Error(await handleHttpError(response));
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "Failed to generate flashcards");
      }

      logger.info("Generation completed successfully", { count: data.flashcards.length });
      setCandidates(data.flashcards.map(convertToViewModel));
    } catch (error) {
      logger.error("Generation error:", error);
      setError("Failed to generate flashcards");
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, validateSourceText]);

  // Mark candidate for acceptance
  const markForAcceptance = useCallback((candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, uiState: c.uiState === "marked_for_acceptance" ? "idle" : "marked_for_acceptance" }
          : c
      )
    );
  }, []);

  // Mark candidate for rejection
  const markForRejection = useCallback((candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, uiState: c.uiState === "marked_for_rejection" ? "idle" : "marked_for_rejection" }
          : c
      )
    );
  }, []);

  // Update candidate (edit)
  const updateCandidate = useCallback((candidateId: string, data: UpdateAICandidateFlashcardCommand) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              front: data.front,
              back: data.back,
              uiState: "idle",
            }
          : c
      )
    );
  }, []);

  // Set candidate to edit mode
  const setCandidateToEdit = useCallback((candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              uiState: "editing",
              editData: {
                front: c.front,
                back: c.back,
                explanation: c.explanation,
              },
            }
          : c
      )
    );
  }, []);

  // Cancel edit mode
  const cancelEdit = useCallback((candidateId: string) => {
    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, uiState: "idle", editData: null } : c)));
  }, []);

  // Save all marked candidates
  const saveAllMarkedCandidates = useCallback(async () => {
    setIsBulkSaving(true);
    setError(null);

    try {
      const markedCandidates = candidates.filter(
        (c) => c.uiState === "marked_for_acceptance" || c.uiState === "marked_for_rejection"
      );

      // Update UI state to saving for all marked candidates
      setCandidates((prev) =>
        prev.map((c) => (markedCandidates.some((mc) => mc.id === c.id) ? { ...c, uiState: "saving" } : c))
      );

      // Process each candidate
      for (const candidate of markedCandidates) {
        try {
          if (candidate.uiState === "marked_for_acceptance") {
            const response = await fetch(`/api/ai-candidates/${candidate.id}/accept/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
              throw new Error(await handleHttpError(response));
            }
          } else if (candidate.uiState === "marked_for_rejection") {
            const response = await fetch(`/api/ai-candidates/${candidate.id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              throw new Error(await handleHttpError(response));
            }
          }
        } catch (error) {
          // Update UI state to error for this candidate
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === candidate.id ? { ...c, uiState: "error", errorMessage: handleNetworkError(error) } : c
            )
          );
          return; // Exit early if there's an error
        }
      }

      // Remove all processed candidates that didn't error out
      setCandidates((prev) =>
        prev.filter((c) => !markedCandidates.some((mc) => mc.id === c.id) || c.uiState === "error")
      );

      // Clear source text if all candidates were processed successfully
      if (candidates.every((c) => c.uiState !== "error")) {
        setSourceText("");
      }
    } catch (error) {
      setError("Failed to process generation");
      logger.error("Processing error:", error);
    } finally {
      setIsBulkSaving(false);
    }
  }, [candidates]);

  // Save only accepted candidates
  const saveOnlyAcceptedCandidates = useCallback(async () => {
    setIsBulkSaving(true);
    setError(null);

    try {
      const acceptedCandidates = candidates.filter((c) => c.uiState === "marked_for_acceptance");

      // Update UI state to saving for accepted candidates
      setCandidates((prev) =>
        prev.map((c) => (acceptedCandidates.some((ac) => ac.id === c.id) ? { ...c, uiState: "saving" } : c))
      );

      // Process each accepted candidate
      for (const candidate of acceptedCandidates) {
        try {
          const response = await fetch(`/api/ai-candidates/${candidate.id}/accept/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (!response.ok) {
            throw new Error(await handleHttpError(response));
          }
        } catch (error) {
          // Update UI state to error for this candidate
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === candidate.id ? { ...c, uiState: "error", errorMessage: handleNetworkError(error) } : c
            )
          );
          return; // Exit early if there's an error
        }
      }

      // Remove all successfully processed candidates
      setCandidates((prev) =>
        prev.filter((c) => !acceptedCandidates.some((ac) => ac.id === c.id) || c.uiState === "error")
      );

      // Clear source text if all candidates were processed successfully
      if (candidates.every((c) => c.uiState !== "error")) {
        setSourceText("");
      }
    } catch (error) {
      setError("Failed to process generation");
      logger.error("Processing error:", error);
    } finally {
      setIsBulkSaving(false);
    }
  }, [candidates]);

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
