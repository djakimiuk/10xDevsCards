import { FlashcardsService } from "./flashcards.service";
import { FlashcardGeneratorService } from "./flashcard-generator.service";
import { OpenRouterService } from "./openrouter.service";

export const initializeServices = (locals: App.Locals) => {
  const openRouter = new OpenRouterService();
  const generator = new FlashcardGeneratorService(openRouter, locals.supabase);
  return new FlashcardsService(locals.supabase, generator);
};
