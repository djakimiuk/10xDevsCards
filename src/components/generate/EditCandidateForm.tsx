import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UpdateAICandidateFlashcardCommand } from "@/types";

interface EditCandidateFormProps {
  initialData: UpdateAICandidateFlashcardCommand;
  onSubmit: (data: UpdateAICandidateFlashcardCommand) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function EditCandidateForm({ initialData, onSubmit, onCancel, isSaving }: EditCandidateFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const validateForm = (data: UpdateAICandidateFlashcardCommand): string | null => {
    if (data.front.length === 0) return "Front side cannot be empty";
    if (data.front.length > 200) return "Front side cannot be longer than 200 characters";
    if (data.back.length === 0) return "Back side cannot be empty";
    if (data.back.length > 500) return "Back side cannot be longer than 500 characters";
    return null;
  };

  const handleSubmit = () => {
    const error = validateForm(formData);
    if (error) {
      setValidationError(error);
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-2">
        <label htmlFor="front" className="text-sm font-medium">
          Front
        </label>
        <Textarea
          id="front"
          value={formData.front}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, front: e.target.value }));
            setValidationError(null);
          }}
          placeholder="Enter front side content..."
          disabled={isSaving}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">{formData.front.length}/200 characters</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="back" className="text-sm font-medium">
          Back
        </label>
        <Textarea
          id="back"
          value={formData.back}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, back: e.target.value }));
            setValidationError(null);
          }}
          placeholder="Enter back side content..."
          disabled={isSaving}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">{formData.back.length}/500 characters</p>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
