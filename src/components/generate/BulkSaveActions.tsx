import { Button } from "@/components/ui/button";
import { SaveIcon, CheckSquareIcon } from "lucide-react";

interface BulkSaveActionsProps {
  onSaveAll: () => void;
  onSaveAccepted: () => void;
  isBulkSaving: boolean;
  canSave: boolean;
  isGenerating: boolean;
}

export function BulkSaveActions({
  onSaveAll,
  onSaveAccepted,
  isBulkSaving,
  canSave,
  isGenerating,
}: BulkSaveActionsProps) {
  const isDisabled = !canSave || isBulkSaving || isGenerating;

  return (
    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t" data-test-id="bulk-save-actions">
      <Button onClick={onSaveAll} disabled={isDisabled} className="flex-1" data-test-id="save-all-button">
        <SaveIcon className="w-4 h-4 mr-2" />
        {isBulkSaving ? "Saving..." : "Save All"}
      </Button>
      <Button
        onClick={onSaveAccepted}
        disabled={isDisabled}
        variant="outline"
        className="flex-1"
        data-test-id="save-accepted-button"
      >
        <CheckSquareIcon className="w-4 h-4 mr-2" />
        {isBulkSaving ? "Saving..." : "Save Accepted"}
      </Button>
    </div>
  );
}
