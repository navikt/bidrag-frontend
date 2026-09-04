# Bidrag-dokument-ui
Web-grensesnitt for `bidrag-dokument` som er integrert med BISYS og JOARK.

### Inneholder kode for følgende sider:
* Registrer journalpost
  * Journalføring av inngående journalposter
  * Avvikshåndtering av inngående journalposter
* Vis journalpost
  * Vis og oppdater utgående og inngående journalpost
  * Avvikshåndtering
* Åpne dokument
  * Åpne dokument som er arkivert i Joark og Midl. brevlager

### Module federation og mikrofrontends
Applikasjonen benytter seg av noe som heter [module federation](https://webpack.js.org/concepts/module-federation/). Det er et konsept for å lage mikrofrontends.

Hver linje under [webpack config](webpack.common.config.js) -> `ModuleFederationPlugin` -> `exposes` vil bygges som en separat applikasjon.
Dette kan da brukes av feks `bidrag-ui` eller annen applikasjon (kalt `host`) til å hente og rendre applikasjonen som React komponent selv om koden ligger annen sted (`remote`).

Parameteren `shared` i `ModuleFederationPlugin` forteller `module federation` hvilken avhengigheter som er delt mellom `host` og `remote` slik at den ikke henter samme kode flere ganger.

### Deployment
Ved deployment så publiseres bygget til `gcp` cloud storage under bucket navn `bidrag-ui-static-files-dev` i dev og `bidrag-ui-static-files-prod` i prod.
Applikasjonen [bidrag-ui-static-files](https://github.com/navikt/bidrag-ui-static-files) er et proxy app som henter og cacher bygg filene som er publisert til cloud storage.
`Bidrag-ui` er konfigurert med module-federation til å hente mikrofrontend bygg filene fra denne applikasjonen og dermed rendre mikrofrontendene fra `remote` kilde.

### Miljøvariabler
Miljøvariabler er definert i `.env.*` filene. Disse inneholder url til applikasjoner som bidrag-dokument-ui kaller for å hente informasjon fra
* [.env.local](env/.env.local) innholder miljøvariabler som brukes i Q1 og benyttes ved lokal kjøring
* [.env.feature](env/.env.feature) innholder miljøvariabler som brukes i Q1 og benyttes ved commit til brancher `!= main` og `!= release`
* [.env.main](env/.env.main) innholder miljøvariabler som brukes i Q2 og benyttes ved commit til `main`
* [.env.prod](env/.env.prod) innholder miljøvariabler som brukes i prod og benyttes ved commit til `release`

#### Start opp applikasjon
* Last ned bidrag-ui og kjør `yarn install` og deretter `yarn dev`
* Last ned bidrag-dokument-ui (dette repoet) og kjør `yarn install` og deretter `yarn dev`
* Naviger til `http://localhost:8080/journalpost/BID-200000/?enhet=4806`. Hvis alt er ok skal du få opp `registrer journalpost` bildet
##### Kjør med mockdata
* Kjør med `yarn dev:mock`


##### Deploy til miljø lokalt fra terminalen
Eksporter miljøvariabler for feature/Q1 i terminalen
```bash
export $(grep -v '^#' env/.env.feature | xargs)
```
Deretter bygg koden
```bash
yarn build
```
Og last opp bygget til GCP storage (Du må ha installert gcloud cli tools og være logget inn)
```bash
gsutil -m rsync -R -d dist gs://bidrag-ui-static-files-dev/bidrag_dokument_ui/feature/static
```
d