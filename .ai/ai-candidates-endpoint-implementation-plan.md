# API Endpoint Implementation Plan: AI Candidate Flashcards Endpoints

## 1. Przegląd punktu końcowego

Cel: Implementacja pełnego zestawu endpointów dotyczących obsługi kandydatowych fiszek generowanych przez AI. Endpointy umożliwiają pobranie listy kandydatów, ich edycję, zatwierdzenie (konwersja na standardową fiszkę) oraz odrzucenie.

## 2. Szczegóły żądania

- **GET /api/ai-candidates**

  - Opis: Pobiera listę kandydatowych fiszek wygenerowanych przez AI oczekujących na recenzję.
  - Parametry:
    - Opcjonalny: `generationRequestId` (używany do filtrowania kandydatów na podstawie konkretnego żądania generowania)

- **PUT /api/ai-candidates/{id}**

  - Opis: Aktualizuje kandydatową fiszkę, umożliwiając edycję pól `front` oraz `back`.
  - Parametry:
    - Wymagany: `id` (ścieżka URL)
  - Request Body:
    ```json
    {
      "front": "Edited front text (max 200 chars)",
      "back": "Edited back text (max 500 chars)"
    }
    ```

- **POST /api/ai-candidates/{id}/accept**

  - Opis: Zatwierdza kandydatową fiszkę, konwertując ją na standardową fiszkę i usuwając ją z listy kandydatów.
  - Parametry:
    - Wymagany: `id` (ścieżka URL)
  - Request Body: Pusty obiekt (używając typu `AcceptAICandidateFlashcardCommand`)

- **DELETE /api/ai-candidates/{id}**
  - Opis: Odrzuca (usuwa) kandydatową fiszkę.
  - Parametry:
    - Wymagany: `id` (ścieżka URL)

## 3. Wykorzystywane typy

- `AICandidateFlashcardDTO` – DTO reprezentujące kandydata na fiszkę.
- `UpdateAICandidateFlashcardCommand` – Command Model używany w PUT /api/ai-candidates/{id}.
- `AcceptAICandidateFlashcardCommand` – Command Model (pusty obiekt) używany w POST /api/ai-candidates/{id}/accept.

## 4. Szczegóły odpowiedzi

- **GET /api/ai-candidates**

  - Status: 200 OK
  - Body: Lista obiektów zgodnych z `AICandidateFlashcardDTO`, np.:
    ```json
    [
      {
        "id": "uuid",
        "request_id": "uuid",
        "front": "text",
        "back": "text",
        "created_at": "timestamp"
      }
    ]
    ```

- **PUT /api/ai-candidates/{id}**

  - Status: 200 OK
  - Body: Zaktualizowany obiekt `AICandidateFlashcardDTO`.

- **POST /api/ai-candidates/{id}/accept**

  - Status: 201 Created
  - Body: Obiekt reprezentujący utworzoną fiszkę (np. `FlashcardDTO`).

- **DELETE /api/ai-candidates/{id}**
  - Status: 204 No Content

## 5. Przepływ danych

1. Klient wysyła żądanie do odpowiedniego endpointu wraz z wymaganymi parametrami i (w przypadku PUT) treścią żądania.
2. Warstwa API autoryzuje użytkownika za pomocą tokena JWT (Supabase Auth) oraz weryfikuje, czy kandydatowa fiszka należy do użytkownika (w oparciu o RLS w bazie danych).
3. Żądanie trafia do warstwy serwisów, gdzie następuje:
   - Walidacja danych wejściowych (przy użyciu Zod) – sprawdzenie długości pól `front` (max 200 znaków) oraz `back` (max 500 znaków).
   - W przypadku endpointu POST /accept:
     - Pobranie kandydatowej fiszki z bazy danych.
     - Utworzenie nowego rekordu w tabeli `flashcards` z odpowiednim źródłem (prawdopodobnie "AI").
     - Usunięcie zatwierdzonej kandydatowej fiszki z tabeli `ai_candidate_flashcards`.
4. Wynik operacji (sukces lub błąd) jest zwracany do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Wszystkie endpointy wymagają poprawnego tokena JWT (Supabase Auth).
- **Autoryzacja:** Endpointy wykorzystują RLS (Row Level Security) do weryfikacji, czy kandydatowa fiszka należy do danego użytkownika.
- **Walidacja:** Dane wejściowe są walidowane przy użyciu Zod, aby upewnić się, że spełniają ograniczenia (np. długość pól `front` i `back`).
- **Ochrona przed nadużyciem:** Wdrożenie rate limiting oraz monitorowania anomalii.

## 7. Obsługa błędów

- **400 Bad Request:** Gdy walidacja danych wejściowych nie powiedzie się (np. zbyt długa wartość `front` lub `back`).
- **401 Unauthorized:** Gdy użytkownik nie dostarczy poprawnego tokena uwierzytelniającego.
- **404 Not Found:** Gdy kandydatowa fiszka o podanym `id` nie istnieje lub nie należy do użytkownika.
- **500 Internal Server Error:** W przypadku nieoczekiwanych błędów aplikacji lub problemów z bazą danych.

## 8. Rozważania dotyczące wydajności

- **Indeksacja:** Tabela `ai_candidate_flashcards` posiada odpowiedni indeks na `request_id`, co usprawnia zapytania filtrowania.
- **Paginacja:** Rozważenie implementacji paginacji w endpointach GET, jeśli spodziewana jest duża liczba rekordów.
- **Optymalizacja zapytań:** Upewnienie się, że zapytania do bazy danych są zoptymalizowane i korzystają z mechanizmów cache, jeśli to możliwe.

## 9. Etapy wdrożenia

1. **Routing:** Dodanie lub aktualizacja tras dla endpointów GET, PUT, POST /accept oraz DELETE w warstwie API.
2. **Walidacja:** Implementacja schematów walidacji dla `UpdateAICandidateFlashcardCommand` oraz sprawdzenie ograniczeń danych wejściowych.
3. **Logika serwisowa:** Wyodrębnienie logiki biznesowej do dedykowanego serwisu (np. AICandidateFlashcardsService) z metodami:
   - `getAICandidates`
   - `updateAICandidateFlashcard`
   - `acceptAICandidateFlashcard`
   - `deleteAICandidateFlashcard`
4. **Integracja z bazą danych:** Wykorzystanie istniejących połączeń Supabase i zapewnienie przestrzegania RLS w operacjach CRUD.
5. **Logowanie błędów:** Implementacja mechanizmu logowania błędów i alertów w przypadku wystąpienia nieoczekiwanych problemów.
6. **Dokumentacja:** Aktualizacja dokumentacji projektu (w tym planu API) oraz przeprowadzenie code review.
7. **Wdrożenie i weryfikacja:** Uruchomienie endpointów w środowisku testowym, monitorowanie wydajności i bezpieczeństwa, a następnie wdrożenie na produkcję.
