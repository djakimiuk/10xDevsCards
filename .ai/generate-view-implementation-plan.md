# Plan implementacji widoku: Generowanie fiszek przez AI

## 1. Przegląd

Widok "Generowanie fiszek przez AI" umożliwia zalogowanym użytkownikom wklejenie dłuższego tekstu (1000-10000 znaków), zainicjowanie procesu automatycznego generowania fiszek przez AI na jego podstawie, a następnie przeglądanie, edytowanie, akceptowanie lub odrzucanie wygenerowanych propozycji (kandydatów). Celem jest przyspieszenie procesu tworzenia materiałów do nauki. **Na koniec użytkownik może zapisać wszystkie nierozpatrzone fiszki (domyślnie jako zaakceptowane) lub tylko te, które oznaczył jako zaakceptowane.**

## 2. Routing widoku

Widok powinien być dostępny pod ścieżką `/generate` dla zalogowanych użytkowników. Implementacja będzie polegać na stworzeniu pliku strony `src/pages/generate.astro`.

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane przy użyciu React i Shadcn/ui, a następnie zintegrowane ze stroną Astro (`generate.astro`) za pomocą dyrektywy `client:visible` lub `client:load`.

```
GenerateView (Komponent React renderowany przez src/pages/generate.astro)
│
├── SourceTextInput (React)
│   ├── Textarea (Shadcn)
│   ├── Paragraph (dla licznika znaków i komunikatu walidacji)
│   └── Button (Shadcn "Generuj")
│
├── GenerationStatus (React)
│   ├── Skeleton (Shadcn - podczas ładowania)
│   └── Alert (Shadcn - dla błędów)
│
└── CandidateReviewList (React)
    └── CandidateCard[] (React - iteracja po liście kandydatów)
        ├── Card (Shadcn)
        │   ├── CardHeader (tytuł np. "Kandydat X")
        │   ├── CardContent
        │   │   ├── Paragraph (dla "Przód")
        │   │   ├── Pre/Code (dla treści przodu - zachowanie formatowania)
        │   │   ├── Paragraph (dla "Tył")
        │   │   ├── Pre/Code (dla treści tyłu - zachowanie formatowania)
        │   │   └── EditCandidateForm (React - widoczny warunkowo)
        │   │       ├── Textarea (Shadcn - dla przodu)
        │   │       ├── Textarea (Shadcn - dla tyłu)
        │   │       ├── Paragraph (dla walidacji)
        │   │       └── Div (kontener na przyciski Save/Cancel)
        │   │           ├── Button (Shadcn "Zapisz")
        │   │           └── Button (Shadcn "Anuluj", wariant "outline")
        │   └── CardFooter (kontener na przyciski akcji)
        │       ├── Button (Shadcn "Akceptuj")
        │       ├── Button (Shadcn "Edytuj", wariant "outline")
        │       └── Button (Shadcn "Odrzuć", wariant "destructive")
        └── AlertDialog (Shadcn - do potwierdzenia odrzucenia)

└── BulkSaveActions (React) **- NOWY**
    ├── Button (Shadcn "Zapisz wszystkie")
    └── Button (Shadcn "Zapisz zaakceptowane")
```

## 4. Szczegóły komponentów

### `GenerateView` (Główny komponent React)

- **Opis:** Komponent-kontener orkiestrujący stan i logikę całego widoku generowania. Zarządza procesem od wpisania tekstu, przez generowanie, po recenzję kandydatów **i ich hurtowe zapisywanie**. Wykorzystuje customowy hook `useGenerationProcess`.
- **Główne elementy:** Renderuje `SourceTextInput`, `GenerationStatus`, `CandidateReviewList` **oraz `BulkSaveActions` (warunkowo, gdy są kandydaci)**, przekazując im potrzebne propsy i callbacki z hooka `useGenerationProcess`.
- **Obsługiwane interakcje:** Pośrednio, poprzez dzieci i hook.
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji.
- **Typy:** `CandidateViewModel[]`, `string | null` (globalny błąd), `boolean` (globalne ładowanie), **`boolean` (ładowanie bulk save)**.
- **Propsy:** Brak (jest to komponent najwyższego poziomu dla widoku).

