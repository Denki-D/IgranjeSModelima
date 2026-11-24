# Model Playground

Mali, statički workspace za eksperimentiranje s primjerima datoteka i bilježenje izmjena uz odabranog AI agenta.

## Pokretanje

Otvori `index.html` u modernom web-pregledniku. Aplikacija nema ovisnosti i ne treba instalaciju ni build.

## Automatska provjera kvalitete koda

Pokreni `npm test` lokalno uz Node.js 18 ili noviji. GitHub Actions automatski pokreće istu provjeru pri svakom pushu i pull requestu; nema dodatnih paketa ni koraka instalacije.

Dependabot jednom tjedno provjerava ima li novih verzija GitHub Actions i grupira ažuriranja u pull requestove.

## Korištenje

- Odaberi datoteku iz popisa workspacea i uređuj njezin sadržaj.
- Odaberi agenta u izborniku prije spremanja izmjene.
- Pregledaj spremljene izmjene u panelu aktivnosti.

Početne ogledne datoteke definirane su u `seedFiles` unutar `app.js`.

## Pohrana podataka

Izmjene i povijest aktivnosti spremaju se samo u `localStorage` preglednika pod ključem `model-playground-v1`. Podaci se ne upisuju u projektne datoteke i ne sinkroniziraju između preglednika. Agent se odabire ručno; aplikacija ga ne prepoznaje automatski.
