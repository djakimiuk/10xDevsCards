# Diagram przepływu autentykacji

Ten diagram przedstawia kompletny przepływ autentykacji w aplikacji, uwzględniając wszystkie kluczowe procesy: rejestrację, logowanie, weryfikację sesji, reset hasła oraz wylogowanie.

## Analiza procesu autentykacji

### 1. Zidentyfikowane przepływy autentykacji

- Rejestracja nowego użytkownika (US-001)
- Logowanie istniejącego użytkownika (US-002)
- Wylogowanie użytkownika (US-003)
- Proces resetowania hasła

### 2. Główni aktorzy

- Przeglądarka (interfejs użytkownika)
- Middleware Astro
- Endpointy API Astro
- Supabase Auth
- Baza danych

### 3. Procesy weryfikacji i odświeżania tokenów

- Zarządzanie tokenami przez Supabase
- Middleware wstrzykujący klienta Supabase
- Przechowywanie sesji w ciasteczkach HTTP-only
- Automatyczne odświeżanie tokenów

### 4. Kroki autentykacji

#### a) Rejestracja

- Walidacja formularza rejestracji
- Utworzenie konta w Supabase Auth
- Automatyczne logowanie po rejestracji
- Przekierowanie do aplikacji

#### b) Logowanie

- Weryfikacja poświadczeń
- Generowanie tokenu sesji
- Przekierowanie do /generate

#### c) Reset hasła

- Żądanie resetu
- Wysyłka maila z linkiem
- Ustawienie nowego hasła
- Automatyczne logowanie

#### d) Zarządzanie sesją

- Weryfikacja sesji na chronionych ścieżkach
- Automatyczne odświeżanie tokenów
- Czyszczenie sesji przy wylogowaniu

## Diagram sekwencji

```mermaid
%%{init: { 'theme': 'default', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '16px' } }}%%
sequenceDiagram
    autonumber

    participant Przeglądarka
    participant Middleware
    participant "Astro API" as API
    participant "Supabase Auth" as Auth

    %% Rejestracja
    rect rgba(200, 220, 240, 0.4)
        Note over Przeglądarka,Auth: Proces Rejestracji
        Przeglądarka->>API: POST /api/auth/register {email, hasło}
        API->>API: Walidacja danych
        API->>Auth: Utworzenie konta
        Auth-->>API: Potwierdzenie utworzenia
        API-->>Przeglądarka: Sukces + Token sesji
        Przeglądarka->>Przeglądarka: Zapisz token w HTTP-only cookie
        Przeglądarka->>API: Przekierowanie do /generate
    end

    %% Logowanie
    rect rgba(220, 240, 200, 0.4)
        Note over Przeglądarka,Auth: Proces Logowania
        Przeglądarka->>API: POST /api/auth/login {email, hasło}
        API->>Auth: Weryfikacja poświadczeń
        Auth-->>API: Token sesji
        API-->>Przeglądarka: Sukces + Token sesji
        Przeglądarka->>Przeglądarka: Zapisz token w HTTP-only cookie
        Przeglądarka->>API: Przekierowanie do /generate
    end

    %% Weryfikacja sesji
    rect rgba(240, 220, 220, 0.4)
        Note over Przeglądarka,Auth: Weryfikacja Sesji
        Przeglądarka->>Middleware: Żądanie chronionej strony
        activate Middleware
        Middleware->>Auth: Sprawdź token sesji
        alt Token ważny
            Auth-->>Middleware: Token OK
            Middleware->>API: Kontynuuj żądanie
            API-->>Przeglądarka: Odpowiedź
        else Token wygasł
            Auth-->>Middleware: Token wygasł
            Middleware->>Auth: Odśwież token
            Auth-->>Middleware: Nowy token
            Middleware-->>Przeglądarka: Ustaw nowy token + Kontynuuj
        else Brak/nieprawidłowy token
            Middleware-->>Przeglądarka: Przekieruj do /auth/login
        end
        deactivate Middleware
    end

    %% Reset hasła
    rect rgba(240, 240, 200, 0.4)
        Note over Przeglądarka,Auth: Reset Hasła
        Przeglądarka->>API: POST /api/auth/forgot-password {email}
        API->>Auth: Żądanie resetu hasła
        Auth->>Auth: Generuj token resetu
        Auth-->>Przeglądarka: Email z linkiem do resetu

        Przeglądarka->>API: GET /auth/reset-password?token=xyz
        API->>Auth: Weryfikuj token resetu
        Auth-->>API: Token OK
        API-->>Przeglądarka: Formularz nowego hasła

        Przeglądarka->>API: POST /api/auth/reset-password {token, hasło}
        API->>Auth: Aktualizuj hasło
        Auth-->>API: Potwierdzenie + Nowy token sesji
        API-->>Przeglądarka: Sukces + Przekierowanie do /generate
    end

    %% Wylogowanie
    rect rgba(220, 220, 240, 0.4)
        Note over Przeglądarka,Auth: Wylogowanie
        Przeglądarka->>API: POST /api/auth/logout
        API->>Auth: Unieważnij sesję
        Auth-->>API: Potwierdzenie
        API-->>Przeglądarka: Usuń token + Przekieruj do /
    end
```
