# Flashcards API Documentation

## Przegląd

API Fiszek umożliwia zarządzanie fiszkami edukacyjnymi. Każda fiszka składa się z dwóch stron (przód i tył) i może pochodzić z dwóch źródeł: manualnego wprowadzenia przez użytkownika (MANUAL) lub generacji przez AI.

## Autoryzacja

Wszystkie endpointy wymagają autoryzacji przy użyciu tokena JWT w nagłówku Authorization:

```
Authorization: Bearer <token>
```

## Endpointy

### GET /api/flashcards

Pobiera paginowaną listę fiszek użytkownika.

#### Parametry Query

- `page` (opcjonalny, domyślnie: 1) - numer strony
- `limit` (opcjonalny, domyślnie: 10) - liczba elementów na stronie
- `source` (opcjonalny) - filtrowanie po źródle ("AI" lub "MANUAL")

#### Przykładowa odpowiedź

```json
{
  "flashcards": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "front": "What is TypeScript?",
      "back": "TypeScript is a strongly typed programming language that builds on JavaScript.",
      "source": "MANUAL",
      "user_id": "user-123",
      "created_at": "2024-03-15T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

### POST /api/flashcards

Tworzy nową fiszkę.

#### Request Body

```json
{
  "front": "Question text",
  "back": "Answer text"
}
```

#### Walidacja

- `front`: 1-200 znaków
- `back`: 1-500 znaków

### GET /api/flashcards/{id}

Pobiera szczegóły pojedynczej fiszki.

#### Parametry URL

- `id` - UUID fiszki

### PUT /api/flashcards/{id}

Aktualizuje istniejącą fiszkę.

#### Request Body

```json
{
  "front": "Updated question",
  "back": "Updated answer"
}
```

#### Walidacja

- `front`: 1-200 znaków
- `back`: 1-500 znaków

### DELETE /api/flashcards/{id}

Usuwa fiszkę.

#### Parametry URL

- `id` - UUID fiszki

## Kody odpowiedzi

- `200` - Sukces
- `201` - Zasób utworzony
- `204` - Sukces (brak treści)
- `400` - Nieprawidłowe żądanie
- `401` - Brak autoryzacji
- `404` - Zasób nie znaleziony
- `500` - Błąd serwera

## Obsługa błędów

W przypadku błędu, API zwraca obiekt z informacją o błędzie:

```json
{
  "error": "Opis błędu",
  "details": [] // opcjonalne szczegóły błędu
}
```

## Limity i ograniczenia

- Maksymalna długość pola `front`: 200 znaków
- Maksymalna długość pola `back`: 500 znaków
- Maksymalny limit paginacji: 100 elementów na stronę
- Minimalna długość pól `front` i `back`: 1 znak
