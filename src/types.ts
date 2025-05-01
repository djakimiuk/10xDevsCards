// Import typowane definicje z modelu bazy danych
import type { Tables } from "./db/database.types";

// Aliasy dla rzędów bazodanowych z poszczególnych tabel, ułatwiające wykorzystanie typów
type FlashcardRow = Tables<"flashcards">;
type GenerationRequestRow = Tables<"generation_requests">;
type AICandidateFlashcardRow = Tables<"ai_candidate_flashcards">;

/* **********************************************************************
 * DTO i Command Modele dla Flashcards
 * **********************************************************************/

// Dodajemy dedykowany typ dla pola source
export type FlashcardSource = "AI" | "MANUAL";

// DTO reprezentujące pojedynczą fiszkę
export interface FlashcardDTO
  extends Omit<Pick<FlashcardRow, "id" | "front" | "back" | "source" | "created_at">, "source"> {
  source: FlashcardSource;
}

// Command Models
export type CreateFlashcardCommand = Pick<FlashcardRow, "front" | "back">;
export type UpdateFlashcardCommand = Pick<FlashcardRow, "front" | "back">;

/* **********************************************************************
 * DTO i Command Modele dla Generation Requests
 * **********************************************************************/

export type GenerationRequestDTO = GenerationRequestRow;
export type CreateGenerationRequestCommand = Pick<GenerationRequestRow, "source_text">;

/* **********************************************************************
 * DTO i Command Modele dla AI Candidate Flashcards
 * **********************************************************************/

export type AICandidateFlashcardDTO = AICandidateFlashcardRow;

export interface UpdateAICandidateFlashcardCommand {
  front: string;
  back: string;
  explanation: string;
}

export type AcceptAICandidateFlashcardCommand = Record<string, never>;

/* **********************************************************************
 * DTO dla odpowiedzi paginowanych list
 * **********************************************************************/

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
}

export interface GetFlashcardsResponseDTO {
  flashcards: FlashcardDTO[];
  pagination: PaginationDTO;
}

export interface GetGenerationRequestsResponseDTO {
  generationRequests: GenerationRequestDTO[];
  pagination: PaginationDTO;
}

export interface GetAICandidatesResponseDTO {
  aiCandidates: AICandidateFlashcardDTO[];
}

/* **********************************************************************
 * View Models dla komponentów
 * **********************************************************************/

export type CandidateUIState =
  | "idle"
  | "editing"
  | "saving_edit"
  | "marked_for_acceptance"
  | "marked_for_rejection"
  | "saving"
  | "saved"
  | "rejected"
  | "error";

export interface CandidateViewModel {
  id: string;
  requestId: string;
  front: string;
  back: string;
  confidence: number;
  explanation: string;
  createdAt: string;
  uiState: CandidateUIState;
  editData: UpdateAICandidateFlashcardCommand | null;
  errorMessage: string | null;
}

export type EventHandler = (payload: unknown) => void;
