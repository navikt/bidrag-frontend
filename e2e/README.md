# E2E-workspace

E2E-testene åpner brukerrettede sider uten å lagre eller endre data. Lokal kjøring går gjennom Wonderwall på
`http://localhost:4000`. Testene kan også kjøres mot Q2. `e2e/` er et eget pnpm-workspace med egen
`package.json`, `tsconfig.json` og `playwright.config.ts`.

## Konfigurasjon

Kopier `e2e.local.config.example` til `e2e.config`, og fyll inn syntetiske testdata og
innloggingsdata:

```bash
cp e2e/e2e.local.config.example e2e/e2e.local.config
```

Fila er ignorert av Git. Ikke legg inn reelle personopplysninger. Testdataene må peke på sammenhengende data i Q2,
blant annet en behandling, et vedtak, en journalpost og en forsendelse som hører til den valgte saken.

## Kjøring

Start appen og Wonderwall før lokal kjøring:

```bash
docker compose up -d
pnpm dev
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

Testene bruker Chromium og lagrer innlogget nettlesertilstand i `e2e/.auth/`. Rapporter og traces opprettes
bare ved feil. Innloggingssteget tar ikke trace eller screenshot.
