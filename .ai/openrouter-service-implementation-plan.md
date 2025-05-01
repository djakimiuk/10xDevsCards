# Plan wdrożenia usługi OpenRouter

## 1. Opis usługi

Usługa OpenRouter integruje interfejs API OpenRouter z systemem czatów opartych na LLM. Jej głównym celem jest wzbogacenie interakcji czatowych o dynamiczne odpowiedzi generowane przez LLM, przy zachowaniu elastycznej konfiguracji komunikatów (systemowy, użytkownika), formatu odpowiedzi, nazwy modelu oraz parametrów modelu.

## 2. Opis konstruktora

Konstruktor klasy `OpenRouterService` inicjuje instancję usługi poprzez:

- Walidację i przypisanie klucza API (pobrany z zmiennych środowiskowych).
- Ustawienie domyślnego komunikatu systemowego (np. "You are a helpful assistant.").
- Konfigurację nazwy modelu (np. `gpt-4`) oraz parametrów modelu (np. `{ temperature: 0.7, max_tokens: 150 }`).
- Ustawienie response_format według wzoru:  
  `{ type: 'json_schema', json_schema: { name: 'ChatCompletionResponse', strict: true, schema: { answer: 'string', reference: 'string' } } }`

## 3. Publiczne metody i pola

**Publiczne pola:**

1. `apiKey: string` – Przechowuje klucz API do autoryzacji.
2. `systemMessage: string` – Domyślny komunikat systemowy wysyłany do LLM.
3. `modelName: string` – Nazwa wybranego modelu (np. `gpt-4`).
4. `modelParams: object` – Konfiguracja parametrów modelu.
5. `responseFormat: object` – Schemat odpowiedzi, zgodny z wzorem:  
   `{ type: 'json_schema', json_schema: { name: 'ChatCompletionResponse', strict: true, schema: { answer: 'string', reference: 'string' } } }`

**Publiczne metody:**

1. `sendMessage(userMessage: string): Promise<ResponseType>` – Wysyła zapytanie do OpenRouter API, łącząc przekazany komunikat użytkownika z komunikatem systemowym.
2. `setModelParams(params: object): void` – Aktualizuje konfigurację parametrów modelu.
3. `getResponse(): ResponseType` – Zwraca przetworzoną odpowiedź po otrzymaniu odpowiedzi z API.

## 4. Prywatne metody i pola

**Prywatne pola:**

1. `_apiEndpoint: string` – URL interfejsu API OpenRouter.
2. `_logger` – Mechanizm logowania błędów i zdarzeń.

**Prywatne metody:**

1. `_formatPayload(userMessage: string): object` – Przygotowuje strukturę zapytania, łącząc:
   - Komunikat systemowy: np. "You are a helpful assistant."
   - Komunikat użytkownika: przekazany jako argument metody.
   - Response_format: zgodny z wzorem `{ type: 'json_schema', json_schema: { name: 'ChatCompletionResponse', strict: true, schema: { answer: 'string', reference: 'string' } } }`
   - Nazwę modelu i parametry modelu.
2. `_parseResponse(response: any): ResponseType` – Weryfikuje i parsuje odpowiedź API zgodnie z ustalonym schematem.
3. `_handleError(error: any): void` – Centralizowana obsługa błędów, logowanie i wyzwalanie odpowiednich mechanizmów retry lub fallback.

## 5. Obsługa błędów

**Potencjalne scenariusze błędów:**

1. Błąd połączenia sieciowego (np. brak dostępu do API).
2. Niepoprawny lub wygasły klucz API.
3. Nieprawidłowy format odpowiedzi lub błąd parsowania JSON.
4. Przekroczenie limitu czasu oczekiwania na odpowiedź.

**Strategie obsługi błędów:**

1. Wdrożenie mechanizmu retry z eksponencjalnym backoff.
2. Weryfikacja autoryzacji na poziomie konstruktora poprzez testowanie klucza API.
3. Walidacja struktury odpowiedzi (response_format) i rzucanie specyficznych błędów przy niezgodnościach.
4. Ustawienie limitów czasowych (timeout) i fallback mechanism na wypadek braku odpowiedzi.

## 6. Kwestie bezpieczeństwa

1. Klucz API przechowywany jest wyłącznie w zmiennych środowiskowych, np. `.env` (np. `OPENROUTER_API_KEY`).
2. Rate limiting zapytań do API oraz monitorowanie logów i błędów.

## 7. Plan wdrożenia krok po kroku

1. **Konfiguracja środowiska:**
   - Ustaw zmienne środowiskowe, w tym `OPENROUTER_API_KEY`.
   - Potwierdź, że projekt korzysta z Astro, TypeScript, React, Tailwind oraz Shadcn/ui.
2. **Implementacja modułu:**
   - Utwórz moduł `OpenRouterService` w katalogu `/src/lib`.
   - Zaimplementuj konstruktor oraz zdefiniuj pola: `apiKey`, `systemMessage`, `modelName`, `modelParams`, `responseFormat`.
3. **Implementacja metod publicznych:**
   - Zaimplementuj metodę `sendMessage`, która:
     - Łączy komunikat systemowy (np. "You are a helpful assistant.") z komunikatem użytkownika.
     - Buduje strukturę request payload, zawierającą `response_format`, `modelName` (np. `gpt-4`) oraz `modelParams` (np. `{ temperature: 0.7, max_tokens: 150 }`).
   - Udostępnij metody `setModelParams` oraz `getResponse`.
4. **Implementacja metod prywatnych:**
   - Zaimplementuj `_formatPayload`, `_parseResponse` oraz `_handleError`, aby zapewnić spójną logikę przetwarzania zapytań i odpowiedzi.
5. **Dodanie obsługi błędów:**
   - Wprowadź mechanizmy retry, timeout oraz walidację formatu odpowiedzi.
   - Zaimplementuj centralne logowanie błędów oraz komunikatów.
6. **Integracja z API:**
   - Utwórz endpoint API w `/src/pages/api`, który będzie wywoływał metody `OpenRouterService`.
   - Przetestuj komunikację między front-endem (React, Shadcn/ui) a endpointem API.

---

Ten przewodnik wdrożenia dostarcza kompletny plan integracji i konfiguracji usługi OpenRouter, obejmując wystandaryzowaną strukturę komunikatów, obsługę błędów, zabezpieczenia oraz szczegółowy plan wdrożenia, kompatybilny z używanym stackiem technologicznym.
