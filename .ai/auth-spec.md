# Specyfikacja modułu autentykacji i odzyskiwania hasła

## I. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1. Ogólna koncepcja

- Aplikacja będzie podzielona na dwie główne sekcje: tryb _non-auth_ (dla gości) oraz tryb _auth_ (dla zalogowanych użytkowników).
- Dla trybu auth zostaną wykorzystane dedykowane layouty oraz komponenty, które zapewnią spójny wygląd i funkcjonalność po zalogowaniu.

### 2. Nowe strony i komponenty

- Utworzenie nowych stron Astro:

  - `src/pages/auth/register.astro` – formularz rejestracji (US-001).
  - `src/pages/auth/login.astro` – formularz logowania (US-002).
  - `src/pages/auth/forgot-password.astro` – formularz inicjujący proces odzyskiwania hasła.
  - Opcjonalnie: `src/pages/auth/reset-password.astro` – strona do ustawienia nowego hasła, do której trafia użytkownik po kliknięciu linku przesłanego na email.

- Utworzenie komponentów React (z wykorzystaniem Shadcn/ui) do obsługi formularzy:
  - `RegisterForm` – pola: login (przyjmowany jako adres email), hasło, potwierdzenie hasła; walidacja zgodności haseł oraz unikalności loginu.
  - `LoginForm` – pola: login (przyjmowany jako adres email) oraz hasło; komunikaty o błędach przy niepoprawnych danych.
  - `ForgotPasswordForm` – pole: email, do wysyłania linku resetującego hasło.
  - `ResetPasswordForm` – pola: nowe hasło i jego potwierdzenie.

### 3. Rozdzielenie odpowiedzialności

- **Formularze i komponenty client-side React**:

  - Odpowiedzialne za walidację danych wejściowych (np. weryfikacja, czy oba hasła są identyczne, czy email jest w poprawnym formacie).
  - Zarządzanie stanem formularzy oraz interakcją z API (np. wywoływanie metod logowania, rejestracji czy resetowania hasła).

- **Strony Astro**:
  - Zarządzają routingiem, ładowaniem layoutów i przekazywaniem stanu autentykacji do komponentów React.
  - Umożliwiają renderowanie stron server-side z uwzględnieniem stanu użytkownika (np. przekierowania, middleware autoryzacyjne).

### 4. Walidacja i komunikaty błędów

- **Walidacja po stronie klienta**:

  - Real-time walidacja formularzy przy użyciu bibliotek (np. Yup) lub wbudowanych funkcji walidujących.
  - Wyświetlanie komunikatów takich jak: "Pole wymagane", "Hasło musi mieć co najmniej 6 znaków", "Hasła nie są zgodne", "Login już zajęty".

- **Obsługa błędów na poziomie API**:
  - Backend zwraca szczegółowe komunikaty błędów, które są następnie wyświetlane użytkownikowi.
  - Przykładowe scenariusze: błąd rejestracji (login zajęty), niepoprawne dane logowania, błędy przy wysyłce linku resetującego.

### 5. Kluczowe scenariusze

- **Rejestracja (US-001)**:

  - Użytkownik wypełnia formularz rejestracji, dane są walidowane po stronie klienta, a następnie przesyłane do backendu.
  - Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany do trybu auth.

- **Logowanie (US-002)**:

  - Użytkownik wypełnia formularz logowania, który po walidacji inicjuje żądanie do API logowania.
  - W przypadku błędnych danych wyświetlany jest stosowny komunikat.
  - Po pomyślnym zalogowaniu użytkownik zostaje przekierowany na stronę `/generate` w celu uzyskania pełnej funkcjonalności.

- **Wylogowanie (US-003)**:

  - W interfejsie aplikacji dostępny jest przycisk wylogowania, który wywołuje metodę logowania Supabase i resetuje stan użytkownika.

- **Odzyskiwanie hasła**:
  - Użytkownik podaje swój adres email w formularzu "forgot password";
  - System wysyła link resetujący hasło (poprzez Supabase Auth);
  - Użytkownik przechodzi do strony resetowania hasła, gdzie ustawia nowe hasło.

## II. LOGIKA BACKENDOWA

### 1. Struktura endpointów API

- **POST /api/auth/register**

  - Przyjmuje dane rejestracyjne (login/email, hasło, potwierdzenie hasła).
  - Waliduje dane wejściowe (sprawdza unikalność loginu, zgodność haseł).
  - Tworzy nowego użytkownika w bazie (integracja z Supabase Auth, który zarządza przechowywaniem hasła w sposób bezpieczny).

- **POST /api/auth/login**

  - Przyjmuje dane logowania (login/email, hasło).
  - Autoryzuje użytkownika przy użyciu Supabase Auth.

