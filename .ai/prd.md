# Dokument wymagań produktu (PRD) - AI Flashcard Generator

## 1. Przegląd produktu

AI Flashcard Generator to aplikacja webowa zaprojektowana, aby pomóc użytkownikom, w szczególności osobom uczącym się programowania, w efektywnym tworzeniu fiszek edukacyjnych. Aplikacja wykorzystuje sztuczną inteligencję do automatycznego generowania fiszek na podstawie dostarczonego przez użytkownika tekstu, znacząco redukując czas potrzebny na ich manualne przygotowanie. Użytkownicy mogą również tworzyć fiszki ręcznie, zarządzać swoimi zestawami oraz wykorzystywać je w procesie nauki opartym o metodę powtórek rozłożonych w czasie (spaced repetition), dzięki integracji z gotową biblioteką open-source. Aplikacja w wersji MVP skupia się na podstawowej funkcjonalności generowania, zarządzania i nauki, z prostym systemem kont użytkowników do przechowywania danych.

## 2. Problem użytkownika

Manualne tworzenie wysokiej jakości fiszek edukacyjnych, szczególnie zawierających fragmenty kodu lub złożone koncepcje techniczne, jest procesem czasochłonnym i żmudnym. Ten wysiłek często zniechęca potencjalnych użytkowników do korzystania z wysoce efektywnej metody nauki, jaką jest spaced repetition (powtórki rozłożone w czasie), mimo jej udowodnionej skuteczności w zapamiętywaniu informacji. Osoby uczące się programowania potrzebują szybkiego sposobu na przekształcanie materiałów (np. dokumentacji, artykułów, notatek) w fiszki, zachowując przy tym istotne formatowanie, takie jak bloki kodu.

## 3. Wymagania funkcjonalne

Wersja MVP (Minimum Viable Product) aplikacji będzie zawierać następujące funkcjonalności:

- FR-001: System kont użytkowników:
  - Rejestracja nowego użytkownika za pomocą loginu i hasła.
  - Logowanie istniejącego użytkownika za pomocą loginu i hasła.
- FR-002: Generowanie fiszek przez AI:
  - Możliwość wprowadzenia (wklejenia) tekstu źródłowego o długości od 1000 do 10 000 znaków.
  - Wykorzystanie modelu AI do generowania propozycji fiszek (przód/tył) na podstawie wprowadzonego tekstu.
  - Zachowanie podstawowego formatowania tekstu, w tym formatowania bloków kodu, w generowanych fiszkach.
  - Obsługa limitów znaków dla fiszek: max 200 znaków dla "przodu" i max 500 znaków dla "tyłu".
  - Mechanizm ponawiania próby generowania w przypadku niepowodzenia po stronie AI.
- FR-003: Proces recenzji fiszek wygenerowanych przez AI:
  - Prezentacja wygenerowanych kandydatów na fiszki w formie listy.
  - Możliwość zaakceptowania pojedynczego kandydata (dodanie do bazy fiszek użytkownika).
  - Możliwość edycji treści ("przód" i/lub "tył") kandydata przed akceptacją.
  - Możliwość odrzucenia pojedynczego kandydata (nie zostanie zapisany).
- FR-004: Manualne tworzenie fiszek:
  - Dostęp do prostego formularza umożliwiającego ręczne wprowadzenie treści dla "przodu" i "tyłu" fiszki.
  - Zapisanie manualnie stworzonej fiszki w bazie danych użytkownika.
- FR-005: Zarządzanie fiszkami:
  - Przeglądanie listy wszystkich zapisanych fiszek powiązanych z kontem użytkownika.
  - Możliwość edycji treści ("przód" i "tył") istniejącej fiszki.
  - Możliwość usunięcia istniejącej fiszki.
