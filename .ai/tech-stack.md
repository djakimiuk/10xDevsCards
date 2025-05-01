Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
- Cloudflare Pages do hostowania aplikacji

Testy:

- Testy jednostkowe:
  - Vitest + Testing Library (React) do testowania komponentów i funkcji
  - TypeScript integration tests do weryfikacji typów
- Testy integracyjne:
  - MSW (Mock Service Worker) do mockowania API
  - Supabase Testing Framework dla integracji z bazą danych
  - TanStack Query Test dla stanów zapytań i mutacji API
- Testy end-to-end (E2E):
  - Playwright do automatyzacji testów w przeglądarkach
  - axe-core zintegrowany z Playwright do testów dostępności
- Testy UI i wizualne:
  - Storybook do izolowanego testowania komponentów
  - Chromatic do testów regresji wizualnych
- Testy wydajnościowe:
  - Grafana k6 do testów obciążeniowych API
  - React Profiler do testów wydajności komponentów
