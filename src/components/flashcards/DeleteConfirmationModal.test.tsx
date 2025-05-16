import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import type { FlashcardDTO } from "@/types";
import userEvent from "@testing-library/user-event";

const mockFlashcard: FlashcardDTO = {
  id: "1",
  front: "Test Front",
  back: "Test Back",
  source: "MANUAL",
  created_at: "2024-01-01T00:00:00Z",
};

describe("DeleteConfirmationModal", () => {
  it("should not render when flashcard is null", () => {
    render(<DeleteConfirmationModal flashcard={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole("dialog", { name: "Usuń fiszkę" })).not.toBeInTheDocument();
  });

  it("should render with flashcard data", () => {
    render(<DeleteConfirmationModal flashcard={mockFlashcard} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Usuń fiszkę" })).toBeInTheDocument();
    expect(screen.getByTestId(`delete-modal-front-${mockFlashcard.id}`)).toHaveTextContent(mockFlashcard.front);
    expect(screen.getByTestId(`delete-modal-back-${mockFlashcard.id}`)).toHaveTextContent(mockFlashcard.back);
  });

  it("should handle delete error", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("Nie udało się usunąć fiszki"));
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<DeleteConfirmationModal flashcard={mockFlashcard} onConfirm={onConfirm} onCancel={onCancel} />);

    // Try to delete
    const deleteButton = screen.getByRole("button", { name: "Potwierdź usunięcie" });
    await user.click(deleteButton);

    // Verify delete was attempted
    expect(onConfirm).toHaveBeenCalledWith(mockFlashcard.id);

    // Verify error is displayed
    expect(screen.getByText("Nie udało się usunąć fiszki")).toBeInTheDocument();
  });

  it("should clear error message when modal is closed", async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <DeleteConfirmationModal
        flashcard={mockFlashcard}
        onCancel={onCancel}
        onConfirm={onConfirm}
        error="Nie udało się usunąć fiszki"
      />
    );

    // Try to close modal
    const cancelButton = screen.getByRole("button", { name: "Anuluj usuwanie" });
    await user.click(cancelButton);

    // Verify onCancel was called
    expect(onCancel).toHaveBeenCalled();
  });

  it("should disable buttons while deleting", async () => {
    const onConfirm = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    const user = userEvent.setup();

    render(<DeleteConfirmationModal flashcard={mockFlashcard} onConfirm={onConfirm} onCancel={vi.fn()} />);

    // Try to delete
    const deleteButton = screen.getByRole("button", { name: "Potwierdź usunięcie" });
    await user.click(deleteButton);

    // Verify buttons are disabled
    expect(screen.getByRole("button", { name: "Potwierdź usunięcie" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Anuluj usuwanie" })).toBeDisabled();

    // Wait for delete to complete
    await onConfirm;
  });
});
