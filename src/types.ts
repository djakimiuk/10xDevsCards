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

// DTO reprezentujące pojedynczą fiszkę, zwracane np. przy pobieraniu listy fiszek.
// Zawiera najważniejsze pola wymagane przez API: id, front, back, source oraz created_at.
// Zmieniamy typ pola "source" na FlashcardSource.
export type FlashcardDTO = Omit<Pick<FlashcardRow, "id" | "front" | "back" | "source" | "created_at">, "source"> & {
  source: FlashcardSource;
};

// Command Model służący do tworzenia nowej fiszki (POST /api/flashcards).
// Przyjmuje jedynie pola "front" i "back"; "source" (np. "MANUAL") ustala serwer.
export type CreateFlashcardCommand = Pick<FlashcardRow, "front" | "back">;

// Command Model dla aktualizacji istniejącej fiszki (PUT /api/flashcards/{id}).
// Wymagane są pola "front" i "back".
export type UpdateFlashcardCommand = Pick<FlashcardRow, "front" | "back">;

/* **********************************************************************
 * DTO i Command Modele dla Generation Requests (Żądań generowania AI)
 * **********************************************************************/

// DTO reprezentujące żądanie generowania fiszek przez AI.
// Odpowiada całemu rekordowi żądania, zawierającemu m.in. id, source_text, status, daty oraz user_id.
export type GenerationRequestDTO = GenerationRequestRow;

// Command Model dla tworzenia żądania generowania (POST /api/generation-requests).
// Jako jedyny wymagalny parametr przyjmowane jest "source_text"; inne pola są ustalane przez backend.
export type CreateGenerationRequestCommand = Pick<GenerationRequestRow, "source_text">;

/* **********************************************************************
 * DTO i Command Modele dla AI Candidate Flashcards
 * **********************************************************************/

// DTO reprezentujące kandydatową fiszkę wygenerowaną przez AI, która oczekuje na weryfikację użytkownika.
export type AICandidateFlashcardDTO = AICandidateFlashcardRow;

// Command Model dla aktualizacji kandydatowej fiszki (PUT /api/ai-candidates/{id}).
// Umożliwia edycję pól "front", "back" i "explanation".
export type UpdateAICandidateFlashcardCommand = {
  front: string;
  back: string;
  explanation: string;
};

// Command Model dla zatwierdzania kandydatowej fiszki (POST /api/ai-candidates/{id}/accept).
// Endpoint nie wymaga dodatkowych danych, dlatego typ jest pustym obiektem.
export type AcceptAICandidateFlashcardCommand = Record<string, never>;

/* **********************************************************************
 * DTO dla odpowiedzi paginowanych list
 * **********************************************************************/

// Ujednolicony typ opisujący dane paginacyjne, wykorzystywany w listach fiszek oraz żądań generowania.
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
}

// DTO dla odpowiedzi GET /api/flashcards, zawierający listę fiszek oraz informacje paginacyjne.
export interface GetFlashcardsResponseDTO {
  flashcards: FlashcardDTO[];
  pagination: PaginationDTO;
}

// DTO dla odpowiedzi GET /api/generation-requests, zawierający listę żądań generowania oraz dane paginacyjne.
export interface GetGenerationRequestsResponseDTO {
  generationRequests: GenerationRequestDTO[];
  pagination: PaginationDTO;
}

// DTO dla odpowiedzi GET /api/ai-candidates, zawierający listę kandydatowych fiszek.
export interface GetAICandidatesResponseDTO {
  aiCandidates: AICandidateFlashcardDTO[];
}

/* **********************************************************************
 * View Models dla komponentów
 * **********************************************************************/

// Typ dla stanu UI kandydata
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

// Model widoku dla kandydata
export interface CandidateViewModel {
  id: string;
  requestId: string;
  front: string;
  back: string;
  confidence: number;
  explanation: string;
  createdAt: string;
  uiState:
    | "idle"
    | "marked_for_acceptance"
    | "marked_for_rejection"
    | "editing"
    | "saving"
    | "saving_edit"
    | "saved"
    | "rejected"
    | "error";
  editData: UpdateAICandidateFlashcardCommand | null;
  errorMessage: string | null;
}