- FR-006: Integracja z algorytmem Spaced Repetition (SR):
  - Wykorzystanie wybranej biblioteki open-source implementującej algorytm SR.
  - Możliwość rozpoczęcia sesji nauki/powtórek dla fiszek użytkownika.
  - Prezentowanie fiszek do powtórki zgodnie z logiką zintegrowanej biblioteki SR.
  - Możliwość oceny przez użytkownika stopnia znajomości danej fiszki podczas sesji nauki (co jest wymagane przez algorytm SR do planowania kolejnych powtórek).
- FR-007: Podstawowa obsługa błędów:
  - Wyświetlanie prostych, zrozumiałych komunikatów dla użytkownika w przypadku typowych błędów (np. nieudane logowanie, błąd generowania fiszek przez AI, przekroczenie limitu znaków tekstu wejściowego).

## 4. Granice produktu

Następujące funkcjonalności i cechy NIE wchodzą w zakres wersji MVP:

- Opracowanie i implementacja własnego, zaawansowanego algorytmu Spaced Repetition (jak np. w SuperMemo czy Anki). Korzystamy z gotowej biblioteki.
- Import fiszek lub materiałów z plików w formatach innych niż czysty tekst (np. PDF, DOCX, HTML, Markdown). Akceptowany jest tylko tekst wklejony do dedykowanego pola.
- Funkcje społecznościowe: współdzielenie zestawów fiszek między użytkownikami, publiczne repozytoria fiszek, komentowanie.
- Integracje z zewnętrznymi platformami edukacyjnymi, systemami LMS, API innych serwisów.
- Dedykowane aplikacje mobilne (iOS, Android). Produkt będzie dostępny wyłącznie jako aplikacja webowa.
- Zaawansowane formatowanie tekstu w fiszkach (inne niż podstawowe zachowanie formatowania kodu). Fiszki początkowo będą obsługiwać tylko tekst.
- Logowanie za pomocą zewnętrznych dostawców tożsamości (np. Google, Facebook, GitHub).
- Monitorowanie i optymalizacja kosztów zapytań do API AI.
- Zaawansowana analityka i raportowanie postępów w nauce (poza podstawową funkcjonalnością algorytmu SR).
- Automatyczne skracanie tekstu wejściowego dłuższego niż 10 000 znaków "z zachowaniem sensu merytorycznego" - w MVP tekst zbyt długi będzie odrzucany lub użytkownik zostanie poproszony o jego skrócenie.
- Obsługa tekstu wejściowego krótszego niż 1000 znaków - w MVP taki tekst będzie odrzucany z komunikatem dla użytkownika.

## 5. Historyjki użytkowników

### Zarządzanie kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik chcę móc założyć konto w aplikacji używając unikalnego loginu i hasła, aby móc zapisywać i zarządzać moimi fiszkami.
- Kryteria akceptacji:

  - Formularz rejestracji zawiera pola na login i hasło (oraz potwierdzenie hasła).
  - System sprawdza, czy podany login nie jest już zajęty.
  - System sprawdza, czy hasło i jego potwierdzenie są identyczne.
  - Hasło jest przechowywane w bezpieczny sposób (np. hashowane).
  - Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany do głównego widoku aplikacji.
  - W przypadku błędu (np. zajęty login, niepasujące hasła) wyświetlany jest odpowiedni komunikat.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik chcę móc zalogować się do aplikacji używając mojego loginu i hasła, aby uzyskać dostęp do moich zapisanych fiszek i funkcjonalności aplikacji.
- Kryteria akceptacji:

  - Formularz logowania zawiera pola na login i hasło.
  - System weryfikuje poprawność podanych danych logowania.
  - Po pomyślnym zalogowaniu użytkownik jest przekierowany do głównego widoku aplikacji i ma dostęp do swoich danych.
  - W przypadku podania błędnych danych wyświetlany jest odpowiedni komunikat.

