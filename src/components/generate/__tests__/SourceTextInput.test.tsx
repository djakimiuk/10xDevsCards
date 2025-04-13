import { render, screen, fireEvent } from "@testing-library/react";
import { SourceTextInput } from "../SourceTextInput";

describe("SourceTextInput", () => {
  const defaultProps = {
    value: "",
    onValueChange: jest.fn(),
    onGenerateSubmit: jest.fn(),
    isLoading: false,
    validationError: null,
    charCount: 0,
  };

  it("renders textarea and character count", () => {
    render(<SourceTextInput {...defaultProps} />);

    expect(screen.getByPlaceholderText("Paste your text here (1000-10000 characters)...")).toBeInTheDocument();
    expect(screen.getByText("Characters: 0 / 10000")).toBeInTheDocument();
  });

  it("calls onValueChange when text is entered", () => {
    const onValueChange = jest.fn();
    render(<SourceTextInput {...defaultProps} onValueChange={onValueChange} />);

    const textarea = screen.getByPlaceholderText("Paste your text here (1000-10000 characters)...");
    fireEvent.change(textarea, { target: { value: "test" } });

    expect(onValueChange).toHaveBeenCalledWith("test");
  });

  it("disables generate button when text is too short", () => {
    render(<SourceTextInput {...defaultProps} charCount={500} />);

    const button = screen.getByRole("button", { name: /generate flashcards/i });
    expect(button).toBeDisabled();
  });

  it("enables generate button when text length is valid", () => {
    render(<SourceTextInput {...defaultProps} charCount={1500} />);

    const button = screen.getByRole("button", { name: /generate flashcards/i });
    expect(button).not.toBeDisabled();
  });

  it("disables generate button when text is too long", () => {
    render(<SourceTextInput {...defaultProps} charCount={11000} />);

    const button = screen.getByRole("button", { name: /generate flashcards/i });
    expect(button).toBeDisabled();
  });

  it("shows validation error when provided", () => {
    const error = "Text is too short";
    render(<SourceTextInput {...defaultProps} validationError={error} />);

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it("disables textarea and button when loading", () => {
    render(<SourceTextInput {...defaultProps} isLoading={true} />);

    const textarea = screen.getByPlaceholderText("Paste your text here (1000-10000 characters)...");
    const button = screen.getByRole("button", { name: /generating\.\.\./i });

    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it("calls onGenerateSubmit when button is clicked", () => {
    const onGenerateSubmit = jest.fn();
    render(<SourceTextInput {...defaultProps} charCount={1500} onGenerateSubmit={onGenerateSubmit} />);

    const button = screen.getByRole("button", { name: /generate flashcards/i });
    fireEvent.click(button);

    expect(onGenerateSubmit).toHaveBeenCalled();
  });
});
