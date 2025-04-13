import { render, screen, fireEvent } from "@testing-library/react";
import { CandidateCard } from "../CandidateCard";
import type { CandidateViewModel } from "../hooks/useGenerationProcess";

describe("CandidateCard", () => {
  const mockCandidate: CandidateViewModel = {
    id: "1",
    requestId: "req1",
    front: "Test front",
    back: "Test back",
    createdAt: "2024-03-20T12:00:00Z",
    uiState: "idle",
  };

  const defaultProps = {
    candidate: mockCandidate,
    onMarkForAcceptance: jest.fn(),
    onEdit: jest.fn(),
    onMarkForRejection: jest.fn(),
    onSetToEdit: jest.fn(),
    onCancelEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders candidate content correctly", () => {
    render(<CandidateCard {...defaultProps} />);

    expect(screen.getByText("Test front")).toBeInTheDocument();
    expect(screen.getByText("Test back")).toBeInTheDocument();
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });

  it("shows edit form when in editing state", () => {
    const editingCandidate = {
      ...mockCandidate,
      uiState: "editing" as const,
      editData: { front: "Edit front", back: "Edit back" },
    };

    render(<CandidateCard {...defaultProps} candidate={editingCandidate} />);

    expect(screen.getByDisplayValue("Edit front")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Edit back")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onMarkForAcceptance when accept button is clicked", () => {
    render(<CandidateCard {...defaultProps} />);

    const acceptButton = screen.getByRole("button", { name: /accept/i });
    fireEvent.click(acceptButton);

    expect(defaultProps.onMarkForAcceptance).toHaveBeenCalledWith(mockCandidate.id);
  });

  it("shows confirmation dialog when reject button is clicked", () => {
    render(<CandidateCard {...defaultProps} />);

    const rejectButton = screen.getByRole("button", { name: /reject/i });
    fireEvent.click(rejectButton);

    expect(screen.getByText(/are you sure you want to reject this flashcard/i)).toBeInTheDocument();
  });

  it("calls onMarkForRejection when rejection is confirmed", () => {
    render(<CandidateCard {...defaultProps} />);

    const rejectButton = screen.getByRole("button", { name: /reject/i });
    fireEvent.click(rejectButton);

    const confirmButton = screen.getByRole("button", { name: /reject/i });
    fireEvent.click(confirmButton);

    expect(defaultProps.onMarkForRejection).toHaveBeenCalledWith(mockCandidate.id);
  });

  it("calls onSetToEdit when edit button is clicked", () => {
    render(<CandidateCard {...defaultProps} />);

    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    expect(defaultProps.onSetToEdit).toHaveBeenCalledWith(mockCandidate.id);
  });

  it("disables buttons when card is in saving state", () => {
    const savingCandidate = { ...mockCandidate, uiState: "saving" as const };
    render(<CandidateCard {...defaultProps} candidate={savingCandidate} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("shows error message when in error state", () => {
    const errorCandidate = {
      ...mockCandidate,
      uiState: "error" as const,
      errorMessage: "Failed to save changes",
    };

    render(<CandidateCard {...defaultProps} candidate={errorCandidate} />);

    expect(screen.getByText("Failed to save changes")).toBeInTheDocument();
  });

  it("shows acceptance status when marked for acceptance", () => {
    const acceptedCandidate = {
      ...mockCandidate,
      uiState: "marked_for_acceptance" as const,
    };

    render(<CandidateCard {...defaultProps} candidate={acceptedCandidate} />);

    expect(screen.getByText("Marked for acceptance")).toBeInTheDocument();
  });

  it("shows rejection status when marked for rejection", () => {
    const rejectedCandidate = {
      ...mockCandidate,
      uiState: "marked_for_rejection" as const,
    };

    render(<CandidateCard {...defaultProps} candidate={rejectedCandidate} />);

    expect(screen.getByText("Marked for rejection")).toBeInTheDocument();
  });
});