### `SourceTextInput` (React)

- **Opis:** Formularz do wprowadzania tekstu źródłowego przez użytkownika. Zawiera pole tekstowe (`Textarea`), licznik znaków, komunikat walidacyjny oraz przycisk inicjujący generowanie.
- **Główne elementy:** `Textarea` (Shadcn), `p` (dla licznika i błędów), `Button` (Shadcn).
- **Obsługiwane interakcje:**
  - `onChange` na `Textarea`: Aktualizuje stan tekstu i uruchamia walidację długości.
  - `onClick` na `Button`: Wywołuje przekazany callback `onGenerateSubmit` z aktualnym tekstem, jeśli jest on poprawny i nie trwa ładowanie.
- **Obsługiwana walidacja:**
  - Sprawdza, czy długość tekstu (`value.length`) jest w zakresie [1000, 10000] znaków.
  - Wyświetla komunikat błędu pod polem tekstowym, jeśli walidacja nie przejdzie.
  - Wyłącza przycisk "Generuj", jeśli tekst jest niepoprawny lub jeśli `isLoading` jest `true`.
- **Typy:** `string` (dla `value`).
- **Propsy:**
  - `value: string`: Aktualna wartość pola tekstowego.
  - `onValueChange: (value: string) => void`: Callback do aktualizacji stanu tekstu w komponencie nadrzędnym.
  - `onGenerateSubmit: () => void`: Callback wywoływany po kliknięciu przycisku "Generuj" (gdy tekst jest poprawny).
  - `isLoading: boolean`: Informuje, czy trwa proces generowania (do wyłączenia przycisku).
  - `charCount: number`: Aktualna liczba znaków (do wyświetlenia).
  - `validationError: string | null`: Komunikat błędu walidacji długości tekstu.

### `GenerationStatus` (React)

- **Opis:** Wyświetla informację o stanie procesu generowania AI (ładowanie lub błąd).
- **Główne elementy:** `Skeleton` (Shadcn) lub inny wskaźnik ładowania, gdy `isLoading` jest `true`. `Alert` (Shadcn) z wariantem "destructive", gdy `errorMessage` jest ustawiony.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak specyficznych typów.
- **Propsy:**
  - `isLoading: boolean`: Czy pokazać wskaźnik ładowania.
  - `errorMessage: string | null`: Treść błędu do wyświetlenia w alercie.

### `CandidateReviewList` (React)

- **Opis:** Renderuje listę komponentów `CandidateCard` na podstawie otrzymanej tablicy kandydatów.
- **Główne elementy:** Mapuje tablicę `candidates` na komponenty `CandidateCard`. Może zawierać nagłówek (np. "Propozycje fiszek do recenzji").
- **Obsługiwane interakcje:** Deleguje obsługę akcji do `CandidateCard`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `CandidateViewModel[]`.
- **Propsy:**
  - `candidates: CandidateViewModel[]`: Lista kandydatów do wyświetlenia.
  - `onMarkForAcceptance: (candidateId: string) => void`: **Zmieniony callback:** Lokalnie oznacza kandydata do akceptacji.
  - `onEdit: (candidateId: string, data: UpdateAICandidateFlashcardCommand) => void`: Callback do zapisu edytowanego kandydata (API call natychmiastowy).
  - `onMarkForRejection: (candidateId: string) => void`: **Zmieniony callback:** Lokalnie oznacza kandydata do odrzucenia.
  - `onSetToEdit: (candidateId: string) => void`: **Nowy callback:** Ustawia kartę w tryb edycji.
  - `onCancelEdit: (candidateId: string) => void`: **Nowy callback:** Anuluje tryb edycji.

