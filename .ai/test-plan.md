# Plan testów dla projektu 10xDevsCards

## 1. Wprowadzenie

### 1.1 Cel dokumentu

- Opis planu testów dla aplikacji „10xDevsCards" w celu zapewnienia jakości i zgodności z wymaganiami.

### 1.2 Zakres dokumentu

- Testy obejmą wszystkie krytyczne moduły: uwierzytelnianie, generowanie kart, UI, API, integrację z bazą danych.

---

## 2. Zakres testów

### 2.1 Co będzie testowane

- Logika uwierzytelniania (login, rejestracja, reset hasła, wylogowanie).
- Frontendowe formularze i ich walidacje.
- Funkcjonalność strony `/generate`: wysyłanie zapytań, wyświetlanie wyników.
- Endpoints w `src/pages/api/*`.
- Komponenty UI (reakcje na zdarzenia, responsywność).
- Dostępność (A11y) zgodnie ze standardami WCAG.
- Wydajność aplikacji i API.

### 2.2 Co NIE będzie testowane

- Zewnętrzne integracje poza Supabase.
- Moduły zaprojektowane wyłącznie do testów wewnętrznych.

---

## 3. Strategia testowania

### 3.1 Testy jednostkowe

- Narzędzia: Vitest + Testing Library (React).
- Pokrycie: ≥ 80% kluczowych modułów `src/lib` i komponentów UI.
- Zakres:  
  • Funkcje w `src/lib` (np. `loginUser`, `registerUser`, walidacje).  
  • Renderowanie komponentów React.
  • TypeScript integration tests do weryfikacji typów.

### 3.2 Testy integracyjne

- MSW (Mock Service Worker) do mockowania API.
- Supabase Testing Framework dla integracji z bazą danych.
- TanStack Query Test dla stanów zapytań i mutacji API.
- Weryfikacja przepływów formularz → API → odpowiedź.

### 3.3 Testy end-to-end (E2E)

- Narzędzie: Playwright.
- Kluczowe scenariusze:
  1. Rejestracja → potwierdzenie mailowe → przekierowanie.
  2. Logowanie → dostęp do `/generate`.
  3. Reset hasła → zmiana hasła → logowanie.
  4. Generowanie kart → wizualna weryfikacja wyników.
  5. Wylogowanie → przekierowanie do `/auth/login`.
- Testy dostępności z axe-core zintegrowane z Playwright.

### 3.4 Testy UI i responsywności

- Storybook do izolowanego testowania komponentów.
- Chromatic do testów regresji wizualnych.
- Breakpointy:  
  • Mobile (≤ 640 px)  
  • Tablet (641–1024 px)  
  • Desktop (≥ 1025 px)

### 3.5 Testy wydajnościowe

- Grafana k6 do testów obciążeniowych API.
- Metryki Core Web Vitals mierzone z Playwright.
- Performance testing komponentów React z React Profiler.

---

## 4. Środowisko testowe

- Systemy: Windows 10 / Linux / macOS.
- Node.js v18+, pnpm/npm/yarn.
- Dedykowana instancja Supabase (emulator lokalny).
- Przeglądarki: Chrome, Firefox, Safari (headless i graficzne).
- CI: GitHub Actions (równoległe uruchamianie testów).
- Konteneryzacja środowiska testowego z Docker.

---

## 5. Harmonogram testów

| Faza   | Zakres                                                     | Czas           |
| ------ | ---------------------------------------------------------- | -------------- |
| Faza 1 | Konfiguracja środowiska, testy jednostkowe auth, Storybook | Tydzień 1      |
| Faza 2 | Testy integracyjne formularzy i API, MSW, TanStack Query   | Tydzień 2      |
| Faza 3 | Testy E2E i dostępności z Playwright                       | Tydzień 3      |
| Faza 4 | Testy wydajnościowe, wizualne z Chromatic                  | Tydzień 4      |
| Faza 5 | Raport końcowy                                             | Po zakończeniu |

---

## 6. Przypadki testowe (ogólny zarys)

### 6.1 Uwierzytelnianie

- TC-01: Poprawne logowanie (prawidłowe dane) → przekierowanie do `/generate`.
- TC-02: Logowanie z błędnym hasłem → komunikat błędu.
- TC-03: Rejestracja nowego użytkownika → email potwierdzający → przekierowanie.
- TC-04: Rejestracja z istniejącym emailem → obsługa błędu.
- TC-05: Reset hasła – poprawny tok i niepoprawne dane.

### 6.2 Generowanie kart

- TC-10: Wejście na `/generate` po zalogowaniu.
- TC-11: Wysłanie poprawnego formularza → wyświetlenie wyników.
- TC-12: Błędne dane wejściowe → walidacja i komunikaty.

### 6.3 UI i responsywność

- TC-20: Wyświetlanie elementów w breakpointach mobile/tablet/desktop.
- TC-21: Aktywne stany przycisków i linków.
- TC-22: Zgodność komponentów z designem w Storybook i Chromatic.

### 6.4 API endpoints

- TC-30: GET/POST/PUT/DELETE (jeśli dotyczy) → odpowiednie kody statusu i dane.
- TC-31: Dostęp niezalogowany → 401 Unauthorized.
- TC-32: Wydajność API pod obciążeniem (Grafana k6).

### 6.5 Dostępność

- TC-40: Zgodność z WCAG 2.1 AA dla kluczowych ścieżek użytkownika.
- TC-41: Obsługa klawiatury dla wszystkich interaktywnych elementów.
- TC-42: Kontrast kolorów i czytelność treści.

---

## 7. Kryteria akceptacji

- Pokrycie testami jednostkowymi ≥ 80%.
- Brak krytycznych błędów (severity 1–2).
- Wykonanie wszystkich zdefiniowanych przypadków testowych.
- E2E: 100% krytycznych scenariuszy zakończonych sukcesem.
- Wydajność: czas odpowiedzi API < 200ms dla 95% percentyla.
- Dostępność: brak krytycznych błędów WCAG 2.1 AA.

---

## 8. Raportowanie i śledzenie błędów

- Narzędzie: GitHub Issues (tagi: `bug/critical`, `bug/major`, `bug/minor`).
- Integracja z Chromatic i Playwright Test Reports.
- Szablon raportu:
  1. Kroki odtworzenia
  2. Oczekiwany rezultat
  3. Rezultat rzeczywisty
  4. Zrzuty ekranu/logi/nagrania testów
- Częstotliwość raportów:  
  • Codziennie podczas testów E2E  
  • Po zakończeniu faz unit/integracyjnych

---

## 9. Role i odpowiedzialności

- QA Lead: Koordynacja planu, przegląd wyników.
- QA Engineer: Przygotowanie i wykonanie testów, raportowanie.
- Developerzy: Naprawa błędów, code review testów unit, pisanie testów Storybook.
- DevOps: Konfiguracja i utrzymanie środowiska testowego, konteneryzacja.
- Accessibility Specialist: Nadzór nad testami dostępności.

---

## 10. Ryzyka i plan łagodzenia

- Niedostępność Supabase → użycie Supabase Testing Framework i emulatora lokalnego.
- Zmiany w API bez testów regresyjnych → MSW i TypeScript integration tests.
- Różnice w środowiskach deweloperskich → Docker, CI.
- Niska jakość testów UI → Storybook, Chromatic, code review.
- Problemy z wydajnością → wczesne testy z Grafana k6 i Core Web Vitals.