- **POST /api/auth/logout**

  - Inicjuje proces wylogowania, czyszcząc sesję użytkownika.

- **POST /api/auth/forgot-password**

  - Przyjmuje adres email, w celu wysłania linku resetującego hasło.

- **POST /api/auth/reset-password**
  - Przyjmuje token resetujący oraz nowe hasło, aktualizując dane użytkownika.

### 2. Modele danych

- **Model User**:
  - Kluczowe pola: `id`, `email` (lub `login`), `hashed_password`, `created_at`, `updated_at`.
  - Zarządzanie sesjami odbywa się poprzez Supabase Auth.

### 3. Walidacja danych wejściowych

- Użycie bibliotek walidacyjnych (np. Joi, Yup) do weryfikacji danych na poziomie API.
- Walidacja obejmuje: poprawność formatu email, długość hasła, zgodność haseł, unikalność loginu.

### 4. Obsługa wyjątków

- Centralny middleware do obsługi błędów w API, który przechwytuje i loguje wyjątki.
- Zwracanie czytelnych komunikatów błędów do klienta.

### 5. Renderowanie stron server-side

- Strony Astro dostosowują swoje renderowanie w zależności od stanu autentykacji użytkownika.
- Middleware sprawdzający autentykację dla stron wymagających logowania (np. dostęp do sekcji generowania fiszek).

## III. SYSTEM AUTENTYKACJI

### 1. Integracja z Supabase Auth

- Wykorzystanie Supabase Auth jako głównego mechanizmu zarządzania użytkownikami:
  - Rejestracja, logowanie, wylogowywanie oraz odzyskiwanie hasła realizowane przez wywołania API Supabase.
  - Przechowywanie sesji i tokenów, z możliwością integracji z Astro poprzez server-side rendering oraz client-side React.

### 2. Warstwy odpowiedzialności

- **Frontend (React, Astro)**:

  - Inicjuje żądania do API autentykacyjnego i zarządza stanem sesji (np. poprzez custom hook `useAuth`).
  - Komponenty React odpowiadają za walidację formularzy i przekazywanie danych do API.

- **Backend (API)**:
  - Odpowiada za dodatkową walidację, wywołania do Supabase Auth i obsługę logiki biznesowej związanej z autentykacją.

### 3. Serwisy i kontrakty

- Utworzenie serwisu `AuthService` dostarczającego metody:
  - `register`: rejestracja nowego użytkownika.
  - `login`: logowanie użytkownika.
  - `logout`: wylogowywanie użytkownika.
  - `sendResetEmail`: wysyłka emaila z linkiem resetującym hasło.
  - `resetPassword`: aktualizacja hasła użytkownika na podstawie tokenu resetującego.
- Definicje kontraktów (typy) dla danych użytkownika, sesji oraz odpowiedzi API.

### 4. Aspekty bezpieczeństwa

- Wszystkie endpointy autentykacyjne powinny być zabezpieczone za pomocą HTTPS oraz stosować odpowiednie mechanizmy ochrony (CORS, tokeny w ciasteczkach HTTP only lub bezpiecznym storage).
- Supabase Auth zapewnia dodatkową warstwę bezpieczeństwa przez wbudowane mechanizmy zarządzania sesjami.

---

## Podsumowanie

Moduł autentykacji i odzyskiwania hasła zostanie wdrożony poprzez integrację nowo utworzonych stron Astro oraz komponentów React z backendowym API, które wykorzystuje Supabase Auth.

Dzięki podziałowi odpowiedzialności:

- Frontend zajmie się walidacją formularzy, obsługą błędów na poziomie użytkownika oraz interakcją z API,
- Backend zapewni dodatkową walidację, obsługę wyjątków i komunikację z Supabase Auth,
- Całość systemu zostanie zabezpieczona przy użyciu najlepszych praktyk (HTTPS, CORS, bezpieczne przechowywanie tokenów),

architektura ta gwarantuje czytelność, skalowalność i bezpieczeństwo całego modułu autentykacji, zgodnie z wymaganiami projektu oraz stosowanym stackiem technologicznym (Astro 5, TypeScript 5, React 19, Tailwind 4, Shadcn/ui, Supabase).

Uwaga:

- Wszystkie założenia i scenariusze zawarte w specyfikacji są zgodne z wymaganiami przedstawionymi w dokumencie PRD.
- Pole "login" jest traktowane jako adres email, co zapewnia spójność między procesem rejestracji, logowania oraz mechanizmem odzyskiwania hasła.
- Po pomyślnym zalogowaniu użytkownik jest przekierowywany na stronę `/generate`, co umożliwia realizację funkcjonalności generowania fiszek według User Story US-004.
