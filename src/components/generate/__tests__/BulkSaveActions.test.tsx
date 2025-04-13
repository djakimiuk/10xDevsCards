import { render, screen, fireEvent } from "@testing-library/react";
import { BulkSaveActions } from "../BulkSaveActions";

describe("BulkSaveActions", () => {
  const mockOnSaveAll = jest.fn();
  const mockOnClearAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders save and clear buttons", () => {
    render(
      <BulkSaveActions
        hasMarkedCandidates={true}
        isSaving={false}
        onSaveAll={mockOnSaveAll}
        onClearAll={mockOnClearAll}
      />
    );

    expect(screen.getByText("Save All Marked")).toBeInTheDocument();
    expect(screen.getByText("Clear All Marks")).toBeInTheDocument();
  });

  it("disables buttons when no candidates are marked", () => {
    render(
      <BulkSaveActions
        hasMarkedCandidates={false}
        isSaving={false}
        onSaveAll={mockOnSaveAll}
        onClearAll={mockOnClearAll}
      />
    );

    expect(screen.getByText("Save All Marked")).toBeDisabled();
    expect(screen.getByText("Clear All Marks")).toBeDisabled();
  });

  it("disables buttons when saving is in progress", () => {
    render(
      <BulkSaveActions
        hasMarkedCandidates={true}
        isSaving={true}
        onSaveAll={mockOnSaveAll}
        onClearAll={mockOnClearAll}
      />
    );

    expect(screen.getByText("Save All Marked")).toBeDisabled();
    expect(screen.getByText("Clear All Marks")).toBeDisabled();
  });

  it("calls onSaveAll when save button is clicked", () => {
    render(
      <BulkSaveActions
        hasMarkedCandidates={true}
        isSaving={false}
        onSaveAll={mockOnSaveAll}
        onClearAll={mockOnClearAll}
      />
    );

    fireEvent.click(screen.getByText("Save All Marked"));
    expect(mockOnSaveAll).toHaveBeenCalledTimes(1);
  });

  it("calls onClearAll when clear button is clicked", () => {
    render(
      <BulkSaveActions
        hasMarkedCandidates={true}
        isSaving={false}
        onSaveAll={mockOnSaveAll}
        onClearAll={mockOnClearAll}
      />
    );

    fireEvent.click(screen.getByText("Clear All Marks"));
    expect(mockOnClearAll).toHaveBeenCalledTimes(1);
  });

  it("shows loading state when saving", () => {
    render(
      <BulkSaveActions
        hasMarkedCandidates={true}
        isSaving={true}
        onSaveAll={mockOnSaveAll}
        onClearAll={mockOnClearAll}
      />
    );

    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });
});
