import { Button } from "@/components/ui/button";

export const FlashcardsButton = () => {
  return (
    <a href="/flashcards">
      <Button variant="outline" className="flex items-center gap-2">
        <span>Fiszki</span>
      </Button>
    </a>
  );
};
