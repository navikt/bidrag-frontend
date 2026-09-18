# E2E-workspace

E2E-testene åpner brukerrettede sider uten å lagre eller endre data. Lokal kjøring går gjennom Wonderwall på
`http://localhost:4000`. Testene kan også kjøres mot Q2. 

## Konfigurasjon

e2e.config inneholder parametere for å kjøre mot data i Q2/lokalt
.env inneholder brukernavn og passord for pålogging. Denne fila er ikke sjekket inn og må opprettes lokalt. Eksempel:

```bash
# .env
E2E_USER=brukernavn
E2E_PASSWORD=passord
```

Fila er ignorert av Git. Ikke legg inn reelle personopplysninger. Testdataene må peke på sammenhengende data i Q2,
blant annet en behandling, et vedtak, en journalpost og en forsendelse som hører til den valgte saken.

## Kjøring

Start appen og Wonderwall før lokal kjøring:

```bash
pnpm test:e2e:local
```

Kjør mot Q2:

```bash
pnpm test:e2e:q2
```

Filtrer testene med vanlige Playwright-argumenter:

```bash
pnpm test:e2e --grep "sakshistorikk"
```
