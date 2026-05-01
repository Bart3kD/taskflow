# Plan testowania manualnego — TaskFlow

Dla każdego przypadku testowego zaznacz wynik i wpisz uwagi jeśli coś nie działa.

**Wynik:** `✅ OK` · `❌ FAIL` · `⚠️ CZĘŚCIOWO`

---

## 1. Autoryzacja

### TC-01: Logowanie — poprawne dane (admin)
**Kroki:** Wejdź na `/login`. Wpisz e-mail i hasło admina. Kliknij Log in.  
**Oczekiwany rezultat:** Przekierowanie na `/dashboard`. Sidebar pokazuje nazwę i rolę admina.  
**Wynik:**  ok
**Uwagi:**

---

### TC-02: Logowanie — niepoprawne dane
**Kroki:** Wejdź na `/login`. Wpisz błędne hasło. Kliknij Log in.  
**Oczekiwany rezultat:** Komunikat błędu „Invalid credentials". Brak przekierowania.  
**Wynik:**  ok
**Uwagi:**

---

### TC-03: Wylogowanie
**Kroki:** Będąc zalogowanym kliknij „Log out" w sidebarze.  
**Oczekiwany rezultat:** Przekierowanie na `/login`. Cookie sesji usunięte — wejście na `/dashboard` bez logowania powinno wrócić na `/login`.  
**Wynik:**  ok
**Uwagi:**

---

### TC-04: Dostęp bez sesji
**Kroki:** Wyloguj się. W pasku adresu wpisz `/dashboard`, `/tasks`, `/team`.  
**Oczekiwany rezultat:** Każdy z tych adresów przekierowuje z powrotem na `/login`.  
**Wynik:**  ok
**Uwagi:**

---

## 2. Onboarding nowego membera

### TC-05: Pierwsze logowanie membera — przekierowanie na onboarding
**Kroki:** Admin tworzy nowego membera. Member loguje się tymczasowym hasłem.  
**Oczekiwany rezultat:** Po zalogowaniu member trafia na `/onboarding`, nie na `/dashboard`.  
**Wynik:**  ok
**Uwagi:**

---

### TC-06: Onboarding krok 1 — walidacja hasła
**Kroki:** Na stronie onboardingu zostaw pola hasła puste i kliknij Next. Następnie wpisz hasło krótsze niż 8 znaków. Następnie wpisz dwa różne hasła.  
**Oczekiwany rezultat:** Każda z tych prób blokuje przejście dalej i pokazuje odpowiedni komunikat błędu.  
**Wynik:**  ok
**Uwagi:**

---

### TC-07: Onboarding krok 1 — ustawienie hasła
**Kroki:** Wpisz poprawne hasło (min. 8 znaków) w obu polach. Kliknij Next.  
**Oczekiwany rezultat:** Przejście do kroku 2 (Telegram). Wskaźnik kroków aktualizuje się.  
**Wynik:**  ok
**Uwagi:**

---

### TC-08: Onboarding krok 2 — pominięcie Telegrama
**Kroki:** Na kroku 2 kliknij „Skip for now".  
**Oczekiwany rezultat:** Przejście do kroku 3 (profilowe). Telegram pozostaje niepołączony.  
**Wynik:**  ok
**Uwagi:**

---

### TC-09: Onboarding krok 2 — połączenie Telegrama
**Kroki:** Kliknij „Generate Telegram link". Otwórz link w Telegramie i uruchom bota. Wróć do aplikacji i kliknij „Check status".  
**Oczekiwany rezultat:** Status zmienia się na „Connected" z zieloną kropką. Przycisk zmienia się na „Continue".  
**Wynik:**  ok
**Uwagi:**

---

### TC-10: Onboarding krok 3 — pominięcie zdjęcia
**Kroki:** Na kroku 3 kliknij „Complete setup" bez uploadowania zdjęcia.  
**Oczekiwany rezultat:** Onboarding kończy się. Przekierowanie na `/dashboard`. Kolejne logowanie trafia od razu na dashboard.  
**Wynik:**  ok
**Uwagi:**

---

