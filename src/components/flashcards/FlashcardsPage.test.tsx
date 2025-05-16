import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardsPage } from "./FlashcardsPage";
import { useFlashcards } from "./hooks/useFlashcards";
import type { FlashcardDTO } from "@/types";
import userEvent from "@testing-library/user-event";

// Mock the useFlashcards hook
vi.mock("./hooks/useFlashcards");

const mockFlashcards: FlashcardDTO[] = [
  {
    id: "1",
    front: "Test Front 1",
    back: "Test Back 1",
    source: "MANUAL",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    front: "Test Front 2",
    back: "Test Back 2",
    source: "MANUAL",
    created_at: "2024-01-02T00:00:00Z",
  },
];

describe("FlashcardsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should show loading state", () => {
    vi.mocked(useFlashcards).mockReturnValue({
      flashcards: [],
      isLoading: true,
      error: null,
      fetchFlashcards: vi.fn(),
      updateFlashcard: vi.fn(),
      deleteFlashcard: vi.fn(),
    });

    render(<FlashcardsPage />);
    expect(screen.getByRole("status", { name: /ładowanie fiszek/i })).toBeInTheDocument();
  });

  it("should show error state", () => {
    const errorMessage = "Błąd ładowania fiszek";
    vi.mocked(useFlashcards).mockReturnValue({
      flashcards: [],
      isLoading: false,
      error: errorMessage,
      fetchFlashcards: vi.fn(),
      updateFlashcard: vi.fn(),
      deleteFlashcard: vi.fn(),
    });

    render(<FlashcardsPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(errorMessage);
  });

  it("should render list of flashcards", () => {
    vi.mocked(useFlashcards).mockReturnValue({
      flashcards: mockFlashcards,
      isLoading: false,
      error: null,
      fetchFlashcards: vi.fn(),
      updateFlashcard: vi.fn(),
      deleteFlashcard: vi.fn(),
    });

    render(<FlashcardsPage />);

    mockFlashcards.forEach((flashcard) => {
      expect(screen.getByTestId(`flashcard-front-${flashcard.id}`)).toHaveTextContent(flashcard.front);
      expect(screen.getByTestId(`flashcard-back-${flashcard.id}`)).toHaveTextContent(flashcard.back);
    });
  });

  it("should fetch flashcards on mount", () => {
    const fetchFlashcards = vi.fn();
    vi.mocked(useFlashcards).mockReturnValue({
      flashcards: mockFlashcards,
      isLoading: false,
      error: null,
      fetchFlashcards,
      updateFlashcard: vi.fn(),
      deleteFlashcard: vi.fn(),
    });

    render(<FlashcardsPage />);
    expect(fetchFlashcards).toHaveBeenCalled();
  });

  it("should handle delete operation", async () => {
    const deleteFlashcard = vi.fn();
    const user = userEvent.setup();

    vi.mocked(useFlashcards).mockReturnValue({
      flashcards: mockFlashcards,
      isLoading: false,
      error: null,
      fetchFlashcards: vi.fn(),
      updateFlashcard: vi.fn(),
      deleteFlashcard,
    });

    render(<FlashcardsPage />);

    // Click delete button
    const deleteButton = screen.getAllByRole("button", { name: "Usuń fiszkę" })[0];
    await user.click(deleteButton);

    // Verify that the delete function was called
    expect(deleteFlashcard).toHaveBeenCalledWith(mockFlashcards[0].id);
  });

  it("should handle update operation", async () => {
    const updateFlashcard = vi.fn();
    const user = userEvent.setup();

    vi.mocked(useFlashcards).mockReturnValue({
      flashcards: mockFlashcards,
      isLoading: false,
      error: null,
      fetchFlashcards: vi.fn(),
      updateFlashcard,
      deleteFlashcard: vi.fn(),
    });

    render(<FlashcardsPage />);

    // Click edit button
    const editButton = screen.getAllByRole("button", { name: "Edytuj fiszkę" })[0];
    await user.click(editButton);

    // Verify that the update function was called
    expect(updateFlashcard).toHaveBeenCalledWith(mockFlashcards[0]);
  });
});
