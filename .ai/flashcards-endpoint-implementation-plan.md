# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Przegląd punktu końcowego

Endpoint służy do tworzenia nowej fiszki w systemie. Użytkownik przesyła żądanie z treścią fiszki, a serwer zapisuje dane w bazie z automatycznym przypisaniem źródła "MANUAL" oraz identyfikatorem użytkownika pozyskanym z autoryzacji. Efektem jest zwrócenie utworzonej fiszki w formacie JSON wraz ze statusem 201 Created.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards`
- **Parametry**:
  - **Wymagane**:
    - `front`: Tekst z pytaniem lub treścią fiszki (string, maksymalnie 200 znaków).
    - `back`: Tekst z odpowiedzią lub wyjaśnieniem fiszki (string, maksymalnie 500 znaków).
  - **Opcjonalne**: Brak
- **Request Body**:
  Żądanie powinno zawierać JSON zgodny z poniższą strukturą:
  ```json
  {
    "front": "Treść pytania - maks. 200 znaków",
    "back": "Treść odpowiedzi - maks. 500 znaków"
  }
  ```

## 3. Wykorzystywane typy

- **Command Model**: `CreateFlashcardCommand`
  (Odpowiada za przesłanie pól: `front`, `back`.)
- **DTO**: `FlashcardDTO`
  (Zawiera właściwości: `id`, `front`, `back`, `source` oraz `created_at`, przy czym `source` ustawiane na "MANUAL".)

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - **Kod statusu**: 201 Created
  - **Treść odpowiedzi** (JSON):
    ```json
    {
      "id": "uuid",
      "front": "Treść fiszki",
      "back": "Treść odpowiedzi",
      "source": "MANUAL",
      "created_at": "timestamp"
    }
    ```
- **Błędy**:
  - 400 Bad Request – dla nieprawidłowych danych wejściowych (np. brak wymaganych pól lub przekroczenie limitów znaków).
  - 401 Unauthorized – gdy żądanie pochodzi od niezautoryzowanego użytkownika.
  - 500 Internal Server Error – dla niespodziewanych błędów podczas operacji bazy danych lub errorów po stronie serwera.

## 5. Przepływ danych

1. Użytkownik wysyła żądanie HTTP POST na adres `/api/flashcards` wraz z danymi JSON.
2. Warstwa serwera (Astro API route) przechwytuje żądanie i:
   - Sprawdza autoryzację – weryfikuje Bearer token i pozyskuje identyfikator użytkownika.
   - Parsuje i waliduje dane wejściowe przy pomocy schematu (np. wykorzystując bibliotekę Zod).
3. Po poprawnej walidacji wywoływana jest logika biznesowa, która:
   - Przypisuje stałą wartość pola `source` = "MANUAL".
   - Wykonuje operację INSERT na tabeli `flashcards` przy użyciu klienta Supabase przekazywanego z kontekstu.
4. Po wykonaniu operacji baza zwraca rekord nowo utworzonej fiszki.
5. Endpoint zwraca odpowiedź JSON wraz z kodem 201 Created.

## 6. Względy bezpieczeństwa

- **Autentykacja i autoryzacja**:  
  Żądanie musi zawierać poprawny Bearer token. Backend wykorzysta mechanizm Supabase Auth oraz RLS (Row Level Security) skonfigurowany dla tabeli `flashcards`, aby upewnić się, że użytkownik może operować tylko na swoich danych.
- **Walidacja danych wejściowych**:  
  Użycie Zod lub innej biblioteki zapewniającej walidację typów zgodnie z regułami:
  - `front` maksymalnie 200 znaków.
  - `back` maksymalnie 500 znaków.
- **Bezpieczeństwo danych**:  
  Dane przesyłane przez HTTPS, a wszelkie operacje bazy danych muszą obsługiwać potencjalne ataki związane z wstrzyknięciami SQL dzięki mechanizmom RLS i zapytaniom przygotowanym.

## 7. Obsługa błędów

- **Błędy walidacji (400 Bad Request)**:  
  Zwracane, gdy dane wejściowe nie odpowiadają wymaganym schematom (np. puste pola lub przekroczenie ograniczeń długości).
- **Błędy autoryzacji (401 Unauthorized)**:  
  Zwracane, gdy brak nagłówka `Authorization` lub token jest nieważny.
- **Błędy serwera (500 Internal Server Error)**:  
  Zwracane w przypadku problemów podczas komunikacji z bazą danych lub nieoczekiwanych wyjątków.
- **Logowanie błędów**:  
  Każdy wyjątek należy logować z odpowiednim komunikatem błędu (np. przy użyciu loggera) w celu diagnozy.

## 8. Rozważania dotyczące wydajności

- Wykorzystanie indeksu na kolumnie `user_id` w tabeli `flashcards` zapewnia optymalizację przy wyszukiwaniu i weryfikacji uprawnień.
- Walidacja danych wejściowych odbywa się przed próbą modyfikacji bazy, co minimalizuje zbędne operacje na bazie.
- Przy dużej liczbie równoczesnych żądań można wdrożyć dodatkowe mechanizmy kolejkowania lub caching, choć dla operacji tworzenia pojedynczych rekordów nie jest to krytyczne.

## 9. Etapy wdrożenia

1. **Utworzenie endpointu**:
   - Zdefiniowanie nowego pliku np. `src/pages/api/flashcards/index.ts`.
2. **Obsługa żądania**:
   - Uzyskanie danych z żądania i weryfikacja autoryzacji przy użyciu Supabase Auth oraz kontekstu.
3. **Walidacja danych**:
   - Zaimplementowanie walidacji wejściowych za pomocą Zod (lub podobnej biblioteki) zgodnie z ograniczeniami: maks. 200 znaków dla `front` i maks. 500 dla `back`.
4. **Logika biznesowa**:
   - Wyodrębnienie logiki tworzenia fiszki do osobnej funkcji lub serwisu w katalogu `src/lib/services` w celu ponownego użycia i łatwego testowania.
5. **Operacja na bazie danych**:
   - Wykonanie INSERT do tabeli `flashcards` z automatycznym przypisaniem wartości `source` = "MANUAL" oraz identyfikatorem użytkownika.
6. **Generowanie odpowiedzi**:
   - W przypadku powodzenia, zwrócenie nowego rekordu fiszki w formacie JSON oraz statusu 201.
7. **Obsługa wyjątków i logowanie błędów**:
   - Implementacja bloków try-catch oraz logowanie błędów, zwracając status 500 w przypadku krytycznych awarii.
8. **Dokumentacja**:
   - Aktualizacja dokumentacji API, w tym specyfikacji OpenAPI, dla ułatwienia dalszego rozwoju i wsparcia technicznego.
