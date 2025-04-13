import { render, screen, fireEvent } from "@testing-library/react";
import { GenerationCandidate } from "../GenerationCandidate";
import { CandidateStatus } from "../useGenerationProcess";

describe("GenerationCandidate", () => {
  const mockOnAccept = jest.fn();
  const mockOnReject = jest.fn();

  const defaultProps = {
    candidate: {
      id: "1",
      text: "Sample candidate text",
      status: CandidateStatus.PENDING,
    },
    onAccept: mockOnAccept,
    onReject: mockOnReject,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders candidate text and action buttons", () => {
    render(<GenerationCandidate {...defaultProps} />);

    expect(screen.getByText("Sample candidate text")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("calls onAccept when accept button is clicked", () => {
    render(<GenerationCandidate {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /accept/i }));
    expect(mockOnAccept).toHaveBeenCalledWith(defaultProps.candidate.id);
  });

  it("calls onReject when reject button is clicked", () => {
    render(<GenerationCandidate {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /reject/i }));
    expect(mockOnReject).toHaveBeenCalledWith(defaultProps.candidate.id);
  });

  it("shows accepted status when candidate is accepted", () => {
    render(
      <GenerationCandidate
        {...defaultProps}
        candidate={{
          ...defaultProps.candidate,
          status: CandidateStatus.ACCEPTED,
        }}
      />
    );

    expect(screen.getByText(/accepted/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
  });

  it("shows rejected status when candidate is rejected", () => {
    render(
      <GenerationCandidate
        {...defaultProps}
        candidate={{
          ...defaultProps.candidate,
          status: CandidateStatus.REJECTED,
        }}
      />
    );

    expect(screen.getByText(/rejected/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
  });

  it("shows saved status when candidate is saved", () => {
    render(
      <GenerationCandidate
        {...defaultProps}
        candidate={{
          ...defaultProps.candidate,
          status: CandidateStatus.SAVED,
        }}
      />
    );

    expect(screen.getByText(/saved/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
  });

  it("shows error status when candidate has error", () => {
    render(
      <GenerationCandidate
        {...defaultProps}
        candidate={{
          ...defaultProps.candidate,
          status: CandidateStatus.ERROR,
          error: "Failed to save",
        }}
      />
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText("Failed to save")).toBeInTheDocument();
  });
});