- ID: US-003
- Tytuł: Wylogowanie użytkownika
- Opis: Jako zalogowany użytkownik chcę móc się wylogować z aplikacji, aby zakończyć moją sesję.
- Kryteria akceptacji:
  - W interfejsie aplikacji dostępna jest opcja "Wyloguj".
  - Po kliknięciu "Wyloguj" sesja użytkownika jest kończona.
  - Użytkownik jest przekierowany do strony logowania lub strony głównej dla niezalogowanych użytkowników.

### Generowanie fiszek przez AI

- ID: US-004
- Tytuł: Inicjowanie generowania fiszek przez AI
- Opis: Jako zalogowany użytkownik chcę móc wkleić tekst (np. fragment dokumentacji programistycznej) do dedykowanego pola i zainicjować proces generowania fiszek przez AI, aby szybko stworzyć materiały do nauki.
- Kryteria akceptacji:

  - Dostępne jest pole tekstowe do wklejenia tekstu źródłowego.
  - Dostępny jest przycisk inicjujący proces generowania.
  - System sprawdza, czy długość wklejonego tekstu mieści się w zakresie 1000 - 10 000 znaków.
  - Jeśli tekst jest za krótki (< 1000 znaków), wyświetlany jest komunikat błędu i generowanie nie jest uruchamiane.
  - Jeśli tekst jest za długi (> 10 000 znaków), wyświetlany jest komunikat błędu i generowanie nie jest uruchamiane.
  - Po kliknięciu przycisku generowania (dla poprawnego tekstu), system wysyła tekst do API AI z odpowiednio przygotowanym promptem.
  - Podczas przetwarzania przez AI użytkownik widzi wskaźnik postępu lub informację o trwającym procesie.

- ID: US-005
- Tytuł: Recenzja i akceptacja fiszek wygenerowanych przez AI
- Opis: Jako użytkownik, po zakończeniu generowania przez AI, chcę zobaczyć listę proponowanych fiszek (kandydatów) i móc je przejrzeć, zaakceptować, edytować lub odrzucić, aby wybrać te, które trafią do mojej bazy.
- Kryteria akceptacji:

  - Wygenerowani kandydaci na fiszki są prezentowani jako lista, pokazując treść "przodu" i "tyłu" każdej propozycji.
  - Formatowanie kodu (jeśli występuje w tekście źródłowym i zostało poprawnie zidentyfikowane przez AI) jest widoczne w proponowanych fiszkach.
  - Przy każdej propozycji dostępne są opcje: "Akceptuj", "Edytuj", "Odrzuć".
  - Kliknięcie "Akceptuj" powoduje zapisanie fiszki w bazie danych użytkownika i usunięcie jej z listy propozycji.
  - Kliknięcie "Odrzuć" powoduje usunięcie propozycji z listy bez zapisywania.
  - Kliknięcie "Edytuj" otwiera formularz edycji dla danej propozycji, umożliwiając zmianę treści "przodu" i "tyłu" (z zachowaniem limitów znaków: 200 dla przodu, 500 dla tyłu).
  - Po edycji użytkownik może zapisać zmiany (co jest równoznaczne z akceptacją i zapisem do bazy) lub anulować edycję.
  - Zaakceptowane fiszki (bezpośrednio lub po edycji) są oznaczane w bazie danych jako pochodzące z generowania AI.

- ID: US-006
- Tytuł: Obsługa błędu generowania fiszek przez AI
- Opis: Jako użytkownik chcę otrzymać informację zwrotną, jeśli proces generowania fiszek przez AI nie powiedzie się (np. z powodu błędu API, problemów sieciowych, braku możliwości wygenerowania sensownych fiszek), aby wiedzieć, że operacja nie została ukończona.
- Kryteria akceptacji:
  - Jeśli API AI zwróci błąd lub system napotka inny problem uniemożliwiający wygenerowanie fiszek, proces recenzji (US-005) nie jest inicjowany.
  - System podejmuje próbę ponownego wygenerowania fiszek (zgodnie z decyzją nr 4 z conversation_summary).
  - Jeśli ponowna próba również się nie powiedzie, użytkownikowi wyświetlany jest prosty komunikat informujący o niepowodzeniu generowania fiszek (np. "Nie udało się wygenerować fiszek. Spróbuj ponownie później lub użyj innego tekstu.").

