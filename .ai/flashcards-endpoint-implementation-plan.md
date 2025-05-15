# API Endpoint Implementation Plan: Flashcards API

## 1. Przegląd punktu końcowego

Endpointy zarządzania fiszkami umożliwiają użytkownikom:

- Pobieranie listy własnych fiszek (GET /api/flashcards) z paginacją oraz opcjonalnym filtrem po źródle ("AI" lub "MANUAL").
- Tworzenie nowej fiszki manualnie (POST /api/flashcards) z wymaganymi polami `front` i `back` oraz automatycznym ustawieniem `source` na "MANUAL".
- Pobieranie szczegółowych informacji o pojedynczej fiszce (GET /api/flashcards/{id}).
- Aktualizację istniejącej fiszki (PUT /api/flashcards/{id}) umożliwiającą modyfikację pól `front` i `back`.
- Usunięcie fiszki (DELETE /api/flashcards/{id}) przy czym usunięcie jest dozwolone tylko dla użytkownika, który daną fiszkę stworzył.

## 2. Szczegóły żądania

### GET /api/flashcards

- **Metoda HTTP:** GET
- **URL:** `/api/flashcards`
- **Parametry query:**
  - `page` – opcjonalnie, domyślnie ustawione na 1.
  - `limit` – opcjonalnie, domyślnie ustawione na 10.
  - `source` – opcjonalny filtr, wartości np. "AI" lub "MANUAL".

### POST /api/flashcards

- **Metoda HTTP:** POST
- **URL:** `/api/flashcards`
- **Request Body (JSON):**
  ```json
  {
    "front": "Question text (max 200 chars)",
    "back": "Answer text (max 500 chars)"
  }
  ```

### GET /api/flashcards/{id}

- **Metoda HTTP:** GET
- **URL:** `/api/flashcards/{id}`

### PUT /api/flashcards/{id}

- **Metoda HTTP:** PUT
- **URL:** `/api/flashcards/{id}`
- **Request Body (JSON):**
  ```json
  {
    "front": "Updated question",
    "back": "Updated answer"
  }
  ```

### DELETE /api/flashcards/{id}

- **Metoda HTTP:** DELETE
- **URL:** `/api/flashcards/{id}`

## 3. Wykorzystywane typy

- **FlashcardDTO:**  
  Reprezentuje pojedynczą fiszkę z polami:
  - `id`: unikalny identyfikator (uuid)
  - `front`: treść pytania lub główna treść fiszki
  - `back`: treść odpowiedzi lub szczegóły fiszki
  - `source`: określa pochodzenie fiszki, wartość "MANUAL" (dla odręcznie tworzonych) lub "AI"
  - `created_at`: znacznik czasu utworzenia
- **CreateFlashcardCommand:**  
  Zawiera pola:

  - `front`: treść pytania, max 200 znaków
  - `back`: treść odpowiedzi, max 500 znaków

- **UpdateFlashcardCommand:**  
  Używany przy aktualizacji fiszki, zawiera pola `front` i `back`.

## 4. Szczegóły odpowiedzi

### GET /api/flashcards

- **Kod statusu:** 200 OK
- **Response JSON:**
  ```json
  {
    "flashcards": [
      {
        "id": "uuid",
        "front": "...",
        "back": "...",
        "source": "MANUAL",
        "created_at": "timestamp"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 50 }
  }
  ```

### POST /api/flashcards

- **Kod statusu:** 201 Created
- **Response JSON:**
  ```json
  {
    "id": "uuid",
    "front": "Treść fiszki",
    "back": "Treść odpowiedzi",
    "source": "MANUAL",
    "created_at": "timestamp"
  }
  ```

### GET /api/flashcards/{id}

- **Kod statusu:** 200 OK (w przypadku sukcesu) lub 404 Not Found, gdy fiszka nie istnieje.

### PUT /api/flashcards/{id}

- **Kod statusu:** 200 OK z zaktualizowaną fiszką lub odpowiedni błąd, jeśli np. użytkownik nie ma uprawnień.

### DELETE /api/flashcards/{id}

- **Kod statusu:** 204 No Content w przypadku powodzenia lub 404 Not Found, jeśli dana fiszka nie została znaleziona.

## 5. Przepływ danych

1. **Odbiór żądania i autoryzacja:**

   - Każde żądanie musi zawierać Bearer token, który jest weryfikowany za pomocą Supabase Auth.
   - `user_id` jest pozyskiwany z kontekstu autoryzacji i używany do ograniczeń RLS (Row Level Security).

2. **Walidacja danych wejściowych:**

   - Dla POST i PUT użycie biblioteki walidacyjnej (np. Zod) z limitami:
     - `front` – maks. 200 znaków.
     - `back` – maks. 500 znaków.
   - Weryfikacja poprawności struktury JSON.

