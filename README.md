# bidrag-frontend

pnpm-monorepo med React Router v7 i framework mode for bidrag-saksbehandlersystemet.

## Struktur

```
bidrag-frontend/
├── apps/
│   └── web/              # Shell-app — React Router v7 (SSR + SPA)
├── packages/
│   ├── sak/              # @bidrag/sak
│   ├── forsendelse/      # @bidrag/forsendelse
│   ├── dokument/         # @bidrag/dokument
│   ├── bidrag/           # @bidrag/bidrag
│   ├── ui/               # @bidrag/ui — felles Header, Layout, NavMenu
│   ├── types/            # @bidrag/types — delte TypeScript-typer
│   ├── api/              # @bidrag/api — HTTP-klienter mot backends
│   └── utils/            # @bidrag/utils — formattering, norsk locale
├── nais/                 # Nais-manifest + vars-dev.yaml + vars-prod.yaml
└── .github/workflows/    # CI/CD
```

## Kom i gang

**Krav:** Node.js 22+, pnpm 9+

```bash
# Installer avhengigheter
pnpm install

# Start dev-server
pnpm dev

# Bygg
pnpm build

# Typesjekk alle pakker
pnpm typecheck

# Test
pnpm test
```

## Auth lokalt

Wonderwall kjører ikke lokalt. For å teste med token, sett `Authorization`-header manuelt eller bruk en lokal mock.

## Legge til en ny domenepakke

1. Lag mappen `packages/mittdomene/`
2. Kopier `package.json` og `tsconfig.json` fra en eksisterende domenepakke
3. Oppdater navn til `@bidrag/mittdomene`
4. Lag `src/routes.ts` med rutekonfigurasjon
5. Legg til avhengighet i `apps/web/package.json`
6. Importer og registrer ruter i `apps/web/app/routes.ts`

## Legge til ny backend

1. Legg til ny fil i `packages/api/src/mittbackend.ts`
2. Eksporter fra `packages/api/package.json` under `"exports"`
3. Legg til `accessPolicy.outbound.rules` i `nais/nais.yaml`

## Deploy

Deploy skjer automatisk ved push til `main`:
- **dev-gcp** deployes umiddelbart
- **prod-gcp** deployes etter vellykket dev-deploy

## 🔴 Viktig: OBO-token-exchange

`packages/api/src/index.ts` inneholder en `getOnBehalfOfToken`-funksjon som **må implementeres** før appen kan kalle backends. Se kommentaren i filen og [Nais-dokumentasjonen](https://docs.nais.io/auth/azure-ad/how-to/consume-obo/).
