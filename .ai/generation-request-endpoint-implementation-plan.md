# API Endpoint Implementation Plan: POST /api/generation-requests

## 1. Przegląd punktu końcowego

Endpoint służy do inicjowania nowego żądania wygenerowania fiszek przez AI. Po otrzymaniu prawidłowego żądania z danymi wejściowymi, serwer waliduje dane, tworzy nowy rekord w tabeli generation_requests z polem source_text oraz ustawia status na "processing". Endpoint ten wymaga uwierzytelnienia i zwraca wygenerowany rekord.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** /api/generation-requests
- **Parametry:**
  - Wymagane: Brak parametrów zapytania
  - Opcjonalne: Brak
- **Request Body:**
  - JSON z pojedynczym polem:
    - `source_text`: (string) tekst o długości między 1000 a 10000 znaków

## 3. Wykorzystywane typy

- **DTO:**
  - `GenerationRequestDTO` (definiowany w `src/types.ts`)
- **Command Modele:**
  - `CreateGenerationRequestCommand` (definiowany w `src/types.ts`)

## 4. Szczegóły odpowiedzi

- **Sukces:**
  - **Status:** 201 Created
  - **Treść:** Obiekt `GenerationRequestDTO` zawierający dane nowo utworzonego żądania
- **Błędy:**
  - **400 Bad Request:** Jeśli walidacja danych wejściowych nie powiedzie się (np. `source_text` nie spełnia wymagań długości)
  - **401 Unauthorized:** Jeśli użytkownik nie jest uwierzytelniony
  - **500 Internal Server Error:** W przypadku problemów z bazą danych lub innych nieoczekiwanych błędów

## 5. Przepływ danych

1. **Odbiór żądania:** Endpoint odbiera żądanie POST na `/api/generation-requests`.
2. **Weryfikacja uwierzytelnienia:** Sprawdzany jest stan uwierzytelnienia użytkownika przy wykorzystaniu mechanizmu Supabase Auth (np. z ciasteczek) w celu wyekstrahowania UID.
3. **Walidacja danych wejściowych:** Parsowanie i walidacja JSON request body przy użyciu Zod. Schemat walidacji sprawdza, czy `source_text` jest typu string oraz czy jego długość mieści się w przedziale 1000-10000 znaków.
4. **Tworzenie rekordu:** Przy pomocy Supabase Client, tworzymy nowy rekord w tabeli `generation_requests`:
   - `user_id` ustawiony na UID uzyskany poprzez Supabase Auth
   - `source_text` z żądania
   - `status` ustawiony domyślnie na "processing"
   - Pola `created_at` i `updated_at` są konfiguracją triggera lub ustawiane automatycznie
5. **Odpowiedź:** Zwracany jest obiekt `GenerationRequestDTO` z danymi rekordu.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Endpoint zabezpieczono przy użyciu Supabase Auth, gwarantując, że tylko uwierzytelnieni użytkownicy mogą inicjować generacje.
- **Autoryzacja:** UID uzyskany dzięki Supabase Auth jest wykorzystywany do przypisania utworzonego rekordu użytkownikowi. Baza danych używa RLS (Row Level Security) zgodnie z konfiguracją w `db-plan.md`.
- **Walidacja:** Użycie Zod do walidacji danych wejściowych zabezpiecza przed atakami typu injection oraz błędami wynikającymi z nieprawidłowego formatu danych.

## 7. Obsługa błędów

- **Walidacja:** Jeśli `source_text` nie spełnia wymagań (np. długość < 1000 lub > 10000 znaków), zwracany jest błąd 400 Bad Request z odpowiednim komunikatem.
- **Uwierzytelnienie:** Jeśli użytkownik nie jest uwierzytelniony, zostanie zwrócony błąd 401 Unauthorized.
- **Problemy z bazą danych:** W razie niepowodzenia podczas tworzenia rekordu lub innych wyjątków, zostanie zwrócony błąd 500 Internal Server Error, a wyjątki zostaną zalogowane dla dalszej diagnostyki.

## 8. Rozważania dotyczące wydajności

- **Wstawianie rekordu:** Operacja zapisu do bazy jest optymalizowana przez asynchroniczne operacje Supabase.
- **Indeksy:** Kluczowe indeksy (np. na kolumnie `user_id`) wspierają szybki dostęp do danych podczas odczytu.
- **Skalowalność:** Mechanizm walidacji i prostota operacji sprawiają, że endpoint jest skalowalny w miarę wzrostu liczby użytkowników.

## 9. Etapy wdrożenia

1. **Utworzenie pliku endpointu:** Dodanie nowego API route `/api/generation-requests`.
2. **Implementacja walidacji:** Zdefiniowanie schematu Zod do walidacji `source_text` (typ: string, długość 1000-10000 znaków).
3. **Integracja uwierzytelnienia:** Dodanie mechanizmu sprawdzania stanu uwierzytelnienia użytkownika przy użyciu Supabase Auth, umożliwiającego wyekstrahowanie UID.
4. **Logika serwisowa:** Wydzielenie logiki tworzenia rekordu do warstwy serwisowej (service layer); ewentualnie utworzenie nowej funkcji w istniejącym serwisie.
5. **Interakcja z bazą danych:** Wykorzystanie Supabase Client do wstawienia nowego rekordu w tabeli `generation_requests`.
6. **Obsługa błędów:** Implementacja mechanizmu przechwytywania i logowania błędów, zwracanie odpowiednich kodów statusu (400, 401, 500).
7. **Dokumentacja:** Aktualizacja dokumentacji technicznej oraz API zgodnie z nową implementacją.