### Manualne tworzenie fiszek

- ID: US-007
- Tytuł: Tworzenie nowej fiszki manualnie
- Opis: Jako użytkownik chcę mieć możliwość ręcznego stworzenia nowej fiszki poprzez wprowadzenie jej treści (przód i tył) w formularzu, aby dodać własne pytania i odpowiedzi do mojej bazy.
- Kryteria akceptacji:
  - Dostępny jest formularz z polami tekstowymi na "przód" (max 200 znaków) i "tył" (max 500 znaków) fiszki.
  - Dostępny jest przycisk "Zapisz".
  - Po wypełnieniu pól i kliknięciu "Zapisz", nowa fiszka jest dodawana do bazy danych użytkownika.
  - Fiszka jest oznaczana w bazie danych jako stworzona manualnie.
  - Użytkownik otrzymuje potwierdzenie zapisania fiszki (np. komunikat lub odświeżenie listy fiszek).
  - System waliduje limity znaków przed zapisem.

### Zarządzanie fiszkami

- ID: US-008
- Tytuł: Przeglądanie zapisanych fiszek
- Opis: Jako użytkownik chcę móc zobaczyć listę wszystkich moich zapisanych fiszek (zarówno tych wygenerowanych przez AI, jak i stworzonych manualnie), aby mieć przegląd moich materiałów do nauki.
- Kryteria akceptacji:

  - Dostępny jest widok listy/tabeli prezentujący wszystkie fiszki użytkownika.
  - Każdy element listy pokazuje przynajmniej treść "przodu" fiszki.
  - Opcjonalnie: widoczna jest również treść "tyłu" lub jest ona dostępna po kliknięciu/najechaniu.
  - Lista jest powiązana z zalogowanym użytkownikiem (widoczne są tylko jego fiszki).

- ID: US-009
- Tytuł: Edycja istniejącej fiszki
- Opis: Jako użytkownik chcę móc edytować treść (przód i/lub tył) wcześniej zapisanej fiszki, aby poprawić błędy lub zaktualizować informacje.
- Kryteria akceptacji:

  - Na liście fiszek (US-008) lub w widoku szczegółów fiszki dostępna jest opcja "Edytuj".
  - Kliknięcie "Edytuj" otwiera formularz z załadowaną aktualną treścią "przodu" i "tyłu" fiszki.
  - Użytkownik może modyfikować treść w polach (z zachowaniem limitów znaków).
  - Po kliknięciu "Zapisz zmiany", zmodyfikowana treść fiszki jest aktualizowana w bazie danych.
  - Użytkownik ma możliwość anulowania edycji bez zapisywania zmian.

- ID: US-010
- Tytuł: Usuwanie istniejącej fiszki
- Opis: Jako użytkownik chcę móc usunąć fiszkę, której już nie potrzebuję, z mojej bazy danych.
- Kryteria akceptacji:
  - Na liście fiszek (US-008) lub w widoku szczegółów fiszki dostępna jest opcja "Usuń".
  - Przed usunięciem system prosi o potwierdzenie operacji (np. "Czy na pewno chcesz usunąć tę fiszkę?").
  - Po potwierdzeniu przez użytkownika, fiszka jest trwale usuwana z bazy danych.
  - Usunięta fiszka znika z listy fiszek użytkownika.

### Nauka z wykorzystaniem Spaced Repetition

