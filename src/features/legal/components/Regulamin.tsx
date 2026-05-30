/**
 * Regulamin — statyczna treść regulaminu serwisu.
 *
 * Treść oparta na docs/legal/regulamin-draft.md — do review przez prawnika.
 * Layout: max-w-prose centered, typografia prose zgodna z DESIGN.md.
 */

export function Regulamin() {
  return (
    <article className="prose-legal">
      <h1>Regulamin serwisu Bachata Napoli</h1>

      <p className="text-fg-muted text-sm">
        Ostatnia aktualizacja: [DATA — do uzupełnienia przez operatora]
      </p>

      <hr />

      <h2>1. Definicje</h2>
      <ul>
        <li>
          <strong>Serwis</strong> — platforma internetowa Bachata Napoli
          dostępna pod adresem bachatanapoli.pl
        </li>
        <li>
          <strong>Operator</strong> — Bachata Napoli, [pełna nazwa prawna i
          adres — do uzupełnienia]
        </li>
        <li>
          <strong>Użytkownik</strong> — osoba fizyczna posiadająca konto w
          Serwisie
        </li>
        <li>
          <strong>Konto</strong> — indywidualny zestaw zasobów przypisanych
          Użytkownikowi po rejestracji
        </li>
        <li>
          <strong>Biblioteka</strong> — zbiór filmów i folderów należących do
          Użytkownika
        </li>
        <li>
          <strong>Treści</strong> — filmy, linki, notatki i inne materiały
          dodawane przez Użytkownika
        </li>
      </ul>

      <h2>2. Świadczone usługi</h2>
      <p>Serwis udostępnia:</p>
      <ul>
        <li>
          <strong>Bibliotekę filmów tanecznych</strong> — możliwość dodawania,
          organizowania i odtwarzania filmów z YouTube, Facebooka, Instagrama
          oraz plików wideo
        </li>
        <li>
          <strong>Foldery</strong> — organizowanie filmów w kategorie i zbiory
          tematyczne
        </li>
        <li>
          <strong>Udostępnianie</strong> — możliwość generowania linków do
          przeglądania biblioteki przez inne osoby (bez wymogu zakładania konta)
        </li>
        <li>
          <strong>Konto użytkownika</strong> — dostęp do wszystkich funkcji po
          rejestracji
        </li>
      </ul>
      <p>
        Operator zastrzega prawo do zmiany zakresu usług po uprzednim
        poinformowaniu Użytkowników z 14-dniowym wyprzedzeniem.
      </p>

      <h2>3. Konto użytkownika</h2>

      <h3>Rejestracja</h3>
      <ul>
        <li>
          Konto może założyć osoba pełnoletnia lub osoba małoletnia za zgodą
          opiekuna prawnego
        </li>
        <li>
          Rejestracja odbywa się przez e-mail i hasło lub przez konto Google
          (OAuth)
        </li>
        <li>Użytkownik zobowiązuje się do podania prawdziwych danych</li>
      </ul>

      <h3>Bezpieczeństwo konta</h3>
      <ul>
        <li>
          Użytkownik ponosi odpowiedzialność za bezpieczeństwo swojego hasła
        </li>
        <li>
          Należy niezwłocznie poinformować Operatora o podejrzeniu
          nieautoryzowanego dostępu do konta
        </li>
      </ul>

      <h3>Usunięcie konta</h3>
      <ul>
        <li>Użytkownik może usunąć konto w dowolnym momencie</li>
        <li>
          Po usunięciu konta dane są przechowywane przez 30 dni (kopia
          zapasowa), a następnie trwale usuwane
        </li>
        <li>
          Treści publiczne (udostępnione linki) mogą przestać działać po
          usunięciu konta
        </li>
      </ul>

      <h2>4. Treści użytkownika</h2>
      <ul>
        <li>
          Użytkownik jest wyłącznie odpowiedzialny za Treści dodawane do Serwisu
        </li>
        <li>
          Dodając Treści, Użytkownik oświadcza, że posiada do nich odpowiednie
          prawa lub korzysta z nich zgodnie z warunkami platformy źródłowej
          (YouTube, Facebook, Instagram)
        </li>
        <li>Operator nie weryfikuje automatycznie praw do treści</li>
        <li>
          Treści przechowywane są na serwerach Operatora do czasu usunięcia
          przez Użytkownika lub usunięcia konta
        </li>
      </ul>

      <h2>5. Zakazane działania</h2>
      <p>Zabrania się:</p>
      <ul>
        <li>
          Dodawania treści naruszających prawa autorskie lub inne prawa
          własności intelektualnej
        </li>
        <li>
          Dodawania treści nielegalnych, obraźliwych, dyskryminacyjnych lub
          pornograficznych
        </li>
        <li>Używania Serwisu do rozsyłania spamu lub materiałów reklamowych</li>
        <li>
          Podejmowania prób nieautoryzowanego dostępu do kont innych
          Użytkowników lub systemów Serwisu
        </li>
        <li>Automatycznego pobierania danych (scraping) bez zgody Operatora</li>
        <li>Obchodzenia zabezpieczeń technicznych Serwisu</li>
      </ul>
      <p>
        Naruszenie powyższych zasad może skutkować natychmiastowym zablokowaniem
        lub usunięciem konta.
      </p>

      <h2>6. Ograniczenie odpowiedzialności</h2>
      <ul>
        <li>
          Operator nie odpowiada za treści zamieszczane przez Użytkowników
        </li>
        <li>
          Operator nie gwarantuje dostępności Serwisu przez 100% czasu — możliwe
          są przerwy techniczne
        </li>
        <li>
          Operator nie ponosi odpowiedzialności za utratę danych wynikającą z
          działania Użytkownika lub siły wyższej
        </li>
        <li>
          Operator nie odpowiada za treści dostępne pod linkami zewnętrznymi
          (YouTube, Facebook, Instagram)
        </li>
        <li>
          Maksymalna odpowiedzialność Operatora wobec Użytkownika ograniczona
          jest do 100 PLN w przypadku bezpłatnych usług
        </li>
      </ul>

      <h2>7. Reklamacje</h2>
      <p>Reklamacje dotyczące działania Serwisu można składać:</p>
      <ul>
        <li>
          E-mail:{' '}
          <a href="mailto:kontakt@bachatanapoli.pl">
            <strong>kontakt@bachatanapoli.pl</strong>
          </a>
        </li>
        <li>[Adres korespondencyjny — do uzupełnienia przez operatora]</li>
      </ul>
      <p>Reklamacja powinna zawierać:</p>
      <ul>
        <li>Dane identyfikacyjne Użytkownika (adres e-mail konta)</li>
        <li>Opis problemu</li>
        <li>Datę i okoliczności wystąpienia</li>
      </ul>
      <p>
        Operator rozpatrzy reklamację w terminie{' '}
        <strong>14 dni roboczych</strong> od daty otrzymania i poinformuje
        Użytkownika o jej wyniku drogą e-mailową.
      </p>

      <h2>8. Postanowienia końcowe</h2>
      <ul>
        <li>Regulamin podlega prawu polskiemu</li>
        <li>
          Wszelkie spory będą rozstrzygane przez sąd właściwy dla siedziby
          Operatora
        </li>
        <li>
          Zmiany Regulaminu wchodzą w życie po 14 dniach od opublikowania nowej
          wersji — kontynuowanie korzystania z Serwisu po tym terminie oznacza
          akceptację zmian
        </li>
        <li>
          Operator poinformuje Użytkowników o istotnych zmianach Regulaminu
          drogą e-mailową
        </li>
        <li>
          Nieważność poszczególnych postanowień Regulaminu nie wpływa na ważność
          pozostałych postanowień
        </li>
      </ul>
      <p>
        Aktualna wersja Regulaminu dostępna jest zawsze pod adresem{' '}
        <strong>bachatanapoli.pl/regulamin</strong>.
      </p>
    </article>
  );
}
