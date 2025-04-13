import { render, screen } from "@testing-library/react";
import { GenerationStatus } from "../GenerationStatus";

describe("GenerationStatus", () => {
  it("renders loading state with skeletons", () => {
    render(<GenerationStatus isLoading={true} errorMessage={null} />);

    // Sprawdzamy, czy są 3 elementy skeleton
    const skeletons = document.querySelectorAll(".h-4");
    expect(skeletons).toHaveLength(3);
  });

  it("renders error message when provided", () => {
    const errorMessage = "Failed to generate flashcards";
    render(<GenerationStatus isLoading={false} errorMessage={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("renders nothing when not loading and no error", () => {
    const { container } = render(<GenerationStatus isLoading={false} errorMessage={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("prioritizes loading state over error message", () => {
    const errorMessage = "Failed to generate flashcards";
    const { container } = render(<GenerationStatus isLoading={true} errorMessage={errorMessage} />);

    // Sprawdzamy, czy są skeletony
    const skeletons = container.querySelectorAll(".h-4");
    expect(skeletons).toHaveLength(3);

    // Sprawdzamy, czy nie ma komunikatu błędu
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });
});