- ID: US-011
- Tytuł: Rozpoczynanie sesji nauki
- Opis: Jako użytkownik chcę móc rozpocząć sesję nauki (powtórek), podczas której system będzie prezentował mi fiszki do powtórzenia zgodnie z algorytmem spaced repetition.
- Kryteria akceptacji:

  - Dostępny jest przycisk lub opcja "Rozpocznij naukę" / "Powtarzaj".
  - Po kliknięciu, system (korzystając z wybranej biblioteki SR) wybiera fiszkę do powtórki na podstawie jej historii i algorytmu SR.
  - Użytkownikowi prezentowana jest treść "przodu" wybranej fiszki.

- ID: US-012
- Tytuł: Ocenianie znajomości fiszki podczas nauki
- Opis: Jako użytkownik, po zobaczeniu "przodu" fiszki i przypomnieniu sobie odpowiedzi, chcę móc zobaczyć "tył" fiszki i ocenić swoją znajomość (np. "łatwe", "trudne", "powtórz"), aby system mógł zaplanować kolejną powtórkę.
- Kryteria akceptacji:
  - Po wyświetleniu "przodu" fiszki (US-011), dostępna jest opcja "Pokaż odpowiedź" / "Pokaż tył".
  - Po jej kliknięciu, wyświetlana jest treść "tyłu" fiszki.
  - Pod treścią "tyłu" dostępne są opcje oceny wymagane przez zintegrowaną bibliotekę SR (np. przyciski "Źle", "Dobrze", "Łatwo" lub podobne).
  - Po wybraniu oceny, system przekazuje tę informację do biblioteki SR, która aktualizuje stan fiszki i planuje kolejną powtórkę.
  - System przechodzi do kolejnej fiszki do powtórki (jeśli są dostępne) lub kończy sesję, jeśli nie ma więcej fiszek zaplanowanych na dany moment.

## 6. Metryki sukcesu

Kluczowe metryki, które będą mierzone w celu oceny sukcesu produktu (MVP):

1.  MS-001: Wskaźnik akceptacji fiszek generowanych przez AI:

    - Cel: 75%
    - Definicja: Stosunek liczby fiszek wygenerowanych przez AI, które zostały zaakceptowane przez użytkownika (bezpośrednio lub po edycji w procesie recenzji), do całkowitej liczby fiszek-kandydatów przedstawionych użytkownikowi do recenzji.
    - Sposób pomiaru: Wymaga śledzenia akcji użytkownika (Akceptuj, Edytuj+Zapisz, Odrzuć) na liście recenzji fiszek AI dla każdej sesji generowania. `Akceptacja = (Liczba_Akceptowanych + Liczba_Edytowanych_i_Zapisanych) / Liczba_Wszystkich_Propozycji`

2.  MS-002: Udział fiszek stworzonych z wykorzystaniem AI:

    - Cel: 75%
    - Definicja: Stosunek liczby fiszek dodanych do bazy danych użytkowników poprzez proces generowania i akceptacji AI (bezpośrednio lub po edycji) do całkowitej liczby fiszek dodanych przez użytkowników (zarówno przez AI, jak i manualnie) w danym okresie.
    - Sposób pomiaru: Wymaga rozróżnienia w bazie danych źródła pochodzenia każdej fiszki (AI vs. Manualnie). `Udział AI = Liczba_Fiszek_AI / (Liczba_Fiszek_AI + Liczba_Fiszek_Manualnych)`

3.  MS-003: Średnia/Mediana liczba fiszek na aktywnego użytkownika:
    - Cel: Monitorowanie ogólnego zaangażowania i wykorzystania aplikacji (brak konkretnego celu liczbowego dla MVP, ale metryka będzie śledzona).
    - Definicja: Średnia lub mediana liczby fiszek przechowywanych w bazach danych aktywnych użytkowników.
    - Sposób pomiaru: Regularne zliczanie liczby fiszek powiązanych z każdym aktywnym kontem użytkownika.

Pomiar tych metryk będzie kluczowy do oceny, czy AI Flashcard Generator faktycznie rozwiązuje problem użytkownika i czy podstawowe funkcjonalności MVP działają zgodnie z oczekiwaniami.
