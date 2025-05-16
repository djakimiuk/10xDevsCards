import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EditFlashcardModal } from "./EditFlashcardModal";
import type { FlashcardDTO } from "@/types";

describe("EditFlashcardModal", () => {
  // Test data setup
  const mockFlashcard: FlashcardDTO = {
    id: "1",
    front: "Test Front",
    back: "Test Back",
    source: "MANUAL",
    created_at: "2024-01-01T00:00:00Z",
  };

  // Common test utilities
  const renderModal = ({
    flashcard = mockFlashcard,
    onSave = vi.fn(),
    onClose = vi.fn(),
    error = undefined,
  }: {
    flashcard?: FlashcardDTO | null | undefined;
    onSave?: (flashcard: FlashcardDTO) => Promise<void>;
    onClose?: () => void;
    error?: string | undefined;
  } = {}) => {
    return {
      user: userEvent.setup(),
      ...render(<EditFlashcardModal flashcard={flashcard} onSave={onSave} onClose={onClose} error={error} />),
    };
  };

  // Helper functions
  const getFormElements = () => {
    const dialog = screen.getByRole("dialog", { name: "Edytuj fiszkę" });
    return {
      dialog,
      frontInput: within(dialog).getByRole("textbox", { name: "Przód" }),
      backInput: within(dialog).getByRole("textbox", { name: "Tył" }),
      saveButton: within(dialog).getByText("Zapisz"),
      cancelButton: within(dialog).getByText("Anuluj"),
    };
  };

  describe("Rendering", () => {
    it("should not render when flashcard is null", () => {
      renderModal({ flashcard: null });
      expect(screen.queryByRole("dialog", { name: "Edytuj fiszkę" })).not.toBeInTheDocument();
    });

    it("should render with flashcard data", () => {
      renderModal();
      const { frontInput, backInput } = getFormElements();
      expect(frontInput).toHaveValue("Test Front");
      expect(backInput).toHaveValue("Test Back");
    });

    it("should show character count", async () => {
      const { user } = renderModal();
      const { frontInput, backInput } = getFormElements();

      await user.clear(frontInput);
      await user.type(frontInput, "abc");
      await user.clear(backInput);
      await user.type(backInput, "def");

      const characterCounts = screen.getAllByText(/\d+\/500 znaków/);
      expect(characterCounts).toHaveLength(2);
      expect(characterCounts[0]).toHaveTextContent("3/500 znaków");
      expect(characterCounts[1]).toHaveTextContent("3/500 znaków");
    });
  });

  describe("Validation", () => {
    it("should show validation error when front is empty", async () => {
      const onClose = vi.fn();
      const { user } = renderModal({ onClose });
      const { frontInput, saveButton } = getFormElements();

      await user.clear(frontInput);

      expect(frontInput).toHaveValue("");
      expect(saveButton).toBeDisabled();
    });

    it("should validate character limits", async () => {
      const { user } = renderModal();
      const { frontInput } = getFormElements();

      const longText = "a".repeat(501);
      await user.clear(frontInput);
      await user.type(frontInput, longText);

      expect(frontInput).toHaveValue("a".repeat(500));
    }, 10000); // Zwiększamy timeout do 10s
  });

  describe("Form Submission", () => {
    it("should call onSave with trimmed values when form is valid", async () => {
      const handleSave = vi.fn().mockResolvedValue(undefined);
      const { user } = renderModal({ onSave: handleSave });
      const { frontInput, backInput, saveButton } = getFormElements();

      await user.clear(frontInput);
      await user.type(frontInput, "  Updated Front  ");
      await user.clear(backInput);
      await user.type(backInput, "  Updated Back  ");
      await user.click(saveButton);

      await vi.waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith({
          ...mockFlashcard,
          front: "Updated Front",
          back: "Updated Back",
        });
      });
    });

    it("should show loading state while saving", async () => {
      const handleSave = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      const { user } = renderModal({ onSave: handleSave });
      const { frontInput, backInput, saveButton, cancelButton } = getFormElements();

      await user.click(saveButton);

      expect(screen.getByText("Zapisywanie...")).toBeInTheDocument();
      expect(frontInput).toBeDisabled();
      expect(backInput).toBeDisabled();
      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();

      await vi.waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(mockFlashcard);
      });
    });

    it("should handle save error", async () => {
      const onClose = vi.fn();
      const onSave = vi.fn().mockRejectedValue(new Error("Nie udało się zaktualizować fiszki"));
      const { user } = renderModal({
        onClose,
        onSave,
      });

      const { saveButton } = getFormElements();
      await user.click(saveButton);

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByText("Nie udało się zaktualizować fiszki")).toBeInTheDocument();
    });
  });

  describe("Modal Interaction", () => {
    it("should call onClose when cancel button is clicked", async () => {
      const onClose = vi.fn();
      const { user } = renderModal({ onClose });
      const { cancelButton } = getFormElements();

      await user.click(cancelButton);
      expect(onClose).toHaveBeenCalled();
    });

    it("should disable form controls while saving", async () => {
      const onSave = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      renderModal({ onSave });
      const { frontInput, backInput, saveButton, cancelButton } = getFormElements();

      await userEvent.click(saveButton);

      expect(frontInput).toBeDisabled();
      expect(backInput).toBeDisabled();
      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();

      await vi.waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });
});
