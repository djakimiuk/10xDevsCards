import { SourceTextInput } from "./SourceTextInput";
import { GenerationStatus } from "./GenerationStatus";
import { CandidateReviewList } from "./CandidateReviewList";
import { BulkSaveActions } from "./BulkSaveActions";
import { useGenerationProcess } from "./hooks/useGenerationProcess";

export function GenerateView() {
  const {
    sourceText,
    setSourceText,
    validationError,
    isLoading,
    isBulkSaving,
    error,
    candidates,
    startGeneration,
    markForAcceptance,
    updateCandidate,
    markForRejection,
    setCandidateToEdit,
    cancelEdit,
    saveAllMarkedCandidates,
    saveOnlyAcceptedCandidates,
  } = useGenerationProcess();

  return (
    <div className="space-y-6">
      <SourceTextInput
        value={sourceText}
        onValueChange={setSourceText}
        onGenerateSubmit={startGeneration}
        isLoading={isLoading}
        validationError={validationError}
        charCount={sourceText.length}
      />

      {(isLoading || error) && <GenerationStatus isLoading={isLoading} errorMessage={error} />}

      {candidates.length > 0 && (
        <>
          <CandidateReviewList
            candidates={candidates}
            onMarkForAcceptance={markForAcceptance}
            onEdit={updateCandidate}
            onMarkForRejection={markForRejection}
            onSetToEdit={setCandidateToEdit}
            onCancelEdit={cancelEdit}
          />

          <BulkSaveActions
            onSaveAll={saveAllMarkedCandidates}
            onSaveAccepted={saveOnlyAcceptedCandidates}
            isBulkSaving={isBulkSaving}
            canSave={candidates.length > 0}
            isGenerating={isLoading}
          />
        </>
      )}
    </div>
  );
}
