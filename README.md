# bidrag-frontend

pnpm-monorepo med React Router v8 i framework mode for bidrag saksbehanding.

## Struktur

```
bidrag-frontend/
├── apps/
│   └── web/              # Shell-app — React Router v7 (SSR + SPA)
├── packages/
│   ├── api/              # @bidrag/api — HTTP-klienter og proxy mot backends
│   ├── common/           # @bidrag/common — felles tjenester, React-komponenter, typer og utilities
│   ├── types/            # @bidrag/types — delte TypeScript-typer
│   ├── ui/               # @bidrag/ui — felles UI-komponenter
│   └── utils/            # @bidrag/utils — formattering og norsk locale
├── .nais/                # Nais-manifest og miljøvariabel-filer per miljø
└── .github/workflows/    # CI/CD
```

## Kom i gang

**Krav:** Node.js 24+, pnpm 11+

```bash
# Installer avhengigheter
pnpm install

# Start dev-server
pnpm dev

# Bygg alle pakker
pnpm build:all

# Typesjekk alle pakker
pnpm typecheck

# Lint og format
pnpm check
```

## Auth lokalt

Wonderwall og Texas kjører i docker-compose. Den benytter https://github.com/navikt/localauth

## Miljøer

## Miljøer

| Miljø | Ingress |
|-------|---------|
| q1 | `bidrag-q1.intern.dev.nav.no` |
| q2 | `bidrag-q2.intern.dev.nav.no` |
| prod | `bidrag.intern.nav.no` |


Deploy skjer automatisk via GitHub Actions:

| Miljø | Trigger                      | Manifest |
|-------|------------------------------|----------|
| q1 | Manuell, eller push til main | `.nais/q1.yaml` |
| q2 | PR mot main                  | `.nais/q2.yaml` |
| prod | Merge til main               | `.nais/prod.yaml` |

## Backends

Appen kaller følgende backends via OBO-token-exchange (Azure AD):

| Backend | Env-variabel |
|---------|-------------|
| bidrag-sak | `BIDRAG_SAK_URL` / `BIDRAG_SAK_AUDIENCE` |
| bidrag-person | `BIDRAG_PERSON_URL` / `BIDRAG_PERSON_AUDIENCE` |
| bidrag-organisasjon | `BIDRAG_ORGANISASJON_URL` / `BIDRAG_ORGANISASJON_AUDIENCE` |
| bidrag-tilgangskontroll | `BIDRAG_TILGANGSKONTROLL_URL` / `BIDRAG_TILGANGSKONTROLL_AUDIENCE` |
| bidrag-vedtak | `BIDRAG_VEDTAK_URL` / `BIDRAG_VEDTAK_AUDIENCE` |
| bidrag-samhandler | `BIDRAG_SAMHANDLER_URL` / `BIDRAG_SAMHANDLER_AUDIENCE` |
| bidrag-belopshistorikk | `BIDRAG_BELOPSHISTORIKK_URL` / `BIDRAG_BELOPSHISTORIKK_AUDIENCE` |
| bidrag-reskontro | `BIDRAG_RESKONTRO_URL` / `BIDRAG_RESKONTRO_AUDIENCE` |
