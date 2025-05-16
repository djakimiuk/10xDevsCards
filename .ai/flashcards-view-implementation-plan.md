# Plan implementacji widoku Flashcards

## 1. Przegląd

Widok listy fiszek ma na celu prezentację wszystkich zapisanych fiszek użytkownika z możliwością edycji (poprzez modal) oraz usunięcia. Widok umożliwia szybki przegląd treści fiszek (przód i tył) oraz interakcję z poszczególnymi rekordami, zapewniając intuicyjną nawigację, potwierdzenia operacji usuwania i walidację danych.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką: `/flashcards`.

## 3. Struktura komponentów

- **FlashcardsPage** – główny kontener widoku, odpowiedzialny za pobieranie danych i zarządzanie stanem.
  - **FlashcardsList** – komponent odpowiedzialny za renderowanie listy fiszek.
    - **FlashcardRow** – pojedynczy wiersz/tabela prezentujący dane fiszki wraz z przyciskami edycji i usuwania.
  - **EditFlashcardModal** – modal umożliwiający edycję treści fiszki.
  - **DeleteConfirmationModal** – modal służący do potwierdzania operacji usunięcia fiszki.

## 4. Szczegóły komponentów

### FlashcardsPage

- **Opis:** Kontener widoku, który inicjuje pobieranie danych poprzez API, zarządza stanem listy fiszek oraz otwieraniem modali.
- **Główne elementy:** Nagłówek, komponent FlashcardsList, przyciski akcji (np. odświeżenie), modale (Edit i Delete).
- **Obsługiwane interakcje:** Pobranie danych przy montowaniu, odświeżenie listy po edycji lub usunięciu, otwieranie modali na akcje edycji lub usunięcia.
- **Propsy:** Brak – zarządzany wewnętrznie.

### FlashcardsList

- **Opis:** Komponent odpowiedzialny za renderowanie tablicy/podlisty fiszek.
- **Główne elementy:** Iteracja po danych fiszek, rendering komponentów FlashcardRow.
- **Obsługiwane interakcje:** Przekazywanie akcji edycji i usuwania do komponentu rodzica.
- **Propsy:**
  - `flashcards: FlashcardDTO[]` – lista fiszek do wyświetlenia.
  - `onEdit: (flashcard: FlashcardDTO) => void` – funkcja otwierająca modal edycji.
  - `onDelete: (flashcard: FlashcardDTO) => void` – funkcja otwierająca modal potwierdzenia usunięcia.

### FlashcardRow

- **Opis:** Reprezentuje pojedynczą fiszkę w liście.
- **Główne elementy:** Wyświetlenie treści `front` i `back`, przyciski "Edytuj" oraz "Usuń".
- **Obsługiwane interakcje:** Kliknięcie przycisku edycji (wywołanie `onEdit`) i usunięcia (wywołanie `onDelete`).
- **Propsy:**
  - `flashcard: FlashcardDTO` – dane fiszki do wyświetlenia.
  - `onEdit: () => void`
  - `onDelete: () => void`

### EditFlashcardModal

- **Opis:** Modal umożliwiający edycję treści fiszki.
- **Główne elementy:** Formularz z polami tekstowymi dla `front` (max 200 znaków) i `back` (max 500 znaków), przyciski "Zapisz" i "Anuluj".
- **Obsługiwane interakcje:** Walidacja pól (niepusty, ograniczenia długości), submit formularza wywołujący API PUT /api/flashcards/{id}.
- **Propsy:**
  - `flashcard: FlashcardDTO` – aktualne dane fiszki.
  - `onSave: (updated: { front: string; back: string }) => void` – funkcja wywoływana po zapisie zmian.
  - `onClose: () => void` – funkcja zamykająca modal.

### DeleteConfirmationModal

- **Opis:** Modal potwierdzenia usunięcia fiszki.
- **Główne elementy:** Komunikat z pytaniem o potwierdzenie, przyciski "Tak" oraz "Nie".
- **Obsługiwane interakcje:** Po potwierdzeniu wywołanie API DELETE /api/flashcards/{id}, aktualizacja listy.
- **Propsy:**
  - `flashcard: FlashcardDTO` – dane fiszki do usunięcia.
  - `onConfirm: () => void` – funkcja wywołana po potwierdzeniu usunięcia.
  - `onCancel: () => void` – funkcja anulująca operację.

## 5. Typy

- **FlashcardDTO:** (zdefiniowany w `src/types.ts`): zawiera `id`, `front`, `back`, `source` oraz `created_at`.
- **EditFlashcardCommand:** (używany przy aktualizacji, zawiera `front` i `back`).
- **FlashcardViewModel:** (opcjonalny, do zarządzania stanem UI) może rozszerzać FlashcardDTO o pola takie jak `isEditing: boolean` lub `errorMessage?: string`.

