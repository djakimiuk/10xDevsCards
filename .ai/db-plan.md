````markdown
# Schemat Bazy Danych PostgreSQL dla AI Flashcard Generator (MVP)

Dokument ten definiuje strukturę bazy danych PostgreSQL dla wersji MVP aplikacji AI Flashcard Generator, hostowanej na Supabase.

## 1. Lista Tabel

### 1.1. `flashcards`

Przechowuje fiszki użytkowników.

| Nazwa Kolumny | Typ Danych    | Ograniczenia                                              | Opis                                        |
| :------------ | :------------ | :-------------------------------------------------------- | :------------------------------------------ |
| `id`          | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                | Unikalny identyfikator fiszki               |
| `user_id`     | `uuid`        | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Identyfikator użytkownika (z Supabase Auth) |
| `front`       | `text`        | `NOT NULL`, `CHECK (char_length(front) <= 200)`           | Treść "przodu" fiszki (Markdown)            |
| `back`        | `text`        | `NOT NULL`, `CHECK (char_length(back) <= 500)`            | Treść "tyłu" fiszki (Markdown)              |
| `source`      | `text`        | `NOT NULL`, `CHECK (source IN ('AI', 'MANUAL'))`          | Źródło pochodzenia fiszki                   |
| `created_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                               | Znacznik czasu utworzenia                   |
| `updated_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                               | Znacznik czasu ostatniej modyfikacji        |

### 1.2. `generation_requests`

Śledzi żądania generowania fiszek przez AI.

| Nazwa Kolumny | Typ Danych    | Ograniczenia                                                          | Opis                                        |
| :------------ | :------------ | :-------------------------------------------------------------------- | :------------------------------------------ |
| `id`          | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                            | Unikalny identyfikator żądania generowania  |
| `user_id`     | `uuid`        | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`             | Identyfikator użytkownika (z Supabase Auth) |
| `source_text` | `text`        | `NOT NULL`, `CHECK (char_length(source_text) BETWEEN 1000 AND 10000)` | Tekst źródłowy do generowania               |
| `status`      | `text`        | `NOT NULL`, `CHECK (status IN ('processing', 'completed', 'failed'))` | Status przetwarzania żądania                |
| `created_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                           | Znacznik czasu utworzenia                   |
| `updated_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                           | Znacznik czasu ostatniej modyfikacji        |

### 1.3. `ai_candidate_flashcards`

Przechowuje tymczasowo kandydatów na fiszki wygenerowanych przez AI przed recenzją.

| Nazwa Kolumny | Typ Danych    | Ograniczenia                                                       | Opis                                          |
| :------------ | :------------ | :----------------------------------------------------------------- | :-------------------------------------------- |
| `id`          | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                         | Unikalny identyfikator kandydata              |
| `request_id`  | `uuid`        | `NOT NULL`, `REFERENCES generation_requests(id) ON DELETE CASCADE` | Identyfikator powiązanego żądania generowania |
| `front`       | `text`        | `NOT NULL`, `CHECK (char_length(front) <= 200)`                    | Treść "przodu" kandydata (Markdown)           |
| `back`        | `text`        | `NOT NULL`, `CHECK (char_length(back) <= 500)`                     | Treść "tyłu" kandydata (Markdown)             |
| `created_at`  | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                        | Znacznik czasu utworzenia                     |

## 2. Relacje między Tabelami

- **`auth.users` (Supabase) 1 <-> N `flashcards`**: Jeden użytkownik może mieć wiele fiszek. Usunięcie użytkownika kaskadowo usuwa jego fiszki.
- **`auth.users` (Supabase) 1 <-> N `generation_requests`**: Jeden użytkownik może mieć wiele żądań generowania. Usunięcie użytkownika kaskadowo usuwa jego żądania.
- **`generation_requests` 1 <-> N `ai_candidate_flashcards`**: Jedno żądanie generowania może skutkować wieloma kandydatami na fiszki. Usunięcie żądania kaskadowo usuwa jego kandydatów.

## 3. Indeksy

W celu poprawy wydajności zapytań, tworzone są następujące indeksy:

- `CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);`
- `CREATE INDEX idx_generation_requests_user_id ON generation_requests(user_id);`
- `CREATE INDEX idx_ai_candidate_flashcards_request_id ON ai_candidate_flashcards(request_id);`

## 4. Zasady PostgreSQL (Row Level Security - RLS)

RLS zostanie włączone dla tabel zawierających dane użytkowników, aby zapewnić, że użytkownicy mają dostęp tylko do swoich danych.

### 4.1. Włączenie RLS

```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_candidate_flashcards ENABLE ROW LEVEL SECURITY;
```
````

### 4.2. Polityki dla `flashcards`

```sql
-- Użytkownicy mogą widzieć tylko swoje fiszki
CREATE POLICY "Allow individual read access" ON flashcards FOR SELECT
USING (auth.uid() = user_id);