### `CandidateCard` (React)

- **Opis:** Reprezentuje pojedynczą propozycję fiszki (kandydata) wygenerowaną przez AI. Wyświetla treść przodu i tyłu, umożliwia oznaczenie do akceptacji, edycję lub oznaczenie do odrzucenia. Zarządza swoim stanem edycji i stanem operacji asynchronicznych (tylko dla edycji).
- **Główne elementy:** `Card` (Shadcn), `CardHeader`, `CardContent` (z `p`, `pre`, `code`), `CardFooter` (z `Button` Shadcn dla akcji: Akceptuj, Edytuj, Odrzuć). Warunkowo renderuje `EditCandidateForm`. Używa `AlertDialog` (Shadcn) do potwierdzenia odrzucenia. **Przyciski Akceptuj/Odrzuć są wizualnie zmieniane po kliknięciu (np. zmiana wariantu, ikona).**
- **Obsługiwane interakcje:**
  - `onClick` na "Akceptuj": Wywołuje `onMarkForAcceptance` z ID kandydata. **Nie wywołuje API.**
  - `onClick` na "Edytuj": Wywołuje `onSetToEdit` z ID kandydata, przełączając kartę w tryb edycji.
  - `onClick` na "Odrzuć": Otwiera `AlertDialog` do potwierdzenia. Po potwierdzeniu wywołuje `onMarkForRejection` z ID kandydata. **Nie wywołuje API.**
  - Interakcje w `EditCandidateForm` (Zapisz/Anuluj).
- **Obsługiwana walidacja:** Delegowana do `EditCandidateForm` w trybie edycji.
- **Typy:** `CandidateViewModel`.
- **Propsy:**
  - `candidate: CandidateViewModel`: Dane kandydata i jego stan UI.
  - `onMarkForAcceptance: (candidateId: string) => void`: Callback do oznaczenia do akceptacji.
  - `onEdit: (candidateId: string, data: UpdateAICandidateFlashcardCommand) => void`: Callback do zapisu edycji (wywołuje PUT API).
  - `onMarkForRejection: (candidateId: string) => void`: Callback do oznaczenia do odrzucenia.
  - `onSetToEdit: (candidateId: string) => void`: Callback do włączenia trybu edycji.
  - `onCancelEdit: (candidateId: string) => void`: Callback do anulowania trybu edycji.

### `EditCandidateForm` (React)

- **Opis:** Wewnętrzny formularz komponentu `CandidateCard`, widoczny w trybie edycji. Umożliwia modyfikację treści przodu i tyłu kandydata.
- **Główne elementy:** Dwa pola `Textarea` (Shadcn) dla przodu i tyłu, komunikaty walidacyjne (`p`), przyciski `Button` (Shadcn) "Zapisz" i "Anuluj".
- **Obsługiwane interakcje:**
  - `onChange` na `Textarea`: Aktualizuje lokalny stan edytowanych danych.
  - `onClick` na "Zapisz": Wywołuje `onSubmit` z edytowanymi danymi, jeśli są poprawne.
  - `onClick` na "Anuluj": Wywołuje `onCancel`.
- **Obsługiwana walidacja:**
  - Sprawdza, czy `front.length` > 0 i <= 200.
  - Sprawdza, czy `back.length` > 0 i <= 500.
  - Wyświetla komunikaty błędów. Wyłącza przycisk "Zapisz", jeśli dane są niepoprawne lub trwa zapis.
- **Typy:** `UpdateAICandidateFlashcardCommand` (dla danych formularza).
- **Propsy:**
  - `initialData: UpdateAICandidateFlashcardCommand`: Początkowe wartości pól (z `candidate.editData` lub `candidate`).
  - `onSubmit: (data: UpdateAICandidateFlashcardCommand) => void`: Callback wywoływany po kliknięciu "Zapisz". **Ten callback powinien obsłużyć wywołanie PUT API.**
  - `onCancel: () => void`: Callback wywoływany po kliknięciu "Anuluj".
  - `isSaving: boolean`: Czy trwa proces zapisywania (do wyłączenia przycisków).
  - `validationError: string | null`: Komunikat błędu walidacji.