### TC-11: Onboarding krok 3 — upload zdjęcia
**Kroki:** Kliknij kółko z inicjałami lub „Upload photo". Wybierz plik graficzny (JPG/PNG). Kliknij „Complete setup".  
**Oczekiwany rezultat:** Podgląd zdjęcia pojawia się w kółku. Po zakończeniu zdjęcie widoczne w sidebarze i na stronie ustawień.  
**Wynik:**  ok
**Uwagi:**

---

### TC-12: Onboarding — nawigacja wstecz
**Kroki:** Na kroku 2 kliknij „← Back". Na kroku 3 kliknij „← Back".  
**Oczekiwany rezultat:** Powrót do poprzedniego kroku. Wpisane wcześniej hasło pozostaje w polu.  
**Wynik:**  ok
**Uwagi:**

---

### TC-13: Już onboardowany member — brak przekierowania
**Kroki:** Member, który skończył onboarding, loguje się ponownie.  
**Oczekiwany rezultat:** Trafia bezpośrednio na `/dashboard`, bez `/onboarding`.  
**Wynik:**  ok
**Uwagi:**

---

## 3. Dashboard

### TC-14: Widok dashboardu — admin
**Kroki:** Zaloguj się jako admin. Wejdź na `/dashboard`.  
**Oczekiwany rezultat:** Widać statystyki i taski całego zespołu.  
**Wynik:**  ok
**Uwagi:**

---

### TC-15: Widok dashboardu — member
**Kroki:** Zaloguj się jako member. Wejdź na `/dashboard`.  
**Oczekiwany rezultat:** Widać tylko własne taski membera.  
**Wynik:**  ok
**Uwagi:**

---

## 4. Taski — lista i filtry

### TC-16: Lista tasków — admin widzi wszystkie
**Kroki:** Zaloguj jako admin. Wejdź na `/tasks`.  
**Oczekiwany rezultat:** Widoczne taski wszystkich członków zespołu. Kolumna „Assignee" jest widoczna.  
**Wynik:**  ok
**Uwagi:**

---

### TC-17: Lista tasków — member widzi tylko swoje
**Kroki:** Zaloguj jako member. Wejdź na `/tasks`.  
**Oczekiwany rezultat:** Widoczne tylko taski przypisane do tego membera. Brak kolumny „Assignee" i filtra „Member".  
**Wynik:**  ok
**Uwagi:**

---

### TC-18: Filtr — zakres (All / My tasks / Team's tasks)
**Kroki:** Jako admin kliknij kolejno „My tasks" i „Team's tasks".  
**Oczekiwany rezultat:** „My tasks" — tylko taski admina. „Team's tasks" — taski wszystkich poza adminem.  
**Wynik:**  ok
**Uwagi:**

---

### TC-19: Filtr — status
**Kroki:** Kliknij filtr „Status" i wybierz np. „Pending".  
**Oczekiwany rezultat:** Lista pokazuje tylko taski z wybranym statusem.  
**Wynik:**  ok
**Uwagi:**

---

### TC-20: Filtr — member
**Kroki:** Kliknij filtr „Member" i wybierz konkretną osobę.  
**Oczekiwany rezultat:** Lista pokazuje tylko taski przypisane do tej osoby.  
**Wynik:**  ok
**Uwagi:**

---

### TC-21: Filtr — szukaj po tytule
**Kroki:** Wpisz fragment tytułu taska w pole wyszukiwania.  
**Oczekiwany rezultat:** Lista filtruje się na bieżąco, zostawiając tylko pasujące taski.  
**Wynik:**  ok
**Uwagi:**

---

