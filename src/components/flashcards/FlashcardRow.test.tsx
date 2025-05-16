import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FlashcardRow } from "./FlashcardRow";
import type { FlashcardDTO } from "@/types";

const mockFlashcard: FlashcardDTO = {
  id: "1",
  front: "Test Front",
  back: "Test Back",
  source: "MANUAL",
  created_at: "2024-01-01T00:00:00Z",
};

describe("FlashcardRow", () => {
  it("should render flashcard content correctly", () => {
    render(<FlashcardRow flashcard={mockFlashcard} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText(mockFlashcard.front)).toBeInTheDocument();
    expect(screen.getByText(mockFlashcard.back)).toBeInTheDocument();
  });

  it("should call onEdit when edit button is clicked", () => {
    const handleEdit = vi.fn();
    render(<FlashcardRow flashcard={mockFlashcard} onEdit={handleEdit} onDelete={vi.fn()} />);

    const editButton = screen.getByTitle("Edit flashcard");
    fireEvent.click(editButton);

    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it("should call onDelete when delete button is clicked", () => {
    const handleDelete = vi.fn();
    render(<FlashcardRow flashcard={mockFlashcard} onEdit={vi.fn()} onDelete={handleDelete} />);

    const deleteButton = screen.getByTitle("Delete flashcard");
    fireEvent.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it("should apply correct styles to the content", () => {
    render(<FlashcardRow flashcard={mockFlashcard} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const frontContent = screen.getByText(mockFlashcard.front).closest("div");
    const backContent = screen.getByText(mockFlashcard.back).closest("div");

    expect(frontContent).toHaveClass("whitespace-pre-wrap", "font-mono", "text-sm", "bg-muted", "p-2", "rounded-md");
    expect(backContent).toHaveClass("whitespace-pre-wrap", "font-mono", "text-sm", "bg-muted", "p-2", "rounded-md");
  });

  it("should have destructive styling for delete button", () => {
    render(<FlashcardRow flashcard={mockFlashcard} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const deleteButton = screen.getByTitle("Delete flashcard");
    expect(deleteButton).toHaveClass("text-destructive");
  });
});