-- Użytkownicy mogą tworzyć fiszki dla siebie
CREATE POLICY "Allow individual insert access" ON flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Użytkownicy mogą modyfikować tylko swoje fiszki
CREATE POLICY "Allow individual update access" ON flashcards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Użytkownicy mogą usuwać tylko swoje fiszki
CREATE POLICY "Allow individual delete access" ON flashcards FOR DELETE
USING (auth.uid() = user_id);

-- Zezwolenie dla roli service_role (np. dla funkcji backendowych)
CREATE POLICY "Allow service_role access" ON flashcards FOR ALL
USING (auth.role() = 'service_role'); -- Lub specyficzne polityki dla service_role
```

### 4.3. Polityki dla `generation_requests`

```sql
-- Użytkownicy mogą widzieć tylko swoje żądania
CREATE POLICY "Allow individual read access" ON generation_requests FOR SELECT
USING (auth.uid() = user_id);

-- Użytkownicy mogą tworzyć żądania dla siebie
CREATE POLICY "Allow individual insert access" ON generation_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Użytkownicy mogą modyfikować tylko swoje żądania (np. status) - MOŻE BYĆ WYŁĄCZONE jeśli modyfikacje robi tylko backend
CREATE POLICY "Allow individual update access" ON generation_requests FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Użytkownicy mogą usuwać tylko swoje żądania (jeśli dozwolone) - MOŻE BYĆ WYŁĄCZONE
CREATE POLICY "Allow individual delete access" ON generation_requests FOR DELETE
USING (auth.uid() = user_id);

-- Zezwolenie dla roli service_role
CREATE POLICY "Allow service_role access" ON generation_requests FOR ALL
USING (auth.role() = 'service_role');
```

### 4.4. Polityki dla `ai_candidate_flashcards`

```sql
-- Użytkownicy mogą widzieć kandydatów powiązanych z ich żądaniami
-- Wymaga JOIN lub subquery do sprawdzenia user_id w generation_requests
CREATE POLICY "Allow individual read access" ON ai_candidate_flashcards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM generation_requests gr
    WHERE gr.id = ai_candidate_flashcards.request_id AND gr.user_id = auth.uid()
  )
);

-- Wstawianie kandydatów powinno być robione przez backend (service_role)
CREATE POLICY "Allow backend insert access" ON ai_candidate_flashcards FOR INSERT
WITH CHECK (auth.role() = 'service_role'); -- Lub bardziej szczegółowa logika

-- Modyfikacja kandydatów przez użytkownika (podczas recenzji)
CREATE POLICY "Allow individual update access" ON ai_candidate_flashcards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM generation_requests gr
    WHERE gr.id = ai_candidate_flashcards.request_id AND gr.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM generation_requests gr
    WHERE gr.id = ai_candidate_flashcards.request_id AND gr.user_id = auth.uid()
  )
);

-- Usuwanie kandydatów przez użytkownika (odrzucenie) lub przez backend (po akceptacji)
CREATE POLICY "Allow individual/backend delete access" ON ai_candidate_flashcards FOR DELETE
USING (
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM generation_requests gr
    WHERE gr.id = ai_candidate_flashcards.request_id AND gr.user_id = auth.uid()
  )
);

-- Zezwolenie dla roli service_role
CREATE POLICY "Allow service_role access" ON ai_candidate_flashcards FOR ALL
USING (auth.role() = 'service_role');
```

## 5. Dodatkowe Uwagi

- **`updated_at` Trigger**: Kolumny `updated_at` w tabelach `flashcards` i `generation_requests` wymagają funkcji triggera do automatycznej aktualizacji przy każdej zmianie rekordu. Można użyć standardowej funkcji dostępnej w wielu przykładach Supabase/PostgreSQL.

  ```sql
  -- Przykładowa funkcja triggera
  CREATE OR REPLACE FUNCTION handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Przykładowe przypisanie triggera
  CREATE TRIGGER on_flashcards_update
  BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

  CREATE TRIGGER on_generation_requests_update
  BEFORE UPDATE ON generation_requests
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
  ```

- **Typy Enum**: Rozważono użycie typów `ENUM` dla kolumn `source` i `status` dla lepszej integralności danych, jednak dla prostoty MVP zdecydowano się na `TEXT` z ograniczeniami `CHECK`.
- **Autentykacja**: Cały system autentykacji opiera się na wbudowanym rozwiązaniu Supabase Auth. Tabela `auth.users` jest centralnym punktem odniesienia dla identyfikatorów użytkowników.
- **Role**: Polityki RLS uwzględniają dostęp dla standardowych użytkowników (`auth.uid()`) oraz dla roli `service_role`, która będzie używana przez logikę backendową (np. Supabase Edge Functions) do operacji wymagających szerszych uprawnień (np. tworzenie kandydatów AI, aktualizacja statusu żądania).

```

```
