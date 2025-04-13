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

  return (
    <Card className={`relative ${isSaved ? "opacity-50" : ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Flashcard
          {(isAccepted || isRejected) && (
            <span className="text-sm font-normal">
              {isAccepted && "Marked for acceptance"}
              {isRejected && "Marked for rejection"}
            </span>
          )}
        </CardTitle>
        <CardDescription>Created: {new Date(candidate.createdAt).toLocaleString()}</CardDescription>
      </CardHeader>

      {isEditing ? (
        <EditCandidateForm
          initialData={candidate.editData || { front: candidate.front, back: candidate.back }}
          onSubmit={(data: UpdateAICandidateFlashcardCommand) => onEdit(candidate.id, data)}
          onCancel={() => onCancelEdit(candidate.id)}
          isSaving={candidate.uiState === "saving_edit"}
        />
      ) : (
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Front</h3>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-2 rounded-md">{candidate.front}</pre>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Back</h3>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-2 rounded-md">{candidate.back}</pre>
          </div>

          {hasError && candidate.errorMessage && (
            <Alert variant="destructive">
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
            disabled={isSaving || isSaved}
            className="flex-1"
          >
            <CheckIcon className="w-4 h-4 mr-1" />
            {isAccepted ? "Accepted" : "Accept"}
          </Button>

          <Button onClick={handleEditClick} variant="outline" disabled={isSaving || isSaved} className="flex-1">
            <PencilIcon className="w-4 h-4 mr-1" />
            Edit
          </Button>

          <AlertDialog open={isConfirmingReject} onOpenChange={setIsConfirmingReject}>
            <AlertDialogTrigger asChild>
              <Button
                onClick={handleRejectClick}
                variant={isRejected ? "destructive" : "outline"}
                disabled={isSaving || isSaved}
                className="flex-1"
              >
                <XIcon className="w-4 h-4 mr-1" />
                {isRejected ? "Rejected" : "Reject"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Flashcard?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reject this flashcard? This action can be undone before saving.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsConfirmingReject(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmReject}>Reject</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}
