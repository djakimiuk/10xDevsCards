import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SourceTextInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onGenerateSubmit: () => void;
  isLoading: boolean;
  validationError: string | null;
  charCount: number;
}

export function SourceTextInput({
  value,
  onValueChange,
  onGenerateSubmit,
  isLoading,
  validationError,
  charCount,
}: SourceTextInputProps) {
  return (
    <div className="space-y-4" data-test-id="source-text-container">
      <div className="space-y-2">
        <label htmlFor="source-text" className="text-sm font-medium">
          Tekst źródłowy
        </label>
        <Textarea
          id="source-text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Wklej swój tekst tutaj (min. 100, max. 10000 znaków)..."
          disabled={isLoading}
          className="min-h-[200px] font-mono"
          data-test-id="source-text-input"
        />
        <p className="text-xs text-muted-foreground" data-test-id="character-count">
          {charCount}/10000 znaków
        </p>
      </div>

      {validationError && (
        <Alert variant="destructive" data-test-id="source-text-error">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <Button onClick={onGenerateSubmit} disabled={isLoading || !!validationError} data-test-id="generate-button">
        {isLoading ? "Generowanie..." : "Wygeneruj fiszki"}
      </Button>
    </div>
  );
}