## 6. Zarządzanie stanem

- Użycie hooków React (`useState`, `useEffect`) do zarządzania listą fiszek, stanem ładowania, błędami oraz modalami.
- Opcjonalnie utworzenie customowego hooka `useFlashcards` do obsługi wywołań API (GET, PUT, DELETE) i aktualizacji stanu.

## 7. Integracja API

- **GET /api/flashcards:** Pobiera listę fiszek przy montowaniu widoku. Oczekiwany typ odpowiedzi: obiekt zawierający `flashcards: FlashcardDTO[]` oraz `pagination`.
- **PUT /api/flashcards/{id}:** Aktualizacja fiszki po edycji. Wysyłany payload: `{ front, back }`.
- **DELETE /api/flashcards/{id}:** Usuwanie fiszki. Po powodzeniu lista jest aktualizowana.
- Wszelkie wywołania muszą obsługiwać przypadki błędów (np. walidacja, błędy serwera) i aktualizować UI (wyświetlanie komunikatów o błędzie).

## 8. Interakcje użytkownika

- Użytkownik widzi listę fiszek i klika przycisk "Edytuj" przy wybranej fiszce, co otwiera `EditFlashcardModal` z wstępnymi danymi.
- W modal edycji użytkownik modyfikuje dane, a następnie zapisuje zmiany. Po poprawnej walidacji dane są przesyłane do API, a widok odświeżany.
- Kliknięcie przycisku "Usuń" wyświetla `DeleteConfirmationModal`. Po potwierdzeniu, API usuwa fiszkę, a lista jest aktualizowana.
- W przypadku błędów (np. przekroczenie limitów znaków, błąd serwera), użytkownik otrzymuje komunikaty inline.

## 9. Warunki i walidacja

- Pole `front`: wymagane, maksymalnie 200 znaków.
- Pole `back`: wymagane, maksymalnie 500 znaków.
- Walidacja odbywa się po stronie klienta przed wysłaniem żądania do API.
- Dodatkowo, każdy wynik operacji API (np. błędy sieciowe) zostaje odpowiednio obsłużony i wyświetlony użytkownikowi.

## 10. Obsługa błędów

- Wyświetlanie inline komunikatów o błędach przy nieudanych operacjach (np. walidacja formularza, błędy API przy aktualizacji/usunięciu).
- Użycie mechanizmu try/catch dla wywołań API oraz aktualizacja stanu błędu w UI.

## 11. Kroki implementacji

1. Utworzenie nowej strony `/flashcards` w katalogu `src/pages`.
2. Implementacja komponentu `FlashcardsPage` odpowiadającego za pobieranie danych i zarządzanie stanem.
3. Stworzenie komponentu `FlashcardsList` wraz z iteracją po danych i renderowaniem komponentów `FlashcardRow`.
4. Implementacja komponentu `FlashcardRow` z przyciskami edycji i usuwania.
5. Utworzenie `EditFlashcardModal` – formularza edycji z walidacją pól (używając limitów 200/500 znaków).
6. Utworzenie `DeleteConfirmationModal` do potwierdzania usunięcia fiszki.
7. Integracja widoku z API:
   - Pobieranie danych (GET /api/flashcards)
   - Aktualizacja fiszki (PUT /api/flashcards/{id})
   - Usuwanie fiszki (DELETE /api/flashcards/{id})
8. Implementacja zarządzania stanem (wykorzystanie hooków React lub customowego hooka `useFlashcards`).
9. Dodanie obsługi błędów oraz komunikatów dla użytkownika.
10. Przeprowadzenie testów jednostkowych oraz e2e (Playwright) dla wdrożonych funkcjonalności.

## 12. Spójność stylu

Wszystkie nowe komponenty oraz elementy interfejsu muszą wykorzystywać jednolity styl, zgodny z wdrożeniem w komponentach z folderu @generate (m.in. CandidateCard, CandidateReviewList, EditCandidateForm). Należy stosować spójne klasy Tailwind CSS, takie jak:

- `whitespace-pre-wrap`, `font-mono`, `text-sm`, `bg-muted`, `p-2`, `rounded-md` dla prezentacji tekstu
- Spójne klasy dla przycisków (np. `flex`, `items-center`, `justify-center`) oraz dla komunikatów błędów i alertów
- Odpowiednio responsywne klasy (np. `md:`, `lg:`) dla dostosowania interfejsu do rozdzielczości
  Dzięki temu interfejs będzie spójny, czytelny i intuicyjny w całej aplikacji.