### `BulkSaveActions` (React) **- NOWY**

- **Opis:** Kontener na przyciski umożliwiające hurtowe zapisanie przetworzonych kandydatów na fiszki. Pojawia się, gdy lista kandydatów jest dostępna.
- **Główne elementy:** Dwa komponenty `Button` (Shadcn): "Zapisz wszystkie" i "Zapisz zaakceptowane".
- **Obsługiwane interakcje:**
  - `onClick` na "Zapisz wszystkie": Wywołuje callback `onSaveAll`.
  - `onClick` na "Zapisz zaakceptowane": Wywołuje callback `onSaveAccepted`.
- **Obsługiwana walidacja:** Przyciski są wyłączone, jeśli:
  - Nie ma kandydatów do przetworzenia (`canSave` jest `false`).
  - Trwa już operacja hurtowego zapisywania (`isBulkSaving` jest `true`).
  - Trwa początkowe generowanie kandydatów (`isGenerating` jest `true`).
- **Typy:** Brak specyficznych.
- **Propsy:**
  - `onSaveAll: () => void`: Callback do zapisu wszystkich nieodrzuconych kandydatów.
  - `onSaveAccepted: () => void`: Callback do zapisu tylko tych kandydatów oznaczonych do akceptacji.
  - `isBulkSaving: boolean`: Informuje, czy trwa operacja hurtowego zapisu.
  - `canSave: boolean`: Informuje, czy są jacyś kandydaci do potencjalnego zapisania.
  - `isGenerating: boolean`: Informuje, czy trwa proces generowania kandydatów.

## 5. Typy

Oprócz typów zdefiniowanych w `src/types.ts` (takich jak `AICandidateFlashcardDTO`, `UpdateAICandidateFlashcardCommand`, `CreateGenerationRequestCommand`, `GenerationRequestDTO`, `FlashcardDTO`), wprowadzamy nowy typ ViewModel dla lepszego zarządzania stanem UI:

- **`CandidateViewModel`**:
  - `id: string`: ID kandydata (z `AICandidateFlashcardDTO.id`).
  - `requestId: string`: ID żądania generowania (z `AICandidateFlashcardDTO.request_id`).
  - `front: string`: Treść przodu (z `AICandidateFlashcardDTO.front`).
  - `back: string`: Treść tyłu (z `AICandidateFlashcardDTO.back`).
  - `createdAt: string`: Data utworzenia (z `AICandidateFlashcardDTO.created_at`).
  - **`uiState: 'idle' | 'editing' | 'saving_edit' | 'marked_for_acceptance' | 'marked_for_rejection' | 'saving' | 'saved' | 'rejected' | 'error'`**: Zaktualizowany stan UI.
  - `editData?: { front: string, back: string }`: Tymczasowe dane przechowywane podczas edycji, zanim zostaną zapisane.
  - `errorMessage?: string`: Komunikat błędu specyficzny dla operacji na tym kandydacie (np. błąd zapisu edycji, błąd podczas bulk save).

## 6. Zarządzanie stanem

Zarządzanie stanem będzie scentralizowane w głównym komponencie `GenerateView` przy użyciu standardowych hooków React (`useState`, `useRef`) oraz potencjalnie customowego hooka `useGenerationProcess`.

