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
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="source-text" className="text-sm font-medium">
          Source Text
        </label>
        <Textarea
          id="source-text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Paste your text here (min. 1000, max. 10000 characters)..."
          disabled={isLoading}
          className="min-h-[200px] font-mono"
        />
        <p className="text-xs text-muted-foreground">{charCount}/10000 characters</p>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <Button onClick={onGenerateSubmit} disabled={isLoading || !!validationError}>
        {isLoading ? "Generating..." : "Generate Flashcards"}
      </Button>
    </div>
  );
}
