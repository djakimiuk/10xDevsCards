import type { CandidateViewModel, UpdateAICandidateFlashcardCommand } from "@/types";
import { CandidateCard } from "./CandidateCard";

interface CandidateReviewListProps {
  candidates: CandidateViewModel[];
  onMarkForAcceptance: (candidateId: string) => void;
  onEdit: (candidateId: string, data: UpdateAICandidateFlashcardCommand) => void;
  onMarkForRejection: (candidateId: string) => void;
  onSetToEdit: (candidateId: string) => void;
  onCancelEdit: (candidateId: string) => void;
}

export function CandidateReviewList({
  candidates,
  onMarkForAcceptance,
  onEdit,
  onMarkForRejection,
  onSetToEdit,
  onCancelEdit,
}: CandidateReviewListProps) {
  return (
    <div className="space-y-4" data-test-id="candidate-review-list">
      <h2 className="text-xl font-semibold">Review Generated Flashcards</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-test-id="candidates-grid">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onMarkForAcceptance={onMarkForAcceptance}
            onEdit={onEdit}
            onMarkForRejection={onMarkForRejection}
            onSetToEdit={onSetToEdit}
            onCancelEdit={onCancelEdit}
          />
        ))}
      </div>
    </div>
  );
}