- **`useGenerationProcess` (Custom Hook):**
  - **Cel:** Hermetyzacja logiki związanej z całym przepływem generowania, recenzji **i hurtowego zapisu**.
  - **Zarządzany stan:**
    - `sourceText: string`: Tekst wprowadzony przez użytkownika.
    - `validationError: string | null`: Błąd walidacji tekstu wejściowego.
    - `generationRequest: GenerationRequestDTO | null`: Szczegóły aktywnego żądania generowania.
    - `candidates: CandidateViewModel[]`: Lista kandydatów z ich stanem UI.
    - `isLoading: boolean`: Globalny stan ładowania (dla POST **generation-requests** i pollingu).
    - **`isBulkSaving: boolean`: Nowy stan dla operacji hurtowego zapisu.**
    - `error: string | null`: Globalny błąd procesu.
    - `pollingIntervalId: MutableRefObject<NodeJS.Timeout | null>`: Referencja do interwału pollingu.
  - **Eksponowane funkcje:**
    - `setSourceText(text: string)`: Aktualizuje tekst i uruchamia walidację.
    - `startGeneration()`: Rozpoczyna proces generowania (walidacja, POST API, start pollingu).
    - **`markForAcceptance(candidateId: string)`: Zmiana - oznacza lokalnie.**
    - `updateCandidate(candidateId: string, data: UpdateAICandidateFlashcardCommand)`: Obsługuje zapis edycji kandydata (**wywołuje PUT API**).
    - **`markForRejection(candidateId: string)`: Zmiana - oznacza lokalnie.**
    - `setCandidateToEdit(candidateId: string)`: Ustawia stan edycji dla kandydata.
    - `cancelEdit(candidateId: string)`: Anuluje tryb edycji.
    - **`saveAllMarkedCandidates()`: Nowa funkcja - zapisuje wszystkie oznaczone (do akceptacji lub odrzucenia) przez API.**
    - **`saveOnlyAcceptedCandidates()`: Nowa funkcja - zapisuje tylko te oznaczone do akceptacji przez API.**
  - **Logika wewnętrzna:** Walidacja tekstu wejściowego, wywołania API (`POST /generation-requests`, `GET /ai-candidates`, **`PUT /ai-candidates/{id}` dla edycji**, **`POST /ai-candidates/{id}/accept` i `DELETE /ai-candidates/{id}` dla hurtowego zapisu**), obsługa pollingu (`setInterval`, `clearInterval`), zarządzanie stanami `isLoading`, `isBulkSaving`, `error` oraz aktualizacja `candidates` (mapowanie DTO na ViewModel i aktualizacja `uiState`). **Logika bulk save obsługuje iteracyjne wywołania API dla oznaczonych kandydatów, aktualizując ich `uiState` na 'saving', a potem 'saved'/'rejected' lub 'error'.**

## 7. Integracja API

Widok będzie komunikował się z następującymi endpointami API:

1.  **Inicjacja generowania:**
    - **Endpoint:** `POST /api/generation-requests`
    - **Typ żądania:** `CreateGenerationRequestCommand` (`{ source_text: string }`)
    - **Typ odpowiedzi (sukces):** `201 Created` z `GenerationRequestDTO`
    - **Typ odpowiedzi (błąd):** `400 Bad Request` (np. błąd walidacji długości tekstu), `401 Unauthorized`, `500 Internal Server Error`
2.  **Pobieranie kandydatów (polling):**
    - **Endpoint:** `GET /api/ai-candidates?generationRequestId={id}` (ID z odpowiedzi na POST)
    - **Typ żądania:** Brak (parametr w URL)
    - **Typ odpowiedzi (sukces):** `200 OK` z `GetAICandidatesResponseDTO` (`{ aiCandidates: AICandidateFlashcardDTO[] }`)
    - **Typ odpowiedzi (błąd):** `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`
3.  **Akceptacja kandydata (w ramach Bulk Save):**
    - **Endpoint:** `POST /api/ai-candidates/{id}/accept`
    - **Typ żądania:** `AcceptAICandidateFlashcardCommand` (`{}`)
    - **Typ odpowiedzi (sukces):** `201 Created` z `FlashcardDTO` (nowo utworzona fiszka)
    - **Typ odpowiedzi (błąd):** `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`
