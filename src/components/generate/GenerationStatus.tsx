import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface GenerationStatusProps {
  isLoading: boolean;
  errorMessage: string | null;
}

export function GenerationStatus({ isLoading, errorMessage }: GenerationStatusProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" data-test-id="generation-loading">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Alert variant="destructive" data-test-id="generation-error">
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
