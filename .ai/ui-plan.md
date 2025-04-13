# Architektura UI dla AI Flashcard Generator

## 1. Przegląd struktury UI

UI aplikacji opiera się na wyraźnym podziale na kluczowe widoki, z których każdy realizuje określoną funkcję w procesie korzystania z aplikacji. Po autentykacji użytkownik widzi górny pasek nawigacyjny (Topbar) umożliwiający dostęp do głównych funkcjonalności. Interfejs został zaprojektowany, aby zapewnić spójne i intuicyjne doświadczenie użytkownika, z uwzględnieniem zasad dostępności i bezpieczeństwa (walidacja danych, inline komunikaty o błędach). Całość korzysta z responsywnego designu opartego na Tailwind, gotowych komponentów z Shadcn/ui oraz React.

## 2. Lista widoków

- **Ekran logowania**

  - Ścieżka: `/login`
  - Główny cel: Umożliwienie użytkownikowi logowania przy użyciu loginu i hasła.
  - Kluczowe informacje: Formularz logowania, komunikaty o błędach autentykacji.
  - Kluczowe komponenty: Formularz, pola input, przycisk submit, komunikaty inline.
  - UX, dostępność i bezpieczeństwo: Prosty, czytelny interfejs z wyraźnymi etykietami; walidacja danych oraz komunikaty bez ujawniania wrażliwych informacji.

- **Dashboard**

  - Ścieżka: `/dashboard`
  - Główny cel: Główny ekran po zalogowaniu, oferujący dostęp do pozostałych funkcji aplikacji.
  - Kluczowe informacje: Status konta, skróty do funkcji (generowanie fiszek, lista fiszek, sesje powtórkowe).
  - Kluczowe komponenty: Topbar (nawigacja), karty/elementy skrótów.
  - UX, dostępność i bezpieczeństwo: Intuicyjne rozmieszczenie, dostęp tylko dla autoryzowanych użytkowników.

- **Widok generowania fiszek przez AI**

  - Ścieżka: `/generate`
  - Główny cel: Umożliwienie użytkownikowi wklejenia tekstu (1000-10000 znaków) i inicjowanie procesu generowania fiszek przez AI i ich rewizję (zaakceptuj, edytuj, odrzuć)
  - Kluczowe informacje: Pole tekstowe, przycisk generowania, loading indicator (skeleton), komunikaty o błędach (np. nieodpowiednia długość tekstu), przyciski akceptacji, edycji lub odrzucania dla każdej fiszki. 
  - Kluczowe komponenty: Pole tekstowe, przycisk start, wskaźnik ładowania, lista propozycji fiszek do recenzji, przyciski akcji (zapisz wszystkie, zapisz zaakceptowane).
  - UX, dostępność i bezpieczeństwo: Jasne instrukcje, inline błędy, walidacja danych wejściowych.

- **Widok listy fiszek**

  - Ścieżka: `/flashcards`
  - Główny cel: Prezentacja zapisanych fiszek z możliwością edycji (przez modal) i usunięcia.
  - Kluczowe informacje: Lista fiszek (przód i tył)
  - Kluczowe komponenty: Tabela/lista fiszek, modal edycji, przyciski edycji, usuwania.
  - UX, dostępność i bezpieczeństwo: Czytelna prezentacja, potwierdzenia operacji usunięcia, inline komunikaty o błędach i walidacja (limity znaków).

  
- **Panel użytkownika**

  - Ścieżka: `/profile`
  - Główny cel: Zarządzanie informacjami o koncie użytkownika i ustawieniami.
  - Kluczowe informacje: Dane użytkownika, opocje edycji profilu, przycisk wylogowania
  - Kluczowe komponenty: Formularz edycji profilu, przyciski akcji.
  - UX, dostępność i bezpieczeństwo: Bezpieczne wylogowanie, łatwy dostęp do ustawień, prosty i czytelny interfejs.

- **Ekran sesji powtórkowych**
  - Ścieżka: `/review`
  - Główny cel: Przeprowadzenie sesji nauki opartych na algorytmie spaced repetition, prezentujących fiszki do powtórki.
  - Kluczowe informacje: Prezentacja przodu fiszki, przyciski do odkrywania tyłu i oceny trudności fiszki (np. „łatwe”, „trudne”).
  - Kluczowe komponenty: Panel fiszki, przycisk „pokaż tył”, opcje oceny.
  - UX, dostępność i bezpieczeństwo: Minimalistyczny interfejs skupiony na treści, duże interaktywne przyciski, potwierdzenie działania.

## 3. Mapa podróży użytkownika

1. Użytkownik odwiedza stronę logowania i wprowadza dane logowania.
2. Po udanym logowaniu trafia na dashboard, gdzie widzi topbar i skróty do głównych funkcjonalności.
3. Z dashboardu wybiera opcję „Generuj fiszki”, przechodząc do widoku generowania fiszek.
4. W widoku generowania, użytkownik wkleja odpowiedni tekst i inicjuje proces generowania, obserwując loading indicator.
5. Po zakończeniu generowania wyświetlana jest lista propozycji fiszek, którą użytkownik może przeglądać.
6. Użytkownik wybiera edycję pojedynczej fiszki (modal) dla ewentualnych korekt, a następnie zatwierdza zmiany.
7. Po edycji stosuje mechanizm bulk save, wybierając opcję „zapisz wszystkie” lub „zapisz zatwierdzone”.
8. Jeśli przynajmniej jedna fiszka jest zapisana, użytkownik może przejść do sesji powtórkowej.
9. W sesji powtórkowej użytkownik przegląda fiszki, odsłania odpowiedzi i dokonuje oceny, co umożliwia planowanie kolejnych powtórek.

## 4. Układ i struktura nawigacji

- **Topbar Navigation Menu**: Wyświetlany wyłącznie dla autoryzowanych użytkowników, zawiera linki do głównych widoków: Dashboard, Generowanie fiszek, Lista fiszek, Sesje powtórkowe.
- **Linki i przyciski na stronie**: Umożliwiają przejście między widokami, np. przyciski w dashboardzie, linki w topbarze.
- **Breadcrumbs lub wizualne podkreślenie aktywnego widoku**: Pomagają orientować się użytkownikowi w aktualnej lokalizacji w interfejsie.
- **Powiadomienia inline**: Wyświetlają komunikaty o błędach, ostrzeżenia dotyczące wygasających sesji JWT oraz potwierdzenia akcji użytkownika, bez zakłócania głównego przepływu interakcji.

## 5. Kluczowe komponenty

- **Formularz autentykacji**: Służy do logowania użytkowników, zawiera mechanizmy walidacji oraz komunikaty o błędach.
- **Topbar Navigation**: Umożliwia szybki dostęp do głównych widoków i zapewnia spójny układ nawigacyjny po autoryzacji.
- **Modal edycji**: Umożliwia indywidualną edycję fiszek, zawiera pola tekstowe do zmiany zawartości fiszki oraz przyciski potwierdzenia i anulowania.
- **Loading Indicator**: Komponent wizualny informujący o postępie operacji, np. podczas generowania fiszek przez AI.
- **Lista/Tabela fiszek**: Prezentuje zapisane fiszki z opcjami edycji, usunięcia i bulk save, dbając o czytelność i dostępność.
- **Komponent sesji nauki**: Wyświetla pojedynczą fiszkę, umożliwia odsłanianie odpowiedzi i ocenę trudności, wspierając proces powtórek zgodnie z algorytmem spaced repetition.
