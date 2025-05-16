import { useCallback } from "react";
import type { FlashcardDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";

interface FlashcardRowProps {
  flashcard: FlashcardDTO;
  onEdit: () => void;
  onDelete: () => void;
}

export function FlashcardRow({ flashcard, onEdit, onDelete }: FlashcardRowProps) {
  const handleEdit = useCallback(() => {
    onEdit();
  }, [onEdit]);

  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  const formattedDate = new Date(flashcard.created_at).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Flashcard</CardTitle>
            <p className="text-sm text-muted-foreground">Created: {formattedDate}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleEdit} title="Edit flashcard">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
              title="Delete flashcard"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Front</h3>
          <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-2 rounded-md">{flashcard.front}</div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Back</h3>
          <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-2 rounded-md">{flashcard.back}</div>
        </div>
      </CardContent>
    </Card>
  );
}
