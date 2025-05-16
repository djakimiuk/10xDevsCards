import { Button } from "@/components/ui/button";

export const GenerateButton = () => {
  return (
    <a href="/generate">
      <Button variant="outline" className="flex items-center gap-2">
        <span>Wygeneruj</span>
      </Button>
    </a>
  );
};