4.  **Edycja kandydata:**
    - **Endpoint:** `PUT /api/ai-candidates/{id}`
    - **Typ żądania:** `UpdateAICandidateFlashcardCommand` (`{ front: string, back: string }`)
    - **Typ odpowiedzi (sukces):** `200 OK` z zaktualizowanym `AICandidateFlashcardDTO`
    - **Typ odpowiedzi (błąd):** `400 Bad Request` (błąd walidacji długości), `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`
5.  **Odrzucenie kandydata (w ramach Bulk Save "Zapisz wszystkie"):**
    - **Endpoint:** `DELETE /api/ai-candidates/{id}`
    - **Typ żądania:** Brak
    - **Typ odpowiedzi (sukces):** `204 No Content`
    - **Typ odpowiedzi (błąd):** `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

Wszystkie wywołania API będą wymagały nagłówka `Authorization: Bearer <token>`. Należy użyć klienta HTTP (np. `fetch` lub dedykowanej biblioteki) do wykonywania zapytań i obsługi odpowiedzi oraz błędów. **Operacje bulk save są realizowane przez frontend poprzez iteracyjne wywołania odpowiednich endpointów (`POST .../accept` lub `DELETE .../{id}`) dla każdego oznaczonego kandydata.**

## 8. Interakcje użytkownika

- **Wpisywanie tekstu:** Aktualizacja licznika znaków, walidacja długości w czasie rzeczywistym, włączanie/wyłączanie przycisku "Generuj".
- **Kliknięcie "Generuj":** Uruchomienie procesu generowania (wskaźnik ładowania), wywołanie `POST /api/generation-requests`, rozpoczęcie pollingu `GET /api/ai-candidates`.
- **Zakończenie generowania:** Wyświetlenie listy `CandidateCard` lub komunikatu o błędzie. **Pojawienie się przycisków `BulkSaveActions`.**
- **Kliknięcie "Akceptuj":** **Zmiana stanu UI karty na `marked_for_acceptance`. Wizualne oznaczenie przycisku/karty.**
- **Kliknięcie "Edytuj":** Przełączenie `CandidateCard` w tryb edycji (pokazanie `EditCandidateForm`), ustawienie `uiState` na `editing`.
- **Edycja w formularzu:** Aktualizacja stanu formularza, walidacja długości pól `front`/`back`, włączanie/wyłączanie przycisku "Zapisz".
- **Kliknięcie "Zapisz" (w edycji):** Zmiana stanu karty na ładowanie ('saving_edit'), wywołanie `PUT /api/ai-candidates/{id}`, po sukcesie powrót do trybu widoku ('idle') z zaktualizowanymi danymi, po błędzie zmiana stanu na 'error' i wyświetlenie komunikatu w formularzu.
- **Kliknięcie "Anuluj" (w edycji):** Powrót do trybu widoku ('idle') bez zapisywania zmian, odrzucenie `editData`.
- **Kliknięcie "Odrzuć":** Wyświetlenie modala potwierdzającego (`AlertDialog`). Po potwierdzeniu, **zmiana stanu UI karty na `marked_for_rejection`. Wizualne oznaczenie przycisku/karty.**
- **Kliknięcie "Zapisz wszystkie" (`BulkSaveActions`):** Uruchomienie procesu hurtowego zapisu (wskaźnik ładowania `isBulkSaving`). Wywołanie API (`POST .../accept` dla `marked_for_acceptance` i `DELETE .../{id}` dla `marked_for_rejection`). Aktualizacja `uiState` poszczególnych kart na `saving`, potem `saved`/`rejected` lub `error`.
- **Kliknięcie "Zapisz zaakceptowane" (`BulkSaveActions`):** Uruchomienie procesu hurtowego zapisu (wskaźnik ładowania `isBulkSaving`). Wywołanie API (`POST .../accept` tylko dla `marked_for_acceptance`). Aktualizacja `uiState` na `saving`, potem `saved` lub `error`.

## 9. Warunki i walidacja

- **Pole tekstowe (`SourceTextInput`):**
  - Warunek: Długość tekstu musi być >= 1000 i <= 10000 znaków.
  - Weryfikacja: `onChange` i przed wywołaniem `onGenerateSubmit`.
  - Efekt UI: Wyświetlenie komunikatu błędu pod polem, wyłączenie przycisku "Generuj".
- **Formularz edycji (`EditCandidateForm`):**
  - Warunek 1: Długość pola "Przód" musi być > 0 i <= 200 znaków.
  - Warunek 2: Długość pola "Tył" musi być > 0 i <= 500 znaków.
  - Weryfikacja: `onChange` pól formularza.
  - Efekt UI: Wyświetlenie komunikatów błędów przy polach, wyłączenie przycisku "Zapisz".
- **Przyciski akcji (`CandidateCard`, `SourceTextInput`):**
  - Warunek: Przyciski inicjujące operacje API (Generuj, **Zapisz edycję**) powinny być wyłączone podczas trwania danej operacji (ładowania), aby zapobiec wielokrotnym wywołaniom. Przyciski Akceptuj/Odrzuć zmieniają tylko stan lokalny.
  - Weryfikacja: Sprawdzanie odpowiedniego stanu ładowania (`isLoading` globalne lub `uiState === 'saving_edit'` w `CandidateViewModel`).
  - Efekt UI: Atrybut `disabled` na przyciskach.
- **Przyciski Bulk Save (`BulkSaveActions`):**
  - Warunek: Muszą istnieć kandydaci na liście. Nie może trwać operacja generowania (`isLoading`) ani inna operacja bulk save (`isBulkSaving`).
  - Weryfikacja: Sprawdzanie `candidates.length > 0`, `!isLoading`, `!isBulkSaving`.
  - Efekt UI: Atrybut `disabled` na przyciskach.

## 10. Obsługa błędów

- **Błąd walidacji wejściowej:** Wyświetlanie komunikatów inline w `SourceTextInput`.
- **Błąd API (`POST /generation-requests`):** Wyświetlenie globalnego błędu w `GenerationStatus`. Zatrzymanie procesu.
- **Błąd API (polling `GET /ai-candidates`):** Wyświetlenie globalnego błędu w `GenerationStatus`. Zatrzymanie pollingu.
- **Błąd API (Akceptacja, Edycja, Odrzucenie):**
  - **Edycja (PUT):** Ustawienie `uiState` na 'error' w `CandidateViewModel`, wyświetlenie błędu w `EditCandidateForm`. Umożliwienie ponowienia próby.
  - **Bulk Save (POST/DELETE):** Ustawienie `uiState` na 'error' dla konkretnego kandydata, który się nie powiódł. Wyświetlenie komunikatu błędu na poziomie `CandidateCard`. Należy rozważyć, czy proces ma być kontynuowany dla pozostałych, czy przerwany. **Można wyświetlić globalny komunikat o częściowym sukcesie/niepowodzeniu po zakończeniu całej operacji bulk.**
- **Ogólne błędy sieciowe:** Obsługa w kliencie HTTP, wyświetlanie ogólnego komunikatu o błędzie sieci.
- **Komunikaty błędów:** Powinny być przyjazne dla użytkownika (np. "Nie udało się wygenerować fiszek. Spróbuj ponownie później.", "Błąd podczas zapisywania zmian.", "Nie można zaakceptować fiszki X.", **"Zapisano Y z Z fiszek. Wystąpiły błędy."**). Można użyć komponentu `Alert` lub `toast` z Shadcn/ui.

## 11. Kroki implementacji

1.  **Struktura plików:** Utwórz plik strony `src/pages/generate.astro`. Utwórz komponenty React w `src/components/generate/`: `GenerateView.tsx`, `SourceTextInput.tsx`, `GenerationStatus.tsx`, `CandidateReviewList.tsx`, `CandidateCard.tsx`, **`BulkSaveActions.tsx`**.
2.  **Komponent `GenerateView`:** Zaimplementuj główny komponent React. Dodaj podstawowy stan (np. `useState` dla tekstu). Zintegruj go ze stroną `generate.astro` używając `client:load`.
3.  **Komponent `SourceTextInput`:** Zaimplementuj formularz z `Textarea`, licznikiem, walidacją długości i przyciskiem "Generuj". Użyj komponentów Shadcn. Podłącz stan i callbacki do `GenerateView`.
4.  **Komponent `GenerationStatus`:** Zaimplementuj wyświetlanie stanu ładowania (`Skeleton`) i błędów (`Alert`). Podłącz propsy `isLoading` i `errorMessage` z `GenerateView`.
5.  **Typ `CandidateViewModel`:** Zdefiniuj/Zaktualizuj typ `CandidateViewModel` (np. w `src/types.ts`) z nowymi stanami `uiState`.
6.  **Custom Hook `useGenerationProcess`:** Zaimplementuj/Zaktualizuj logikę zarządzania stanem, **zmodyfikuj logikę akcji Akceptuj/Odrzuć na lokalne oznaczanie**, dodaj stan `isBulkSaving` i nowe funkcje do hurtowego zapisu. Zintegruj go z `GenerateView`.
7.  **Komponent `CandidateReviewList` i `CandidateCard`:** Zaimplementuj/Zaktualizuj wyświetlanie listy kandydatów. `CandidateCard` powinien wyświetlać dane, **obsługiwać lokalne oznaczanie do akceptacji/odrzucenia (zmiana UI)**, przyciski akcji i obsługiwać stany UI. Podłącz nowe callbacki (`onMarkForAcceptance`, `onMarkForRejection`, `onSetToEdit`, `onCancelEdit`).
8.  **Integracja API (Edycja):** Zaimplementuj wywołanie `PUT /api/ai-candidates/{id}` w callbacku `onSubmit` komponentu `EditCandidateForm` (przekazanym z `useGenerationProcess`).
9.  **Komponent `BulkSaveActions`:** Zaimplementuj nowy komponent z przyciskami "Zapisz wszystkie" i "Zapisz zaakceptowane". Podłącz propsy `isBulkSaving`, `canSave`, `isGenerating` i callbacki `onSaveAll`, `onSaveAccepted` z `GenerateView` (pochodzące z hooka).
10. **Integracja API (Bulk Save):** W hooku `useGenerationProcess` zaimplementuj logikę funkcji `saveAllMarkedCandidates` i `saveOnlyAcceptedCandidates`, które iterują po kandydatach i wywołują `POST /.../accept` lub `DELETE /.../{id}`. Obsłuż stan `isBulkSaving` i aktualizację `uiState` poszczególnych kandydatów.
11. **Implementacja Edycji:** Upewnij się, że logika edycji w `CandidateCard` i `EditCandidateForm` działa poprawnie, włączając wywołanie API i obsługę stanu `saving_edit`.
12. **Implementacja Odrzucenia z Potwierdzeniem:** Upewnij się, że `AlertDialog` w `CandidateCard` poprawnie wywołuje `onMarkForRejection` po potwierdzeniu.
13. **Obsługa Stanów UI i Błędów:** Dopracuj zarządzanie stanami `uiState` we wszystkich scenariuszach (edycja, oznaczanie, bulk save). Wyświetlaj odpowiednie komunikaty błędów. Upewnij się, że przyciski są odpowiednio wyłączane. **Dodaj obsługę błędów częściowych w bulk save.**
14. **Styling i Finalizacja:** Dopracuj style za pomocą Tailwind, upewnij się, że komponenty Shadcn są poprawnie skonfigurowane. Przetestuj wszystkie scenariusze.
15. **Refaktoryzacja i Optymalizacja:** Przejrzyj kod pod kątem czytelności, wydajności i zgodności z dobrymi praktykami.
