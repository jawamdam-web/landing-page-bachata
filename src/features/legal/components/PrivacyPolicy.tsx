/**
 * PrivacyPolicy — statyczna treść polityki prywatności.
 *
 * Treść oparta na docs/legal/privacy-policy-draft.md — do review przez prawnika.
 * Layout: max-w-prose centered, typografia prose zgodna z DESIGN.md.
 */

export function PrivacyPolicy() {
  return (
    <article className="prose-legal">
      <h1>Polityka prywatności</h1>

      <p className="text-fg-muted text-sm">
        Ostatnia aktualizacja: [DATA — do uzupełnienia przez operatora]
      </p>

      <hr />

      <h2>1. Administrator danych osobowych</h2>
      <p>Administratorem Twoich danych osobowych jest:</p>
      <p>
        <strong>Bachata Napoli</strong>
        <br />
        [Pełna nazwa prawna — do uzupełnienia przez operatora]
        <br />
        Pizzeria Napoli, Lubin [Adres — do uzupełnienia przez operatora]
        <br />
        E-mail:{' '}
        <a href="mailto:kontakt@bachatanapoli.pl">kontakt@bachatanapoli.pl</a>
      </p>

      <h2>2. Zakres zbieranych danych</h2>
      <p>W zależności od sposobu korzystania z serwisu możemy przetwarzać:</p>
      <ul>
        <li>
          <strong>Adres e-mail</strong> — przy rejestracji i logowaniu
        </li>
        <li>
          <strong>Dane profilu Google</strong> — imię, adres e-mail, zdjęcie
          profilowe (jeśli logujesz się przez Google OAuth)
        </li>
        <li>
          <strong>Dane dodawanych treści</strong> — metadane filmów tanecznych
          (tytuł, opis, linki, miniatura), foldery, notatki
        </li>
        <li>
          <strong>Logi serwera</strong> — adres IP, user-agent przeglądarki,
          data i godzina żądań
        </li>
        <li>
          <strong>Pliki cookie</strong> — sesji (niezbędne) i analityczne
          (opcjonalne, po wyrażeniu zgody)
        </li>
      </ul>

      <h2>3. Cel i podstawa prawna przetwarzania</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Cel</th>
              <th>Podstawa prawna</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Świadczenie usługi (konto, biblioteka filmów)</td>
              <td>Art. 6 ust. 1 lit. b RODO — wykonanie umowy</td>
            </tr>
            <tr>
              <td>Bezpieczeństwo i zapobieganie nadużyciom</td>
              <td>
                Art. 6 ust. 1 lit. f RODO — uzasadniony interes administratora
              </td>
            </tr>
            <tr>
              <td>Logi serwera (diagnostyka)</td>
              <td>
                Art. 6 ust. 1 lit. f RODO — uzasadniony interes administratora
              </td>
            </tr>
            <tr>
              <td>Analityka ruchu na stronie</td>
              <td>Art. 6 ust. 1 lit. a RODO — zgoda użytkownika</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>4. Okres przechowywania danych</h2>
      <ul>
        <li>
          <strong>Konto użytkownika</strong> — dane przechowywane do momentu
          usunięcia konta, a następnie przez 30 dni (kopia zapasowa), po czym
          trwale usuwane
        </li>
        <li>
          <strong>Logi serwera</strong> — do 90 dni
        </li>
        <li>
          <strong>Dane analityczne</strong> — do odwołania zgody lub przez
          maksymalnie 26 miesięcy
        </li>
      </ul>

      <h2>5. Odbiorcy danych</h2>
      <p>Twoje dane mogą być przekazywane do następujących podmiotów:</p>
      <ul>
        <li>
          <strong>Supabase Inc.</strong> (infrastruktura bazodanowa i auth) —
          serwery w regionie EU (Frankfurt). Supabase posiada podpisaną Data
          Processing Agreement (DPA).
        </li>
        <li>
          <strong>Google LLC</strong> — dostawca logowania OAuth. Przetwarzanie
          na podstawie Standard Contractual Clauses (SCC).
        </li>
        <li>
          <strong>Sentry</strong> — monitorowanie błędów aplikacji. Sentry
          posiada DPA.
        </li>
        <li>
          <strong>Plausible Analytics</strong> — analityka bez cookies (jeśli
          aktywna) — dane anonimowe, serwery w EU.
        </li>
      </ul>

      <h2>6. Transfer danych do państw trzecich</h2>
      <p>
        Część dostawców (Google, Sentry) przetwarza dane poza Europejskim
        Obszarem Gospodarczym. Przekazanie odbywa się na podstawie:
      </p>
      <ul>
        <li>
          Standardowych klauzul umownych (SCC) zatwierdzonych przez Komisję
          Europejską, lub
        </li>
        <li>
          Decyzji Komisji Europejskiej stwierdzającej odpowiedni poziom ochrony
        </li>
      </ul>
      <p>
        Supabase przechowuje dane na serwerach w EU (Frankfurt, Niemcy) —
        transfer poza EOG nie dotyczy.
      </p>

      <h2>7. Twoje prawa</h2>
      <p>Zgodnie z RODO przysługują Ci następujące prawa:</p>
      <ul>
        <li>
          <strong>Prawo dostępu</strong> — możesz zażądać informacji o
          przetwarzanych danych
        </li>
        <li>
          <strong>Prawo do sprostowania</strong> — możesz poprosić o korektę
          nieprawidłowych danych
        </li>
        <li>
          <strong>Prawo do usunięcia</strong> ("prawo do bycia zapomnianym") —
          możesz zażądać usunięcia danych
        </li>
        <li>
          <strong>Prawo do ograniczenia przetwarzania</strong> — możesz
          ograniczyć zakres przetwarzania
        </li>
        <li>
          <strong>Prawo do przenoszenia danych</strong> — możesz otrzymać swoje
          dane w formacie CSV/JSON
        </li>
        <li>
          <strong>Prawo sprzeciwu</strong> — możesz sprzeciwić się przetwarzaniu
          na podstawie uzasadnionego interesu
        </li>
        <li>
          <strong>Prawo do cofnięcia zgody</strong> — w każdej chwili możesz
          wycofać zgodę na analitykę (bez wpływu na wcześniejsze przetwarzanie)
        </li>
      </ul>

      <h2>8. Jak wykonać swoje prawa</h2>
      <p>
        Aby skorzystać z powyższych praw, wyślij e-mail na adres:{' '}
        <a href="mailto:kontakt@bachatanapoli.pl">
          <strong>kontakt@bachatanapoli.pl</strong>
        </a>
      </p>
      <p>
        Odpowiemy w ciągu 30 dni od otrzymania żądania. W przypadku złożonych
        żądań termin może zostać przedłużony o kolejne 60 dni — poinformujemy
        Cię o tym.
      </p>
      <p>
        Masz też prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych
        (UODO), ul. Stawki 2, 00-193 Warszawa.
      </p>

      <h2 id="cookies">9. Pliki cookie</h2>

      <h3>Cookies niezbędne (zawsze aktywne)</h3>
      <ul>
        <li>
          <strong>Sesja użytkownika</strong> — umożliwiają logowanie i działanie
          konta. Czas trwania: do wylogowania lub wygaśnięcia sesji.
        </li>
      </ul>

      <h3>Cookies analityczne (opcjonalne — wymagają zgody)</h3>
      <ul>
        <li>Używane do mierzenia ruchu na stronie i ulepszania platformy.</li>
        <li>
          Możesz wyrazić lub wycofać zgodę za pomocą bannera cookie lub
          kontaktując się z nami.
        </li>
      </ul>

      <h2>10. Kontakt z administratorem</h2>
      <p>
        W sprawach dotyczących ochrony danych osobowych skontaktuj się z nami:
      </p>
      <p>
        E-mail:{' '}
        <a href="mailto:kontakt@bachatanapoli.pl">
          <strong>kontakt@bachatanapoli.pl</strong>
        </a>
        <br />
        [Adres korespondencyjny — do uzupełnienia przez operatora]
      </p>
    </article>
  );
}
