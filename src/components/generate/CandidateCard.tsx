import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditCandidateForm } from "./EditCandidateForm.tsx";
import type { CandidateViewModel } from "@/types";
import type { UpdateAICandidateFlashcardCommand } from "@/types";
import { CheckIcon, XIcon, PencilIcon } from "lucide-react";

interface CandidateCardProps {
  candidate: CandidateViewModel;
  onMarkForAcceptance: (candidateId: string) => void;
  onEdit: (candidateId: string, data: UpdateAICandidateFlashcardCommand) => void;
  onMarkForRejection: (candidateId: string) => void;
  onSetToEdit: (candidateId: string) => void;
  onCancelEdit: (candidateId: string) => void;
}

export function CandidateCard({
  candidate,
  onMarkForAcceptance,
  onEdit,
  onMarkForRejection,
  onSetToEdit,
  onCancelEdit,
}: CandidateCardProps) {
  const [isConfirmingReject, setIsConfirmingReject] = useState(false);

  const isAccepted = candidate.uiState === "marked_for_acceptance";
  const isRejected = candidate.uiState === "marked_for_rejection";
  const isEditing = candidate.uiState === "editing";
  const isSaving = candidate.uiState === "saving" || candidate.uiState === "saving_edit";
  const isSaved = candidate.uiState === "saved";
  const hasError = candidate.uiState === "error";

  const handleAcceptClick = () => {
    if (!isSaving && !isSaved) {
      onMarkForAcceptance(candidate.id);
    }
  };

  const handleRejectClick = () => {
    if (!isSaving && !isSaved) {
      setIsConfirmingReject(true);
    }
  };

  const handleConfirmReject = () => {
    onMarkForRejection(candidate.id);
    setIsConfirmingReject(false);
  };

  const handleEditClick = () => {
    if (!isSaving && !isSaved) {
      onSetToEdit(candidate.id);
    }
  };

  const formattedDate = new Date(candidate.createdAt).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Card
      className={`relative ${isSaved || isRejected ? "opacity-50" : ""}`}
      data-test-id={`candidate-card-${candidate.id}`}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Fiszka
          {(isAccepted || isRejected || isSaved) && (
            <span
              className={`text-sm font-normal ${isRejected ? "text-destructive" : ""}`}
              data-test-id={`candidate-status-${candidate.id}`}
            >
              {isAccepted && "Zaakceptowana"}
              {isRejected && "Odrzucona"}
              {isSaved && "Zapisana"}
            </span>
          )}
        </CardTitle>
        <CardDescription>Utworzono: {formattedDate}</CardDescription>
      </CardHeader>

      {isEditing ? (
        <EditCandidateForm
          initialData={
            candidate.editData || {
              front: candidate.front,
              back: candidate.back,
              explanation: candidate.explanation,
            }
          }
          onSubmit={(data: UpdateAICandidateFlashcardCommand) => onEdit(candidate.id, data)}
          onCancel={() => onCancelEdit(candidate.id)}
          isSaving={candidate.uiState === "saving_edit"}
        />
      ) : (
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Przód</h3>
            <pre
              className="whitespace-pre-wrap font-mono text-sm bg-muted p-2 rounded-md"
              data-test-id={`candidate-front-${candidate.id}`}
            >
              {candidate.front}
            </pre>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Tył</h3>
            <pre
              className="whitespace-pre-wrap font-mono text-sm bg-muted p-2 rounded-md"
              data-test-id={`candidate-back-${candidate.id}`}
            >
              {candidate.back}
            </pre>
          </div>

          {hasError && candidate.errorMessage && (
            <Alert variant="destructive" data-test-id={`candidate-error-${candidate.id}`}>
              <AlertDescription>{candidate.errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}

      {!isEditing && (
        <CardFooter className="gap-2">
          <Button
            onClick={handleAcceptClick}
            variant={isAccepted ? "default" : "outline"}
            disabled={isSaving || isSaved || isRejected}
            className="flex-1"
            data-test-id={`candidate-accept-button-${candidate.id}`}
          >
            <CheckIcon className="w-4 h-4 mr-1" />
            {isAccepted ? "Zaakceptowana" : "Akceptuj"}
          </Button>

          <Button
            onClick={handleEditClick}
            variant="outline"
            disabled={isSaving || isSaved || isRejected}
            className="flex-1"
            data-test-id={`candidate-edit-button-${candidate.id}`}
          >
            <PencilIcon className="w-4 h-4 mr-1" />
            Edytuj
          </Button>

          <AlertDialog open={isConfirmingReject} onOpenChange={setIsConfirmingReject}>
            <AlertDialogTrigger asChild>
              <Button
                onClick={handleRejectClick}
                variant={isRejected ? "destructive" : "outline"}
                disabled={isSaving || isSaved || isRejected}
                className="flex-1"
                data-test-id={`candidate-reject-button-${candidate.id}`}
              >
                <XIcon className="w-4 h-4 mr-1" />
                {isRejected ? "Odrzucona" : "Odrzuć"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-test-id="reject-confirmation-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Odrzucić fiszkę?</AlertDialogTitle>
                <AlertDialogDescription>
                  Czy na pewno chcesz odrzucić tę fiszkę? Tę akcję można cofnąć przed zapisaniem.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsConfirmingReject(false)} data-test-id="reject-cancel-button">
                  Anuluj
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmReject} data-test-id="reject-confirm-button">
                  Odrzuć
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}
