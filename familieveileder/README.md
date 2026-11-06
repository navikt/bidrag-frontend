# bidrag-familieveileder

Rolleveilederen (`FamilieveilederShadow`) som Bisys laster inn som en mikrofrontend via Module Federation. Saksbehandleren bruker den til å velge bidragspliktig, bidragsmottaker og barn ut fra familierelasjonene til en person.

Appen er skilt ut fra `sak-ui` i [bidrag-ui](https://github.com/navikt/bidrag-ui), og den erstatter den gamle versjonen direkte.

## Kontrakt med Bisys

Disse verdiene må ikke endres uten at Bisys endres samtidig:

| Hva                  | Verdi                 |
| -------------------- | --------------------- |
| Module Federation-navn | `bidrag_sak_ui`     |
| Eksponert modul      | `./Familieveileder`   |
| Inngangsfil          | `remoteEntry.js`      |
| Custom element       | `<familie-veileder>`  |
| Delte avhengigheter  | `react`, `react-dom` (singleton) |

Props: `fodselsnummer`, `rolle`, `valgteRoller` og `onSubmit(valgteRoller)`. Komponenten blir rendret i en shadow root, slik at stilene ikke lekker inn i eller ut av Bisys. Funksjonsprops blir sendt videre som `window`-eventer med navnet `familie-veileder_<prop>`.

Appen henter familierelasjoner fra `/rtv-bidrag/api/v1/person/<fnr>` med cookies (`credentials: include`) på samme domene som Bisys.

## Utvikling

Krever Node 24 (se `.nvmrc`) og pnpm (versjonen står i `packageManager`, bruk `corepack enable`).

```bash
pnpm install
pnpm dev          # Utviklingsserver med testdata
pnpm test         # Vitest
pnpm lint
pnpm typecheck
pnpm prettier     # Sjekker formatering (pnpm format retter den)
pnpm build        # Produksjonsbygg til dist/
```

## Deploy

`dist/` blir lastet opp til GCS-bøttene som Bisys henter `remoteEntry.js` fra:

| Miljø | Når                     | Bøtte                                                      |
| ----- | ----------------------- | ---------------------------------------------------------- |
| q1    | Push til alle brancher  | `gs://bidrag-ui-static-files-dev/bidrag_sak_ui/feature/static` |
| q2    | Push til alle brancher  | `gs://bidrag-ui-static-files-dev/bidrag_sak_ui/main/static`    |
| prod  | Push til `main`         | `gs://bidrag-ui-static-files-prod/bidrag_sak_ui/static`        |

Dependabot-brancher blir ikke deployet. De går gjennom CI, og minor- og patch-oppdateringer blir merget automatisk.

### Secrets

| Secret                     | Brukes til             |
| -------------------------- | ---------------------- |
| `GCP_SERVICEUSER_KEY_DEV`  | Opplasting til q1 og q2 |
| `GCP_SERVICEUSER_KEY_PROD` | Opplasting til prod    |

For at automerge skal fungere, må repoet tillate auto-merge, og `main` må ha branch protection som krever at CI-sjekken `verify / Lint, test og bygg` er grønn.

## Overgang fra bidrag-ui

Workflowene `deploy_sak_shadow.yaml` og `deploy_mfe_shadow.yaml` i bidrag-ui skriver til de samme bøttene. Slå dem av når dette repoet deployer, ellers overskriver de to repoene hverandre.