### TC-22: Filtr — URL param ?member=
**Kroki:** Wejdź bezpośrednio na `/tasks?member=<userId>` (np. przez link „Go to their tasks" z team/[id]).  
**Oczekiwany rezultat:** Strona otwiera się z już aktywnym filtrem na tego membera.  
**Wynik:**  fail
**Uwagi:** nie widzę nigdzie przycisku go to their tasks. na /team/id nie pokazuje się zdjęcie profilowe membera

---

### TC-23: Wyczyszczenie filtrów
**Kroki:** Ustaw dowolny filtr. Kliknij „Clear filters".  
**Oczekiwany rezultat:** Wszystkie filtry resetują się, lista pokazuje pełną listę tasków.  
**Wynik:**  ok
**Uwagi:**

---

### TC-24: Wskaźnik przeterminowania
**Kroki:** Znajdź task z terminem w przeszłości i statusem innym niż „Done".  
**Oczekiwany rezultat:** Rząd jest podświetlony na czerwono. Czerwona kropka przy tytule. Status „Overdue".  
**Wynik:**  ok
**Uwagi:**

---

## 5. Taski — tworzenie

### TC-25: Tworzenie taska jednorazowego
**Kroki:** Kliknij „New task". Wypełnij tytuł, opis, wybierz osobę, wybierz „Once" i ustaw datę. Kliknij „Create task".  
**Oczekiwany rezultat:** Task pojawia się na liście z poprawnym tytułem, osobą i terminem.  
**Wynik:**  ok
**Uwagi:**

---

### TC-26: Tworzenie taska cyklicznego — co N dni
**Kroki:** Utwórz task. Wybierz „Recurring" → „Every N days" → wpisz np. 7. Zapisz.  
**Oczekiwany rezultat:** Task na liście ma typ „Recurring". W szczegółach widać konfigurację cyklu.  
**Wynik:**  ok
**Uwagi:** overall deadline miał być jako n dni przed następnym wystąpieniem taska, ablo n dni po otrzymaniu taska, nie jako data. Jako data może być ustawienie kiedy kończy się recurrence, ale inaczej musi to być nazwane

---

### TC-27: Tworzenie taska cyklicznego — dzień tygodnia
**Kroki:** Utwórz task. Wybierz „Recurring" → „Day of week" → wybierz dzień i godzinę. Zapisz.  
**Oczekiwany rezultat:** Task zapisany z prawidłową konfiguracją cykliczności.  
**Wynik:**  ok
**Uwagi:**

---

### TC-28: Walidacja formularza taska
**Kroki:** Wejdź na formularz tworzenia. Kliknij „Create task" bez wypełnienia tytułu.  
**Oczekiwany rezultat:** Formularz blokuje zapis i wskazuje brakujące pole.  
**Wynik:**  ok
**Uwagi:** przycisk jest po prostu disabled, nie pokazuje się że nie ma tytułu

---

## 6. Taski — sheet (panel boczny)

### TC-29: Otwarcie sheetu
**Kroki:** Na liście tasków kliknij dowolny rząd.  
**Oczekiwany rezultat:** Z prawej wysuwa się panel z pełnymi danymi taska.  
**Wynik:**  ok
**Uwagi:**

---

### TC-30: Edycja taska w sheecie
**Kroki:** W otwartym sheecie zmień tytuł lub status. Zatwierdź zmianę.  
**Oczekiwany rezultat:** Zmiana zapisuje się. Lista tasków odświeża się z nową wartością.  
**Wynik:**  ok
**Uwagi:**

---

### TC-31: Usunięcie taska przez sheet
**Kroki:** W otwartym sheecie kliknij opcję usunięcia taska. Potwierdź.  
**Oczekiwany rezultat:** Task znika z listy. Sheet się zamyka.  
**Wynik:**  ok
**Uwagi:** Jak otworzyłem inny sheet, to przycisk delete dalej był deleting...

---

### TC-32: Zamknięcie sheetu
**Kroki:** Otwórz sheet. Kliknij poza panelem lub ikonę zamknięcia.  
**Oczekiwany rezultat:** Panel chowa się. Lista pozostaje bez zmian.  
**Wynik:**  ok
**Uwagi:** "x" do zamknięcia sheeta powinien być na tej samej wysokości co "open full view" i "delete"

---

## 7. Zespół — lista

### TC-33: Widok listy zespołu
**Kroki:** Jako admin wejdź na `/team`.  
**Oczekiwany rezultat:** Karty wszystkich memberów (poza aktualnie zalogowanym adminem). Widać imię, e-mail, status Telegrama, kanał powiadomień.  
**Wynik:**  ok
**Uwagi:**

---

### TC-34: Avatar na karcie membera
**Kroki:** Member, który ustawił zdjęcie profilowe, jest widoczny na liście.  
**Oczekiwany rezultat:** Górna część karty pokazuje jego zdjęcie zamiast inicjałów.  
**Wynik:**  ok
**Uwagi:**

---

### TC-35: Szukaj membera
**Kroki:** Wpisz fragment imienia lub e-maila w pole wyszukiwania.  
**Oczekiwany rezultat:** Lista filtruje się, zostawiając tylko pasujących memberów.  
**Wynik:**  ok
**Uwagi:**

---

### TC-36: Dostęp do /team jako member
**Kroki:** Zaloguj się jako member. Wpisz ręcznie `/team` w pasku adresu.  
**Oczekiwany rezultat:** Przekierowanie na `/dashboard`. Member nie ma dostępu do zarządzania zespołem.  
**Wynik:**  ok
**Uwagi:**

---

## 8. Zespół — dodawanie membera

### TC-37: Dodanie nowego membera
**Kroki:** Kliknij „Add member". Wypełnij imię, e-mail, wybierz rolę. Kliknij „Add member".  
**Oczekiwany rezultat:** Dialog zamyka się. Strona odświeża się. Nowy member widoczny na liście.  
**Wynik:**  ok
**Uwagi:** Za mały spacing między inputem a labelem. Zamiast labela powinien być placeholder, który idzie do góry w trakcie pisania, albo gdy jest coś tam wpisane.

---

### TC-38: Welcome e-mail
**Kroki:** Dodaj membera z prawidłowym adresem e-mail (na Twoją skrzynkę).  
**Oczekiwany rezultat:** Na skrzynce pojawia się wiadomość z tymczasowym hasłem i linkiem do logowania. Jeśli mail nie doszedł — sprawdź konfigurację `FROM_EMAIL` w `.env`.  
**Wynik:**  ok
**Uwagi:**

---

### TC-39: Duplikat e-maila
**Kroki:** Spróbuj dodać membera z e-mailem, który już istnieje w systemie.  
**Oczekiwany rezultat:** Formularz pokazuje błąd. Użytkownik nie zostaje zduplikowany.  
**Wynik:**  ok
**Uwagi:** Wyświetla się informacja "Failed to add user.", powinno być coś w stylu "Member with this e-mail already exsists"

---

## 9. Zespół — ustawienia membera (/team/[id])

### TC-40: Edycja nazwy membera
**Kroki:** Wejdź na /team/[id]. Zmień nazwę w polu „Display name". Kliknij „Save profile".  
**Oczekiwany rezultat:** Komunikat „Changes saved." Nazwa zaktualizowana na liście i w sidebarze.  
**Wynik:**  ok
**Uwagi:**

---

### TC-41: Generowanie linku Telegram dla membera
**Kroki:** Kliknij „Generate link" w sekcji Telegram.  
**Oczekiwany rezultat:** Pojawia się link do skopiowania oraz przycisk „Open in Telegram". Link wygasa po 24h.  
**Wynik:**  ok
**Uwagi:** nie ma open in telegram, ale nie powinno być, tylko w ustawieniach powinien być taki przycisk. input nie powinien się zwiększać przez to jak długi jest link, powinien być tej samej długości tak jak w ustawieniach.

---

### TC-42: Rozłączenie Telegrama
**Kroki:** Gdy Telegram jest połączony, kliknij „Disconnect".  
**Oczekiwany rezultat:** Status zmienia się na „Not connected". Przycisk „Generate link" wraca.  
**Wynik:**  ok
**Uwagi:**

---

### TC-43: Zapis harmonogramu powiadomień
**Kroki:** Zmień częstotliwość raportu, kanał i czas wysyłki. Kliknij „Save schedule".  
**Oczekiwany rezultat:** Komunikat „Schedule saved." Zmiany zapisane w bazie.  
**Wynik:**  ok
**Uwagi:**

---

### TC-44: Usunięcie membera bez tasków
**Kroki:** Kliknij „Delete member". Potwierdź w dialogu.  
**Oczekiwany rezultat:** Member usunięty. Przekierowanie na `/team`. Membera nie ma już na liście.  
**Wynik:**  ok
**Uwagi:**

---

### TC-45: Usunięcie membera z taskami — blokada
**Kroki:** Spróbuj usunąć membera, który ma przypisane taski.  
**Oczekiwany rezultat:** Dialog pokazuje błąd z liczbą tasków. Pojawiają się dwa przyciski: „Go to their tasks and reassign" oraz „Delete all their tasks and remove member".  
**Wynik:**  ok
**Uwagi:**

---

### TC-46: Usunięcie membera — „Go to their tasks and reassign"
**Kroki:** W dialogu błędu kliknij „Go to their tasks and reassign →".  
**Oczekiwany rezultat:** Przekierowanie na `/tasks?member=<id>` z aktywnym filtrem na tego membera. Member nie został usunięty.  
**Wynik:**  ok
**Uwagi:**

---

### TC-47: Usunięcie membera — „Delete all their tasks and remove member"
**Kroki:** W dialogu błędu kliknij „Delete all their tasks and remove member".  
**Oczekiwany rezultat:** Wszystkie taski membera usunięte. Member usunięty. Przekierowanie na `/team`.  
**Wynik:**  ok
**Uwagi:**

---

## 10. Ustawienia użytkownika (/settings)

### TC-48: Zmiana hasła — poprawna
**Kroki:** Wejdź na `/settings`. Wpisz aktualne hasło, nowe hasło (min. 8 znaków) i potwierdzenie. Kliknij „Change password".  
**Oczekiwany rezultat:** Komunikat „Password changed." Nowe hasło działa przy kolejnym logowaniu.  
**Wynik:**  ok
**Uwagi:**

---

### TC-49: Zmiana hasła — błędne aktualne hasło
**Kroki:** Wpisz nieprawidłowe aktualne hasło. Kliknij „Change password".  
**Oczekiwany rezultat:** Komunikat błędu. Hasło nie zostaje zmienione.  
**Wynik:**  fail
**Uwagi:** zamiast komuniaktu coś takiego dostałem "<!DOCTYPE html> <html class="h-full" lang="en-US" dir="ltr"> <head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> <link rel="preload" href="https://assets.ngrok.com/fonts/euclid-square/EuclidSquare-Regular-WebS.woff" as="font" type="font/woff" crossorigin="anonymous" /> <link rel="preload" href="https://assets.ngrok.com/fonts/euclid-square/EuclidSquare-RegularItalic-WebS.woff" as="font" type="font/woff" crossorigin="anonymous" /> <link rel="preload" href="https://assets.ngrok.com/fonts/euclid-square/EuclidSquare-Medium-WebS.woff" as="font" type="font/woff" crossorigin="anonymous" /> <link rel="preload" href="https://assets.ngrok.com/fonts/euclid-square/EuclidSquare-MediumItalic-WebS.woff" as="font" type="font/woff" crossorigin="anonymous" /> <link rel="preload" href="https://assets.ngrok.com/fonts/ibm-plex-mono/IBMPlexMono-Text.woff" as="font" type="font/woff" crossorigin="anonymous" /> <link rel="preload" href="https://assets.ngrok.com/fonts/ibm-plex-mono/IBMPlexMono-TextItalic.woff" as="font" type="font/woff" crossorigin="anonymous" /> <link rel="preload" href="https://assets.ngrok.com/fonts/ibm-plex-mono/IBMPlexMono-SemiBold.woff" as="font" type="font/woff" crossorigin="anonymous" /> <link rel="preload" href="https://assets.ngrok.com/fonts/ibm-plex-mono/IBMPlexMono-SemiBoldItalic.woff" as="font" type="font/woff" crossorigin="anonymous" /> <meta name="author" content="ngrok"> <meta name="description" content="ngrok is the fastest way to put anything on the internet with a single command."> <link href="https://ngrok.com/assets/favicon.ico" rel="shortcut icon" type="image/x-icon"> <meta name="robots" content="noindex, nofollow"> <link id="style" rel="stylesheet" href="https://cdn.ngrok.com/static/css/error.css"> <noscript>ngrok gateway error The server returned an invalid or incomplete HTTP response. (ERR_NGROK_3004)</noscript> <script id="script" src="https://cdn.ngrok.com/static/js/error.js" type="text/javascript"></script> </head> <body class="h-full" id="ngrok"> <div id="root" data-payload="eyJjZG5CYXNlIjoiaHR0cHM6Ly9jZG4ubmdyb2suY29tLyIsImNvZGUiOiIzMDA0IiwibWVzc2FnZSI6Im5ncm9rIGdhdGV3YXkgZXJyb3JcblRoZSBzZXJ2ZXIgcmV0dXJuZWQgYW4gaW52YWxpZCBvciBpbmNvbXBsZXRlIEhUVFAgcmVzcG9uc2UuIiwidGl0bGUiOiJTZXJ2aWNlIFVuYXZhaWxhYmxlIn0="></div> </body> </html>" Spróbowałem ponownie, i mogę zmienić hasło, nawet jak current podam niepoprawne

---

### TC-50: Zmiana hasła — niezgodne pola
**Kroki:** Wpisz dwa różne hasła w polach „New password" i „Confirm". Kliknij „Change password".  
**Oczekiwany rezultat:** Komunikat „New passwords do not match." Hasło nie zostaje zmienione.  
**Wynik:**  ok
**Uwagi:**

---

### TC-51: Upload zdjęcia profilowego
**Kroki:** Na `/settings` kliknij avatar (kółko z inicjałami). Wybierz plik graficzny.  
**Oczekiwany rezultat:** Podgląd zdjęcia pojawia się natychmiast. Komunikat „Saving…" na chwilę. Zdjęcie zapisuje się i odświeża w sidebarze.  
**Wynik:**  ok
**Uwagi:**

---

### TC-52: Usunięcie zdjęcia profilowego
**Kroki:** Gdy zdjęcie jest ustawione, kliknij mały `×` w rogu avatara.  
**Oczekiwany rezultat:** Zdjęcie znika. Powracają inicjały. Sidebar aktualizuje się.  
**Wynik:**  ok
**Uwagi:**

---

### TC-53: Zdjęcie — za duży plik
**Kroki:** Spróbuj wgrać plik większy niż 5 MB.  
**Oczekiwany rezultat:** Komunikat błędu „File must be under 5 MB." Zdjęcie nie zostaje zapisane.  
**Wynik:**  ok
**Uwagi:**

---

### TC-54: Zdjęcie — plik nie-graficzny
**Kroki:** Spróbuj wgrać plik PDF lub .txt.  
**Oczekiwany rezultat:** Komunikat błędu „Please select an image file."  
**Wynik:**  problem
**Uwagi:** nie wiem jak taki wgrac, jak otwieram wszystkie pliki to widzę tylko te z formatem zdjęciowym

---

### TC-55: Połączenie Telegrama z poziomu ustawień
**Kroki:** Kliknij „Generate connect link". Otwórz link w Telegramie. Wróć i sprawdź status.  
**Oczekiwany rezultat:** Status zmienia się na „Connected". Przycisk zmienia się na „Disconnect".  
**Wynik:**  ok
**Uwagi:**

---

## 11. Potwierdzenie statusu bez logowania

### TC-56: Link do potwierdzenia statusu — Done
**Kroki:** Z e-maila z raportem kliknij przycisk „✓ Done".  
**Oczekiwany rezultat:** Strona `/confirm/[token]` ładuje się bez logowania. Status taska zmienia się na „Done". Strona potwierdza zmianę.  
**Wynik:**  ok
**Uwagi:**

---

### TC-57: Link do potwierdzenia statusu — In Progress
**Kroki:** Kliknij przycisk „⟳ In Progress" z e-maila.  
**Oczekiwany rezultat:** Status zmienia się na „In Progress". Potwierdzenie na stronie.  
**Wynik:**  ok
**Uwagi:**

---

### TC-58: Link do potwierdzenia statusu — Problem
**Kroki:** Kliknij przycisk „⚠ Problem" z e-maila.  
**Oczekiwany rezultat:** Status zmienia się na „Problem". Potwierdzenie na stronie.  
**Wynik:**  ok
**Uwagi:**

---

### TC-59: Wygasły token
**Kroki:** Otwórz stary link do potwierdzenia (po 7 dniach lub użyty ponownie).  
**Oczekiwany rezultat:** Strona informuje, że link wygasł lub jest nieważny. Status taska się nie zmienia.  
**Wynik:**  ok
**Uwagi:**

---

### TC-60: Użyty token (jednorazowy)
**Kroki:** Kliknij ten sam link do potwierdzenia dwa razy.  
**Oczekiwany rezultat:** Drugie kliknięcie pokazuje informację, że link już został użyty.  
**Wynik:**  ok
**Uwagi:**

---

## 12. Powiadomienia i scheduler

### TC-61: Scheduler — ręczne wywołanie
**Kroki:** Wywołaj endpoint schedulera (np. `POST /api/scheduler` lub zgodnie z konfiguracją).  
**Oczekiwany rezultat:** Brak błędów w odpowiedzi. W logach serwera widać informacje o przetworzonych taskach.  
**Wynik:**  ok
**Uwagi:**

---

### TC-62: Przypomnienie przed terminem
**Kroki:** Utwórz task z terminem jutro. Uruchom scheduler.  
**Oczekiwany rezultat:** Member przypisany do taska otrzymuje e-mail lub wiadomość na Telegramie z przypomnieniem.  
**Wynik:**  ok
**Uwagi:**

---

### TC-63: Raport cykliczny
**Kroki:** Ustaw harmonogram raportu dla membera. Uruchom scheduler w odpowiednim czasie.  
**Oczekiwany rezultat:** Member otrzymuje wiadomość z linkami do potwierdzenia statusu swoich tasków.  
**Wynik:**  ok
**Uwagi:**

---

### TC-64: Powiadomienie o nowym tasku
**Kroki:** Admin przypisuje nowy task do membera.  
**Oczekiwany rezultat:** Member otrzymuje powiadomienie o nowym tasku (e-mail lub Telegram, zgodnie z konfiguracją).  
**Wynik:**  ok
**Uwagi:**

---

## 13. Sidebar i nawigacja

### TC-65: Avatar w sidebarze
**Kroki:** Ustaw zdjęcie profilowe. Przejdź na dowolną stronę aplikacji.  
**Oczekiwany rezultat:** Stopka sidebaru pokazuje zdjęcie zamiast inicjałów obok nazwy i roli.  
**Wynik:**  ok
**Uwagi:**

---

### TC-66: Nawigacja — aktywny element
**Kroki:** Przejdź kolejno na `/dashboard`, `/tasks`, `/settings`.  
**Oczekiwany rezultat:** W sidebarze aktywny link jest podświetlony dla każdej ze stron.  
**Wynik:**  ok
**Uwagi:**

---

### TC-67: Member nie widzi sekcji Team
**Kroki:** Zaloguj się jako member. Sprawdź sidebar.  
**Oczekiwany rezultat:** Link „Team" nie jest widoczny w nawigacji.  
**Wynik:**  ok
**Uwagi:**

---

## Podsumowanie

| Obszar | Liczba TC | OK | FAIL | Częściowo |
|---|---|---|---|---|
| Autoryzacja | 4 | | | |
| Onboarding | 9 | | | |
| Dashboard | 2 | | | |
| Taski — lista i filtry | 9 | | | |
| Taski — tworzenie | 4 | | | |
| Taski — sheet | 4 | | | |
| Zespół — lista | 4 | | | |
| Zespół — dodawanie | 3 | | | |
| Zespół — ustawienia | 8 | | | |
| Ustawienia | 8 | | | |
| Potwierdzenie statusu | 5 | | | |
| Powiadomienia | 4 | | | |
| Sidebar i nawigacja | 3 | | | |
| **Łącznie** | **67** | | | |

---

*Ostatnia aktualizacja: 2026-05-01*