3. **Logika biznesowa i operacje na bazie danych:**
   - Wyodrębnienie logiki do serwisu (np. `src/lib/services/flashcardService.ts`), który odpowiada za:
     - Wstawianie nowej fiszki z `source` ustawionym na "MANUAL" oraz `user_id` z kontekstu (POST).
     - Pobieranie listy fiszek z paginacją oraz filtrowaniem po źródle (GET).
     - Pobieranie szczegółów fiszki po ID (GET /{id}).
     - Aktualizację fiszki (PUT) – możliwa tylko jeśli fiszka należy do użytkownika.
     - Usunięcie fiszki (DELETE) – z weryfikacją autoryzacji przy użyciu polityk Supabase RLS.

## 6. Względy bezpieczeństwa

- **Autoryzacja i autentykacja:**
  - Wszystkie operacje wymagają poprawnego tokena Bearer.
  - Mechanizm Supabase Auth zapewnia weryfikację użytkownika.
  - Użycie RLS w tabeli `flashcards` gwarantuje, że użytkownicy mogą uzyskiwać dostęp jedynie do swoich danych.
- **Walidacja danych:**
  - Schematy walidacyjne (np. przy pomocy Zod) chronią przed przekroczeniem limitów znaków i niepoprawną strukturą danych.
- **Ochrona przed atakami:**
  - Bezpieczne zapytania SQL oraz wykorzystanie mechanizmów Supabase chronią przed atakami typu SQL Injection.
  - Obsługa błędów i logowanie wyjątków pomaga w identyfikacji prób ataku.

## 7. Obsługa błędów

- **400 Bad Request:**
  - Brak wymaganych pól lub przekroczenie limitów znaków w `front` (max 200) lub `back` (max 500).
- **401 Unauthorized:**

  - Brak lub niepoprawny token autoryzacyjny.

- **404 Not Found:**

  - Żądanie pobrania, aktualizacji lub usunięcia fiszki, która nie istnieje lub nie należy do użytkownika.

- **500 Internal Server Error:**
  - Błędy po stronie serwera, nieoczekiwane wyjątki, problemy z bazą danych.
- **Logowanie błędów:**
  - Każdy wyjątek powinien być odpowiednio logowany, aby ułatwić diagnostykę błędów.

## 8. Rozważania dotyczące wydajności

- **Optymalizacja zapytań:**
  - Użycie paginacji w GET /api/flashcards minimalizuje obciążenie bazy przy dużej liczbie rekordów.
  - Indeksacja kolumny `user_id` poprawia szybkość pobierania danych.
- **Skalowalność:**
  - Możliwość wdrożenia mechanizmów cache'owania przy rosnącej liczbie użytkowników.
  - Rozważenie poziomej skalowalności w przypadku zwiększonego obciążenia.

## 9. Etapy wdrożenia

1. **Przygotowanie środowiska:**

   - Weryfikacja konfiguracji Supabase, polityk RLS oraz mechanizmu autoryzacji.
   - Upewnienie się, że testy jednostkowe (Vitest) oraz e2e (Playwright) są skonfigurowane.

2. **Implementacja API routes:**

   - Utworzenie pliku `/src/pages/api/flashcards/index.ts` do obsługi metod GET i POST.
   - Utworzenie pliku `/src/pages/api/flashcards/[id].ts` do obsługi GET (po ID), PUT oraz DELETE.

3. **Walidacja danych:**

   - Implementacja i integracja schematów walidacyjnych (np. Zod) dla `CreateFlashcardCommand` oraz `UpdateFlashcardCommand`.

4. **Wyodrębnienie logiki biznesowej:**

   - Przeniesienie operacji na fiszkach do dedykowanego serwisu (np. `src/lib/services/flashcardService.ts`) celem łatwiejszego utrzymania i testowania logiki.

5. **Integracja z bazą danych:**

   - Wykorzystanie klienta Supabase (pobrany z kontekstu `locals`) do realizacji operacji na tabeli `flashcards`.
   - Zapewnienie, że operacje INSERT, SELECT, UPDATE i DELETE są zgodne z politykami RLS.

6. **Testowanie:**

   - Napisanie testów jednostkowych dla logiki serwisowej przy użyciu Vitest.
   - Przygotowanie testów end-to-end przy użyciu Playwright do symulowania rzeczywistych interakcji użytkownika.
   - Testowanie procedur walidacyjnych, autoryzacji oraz obsługi błędów.

7. **Obsługa błędów i logowanie:**

   - Implementacja mechanizmów wychwytywania wyjątków oraz centralnego logowania błędów w celu ułatwienia diagnostyki.

8. **Weryfikacja i wdrożenie:**
   - Przeprowadzenie testów integracyjnych w środowisku testowym.
   - Wdrożenie API na środowisko produkcyjne po pozytywnych wynikach testów oraz przejrzeniu logów.
