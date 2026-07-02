# AGENTS.md — bidrag-frontend

Kortfattet kontekst for AI-agenter som jobber i dette repoet.

## Hva er dette?

pnpm-monorepo for bidrag. Frontend for saksbehandlere i NAV som jobber med barnebidrag.

## Tech stack

- **Rammeverk:** React Router v8 (SSR + SPA), TypeScript
- **Pakkemanager:** pnpm 11+ med workspace
- **Lint/format:** Biome
- **Test:** Vitest
- **Auth:** Azure AD + Wonderwall sidecar (Nais)
- **Deploy:** Nais (GCP), GitHub Actions

## Monorepo-struktur

```
apps/web/          # Shell-app — React Router v8, entry point
packages/api/      # @bidrag/api — HTTP-klienter og proxy mot backends
packages/common/   # @bidrag/common — felles tjenester, React-komponenter, typer
packages/utils/    # @bidrag/utils — formattering og norsk locale
.nais/             # Nais-manifest og miljøvariabel-filer (q1, q2, prod)
.github/workflows/ # CI/CD
```

## Viktige mønstre

### Auth
- Innlogget saksbehandler autentiseres via Azure AD + Wonderwall
- Kall til backends bruker OBO-token-exchange (On-Behalf-Of)
- Audiences og URLs per backend konfigureres i `.nais/*.yaml`og i miljøvariabler (`.env.*`) for lokal kjøring

### API-klienter
- Legg nye backend-klienter i `packages/api/src/`
- Eksporter fra `packages/api/src/index.ts`
- Legg til outbound-regel i `.nais/nais.yaml` og URL/audience i alle miljøfiler

### Ruter
- Ruter registreres i `apps/web/app/routes.ts`
- Health-endepunkter: `GET /internal/health/liveness` og `/readiness`

## Kommandoer

```bash
pnpm install          # Installer avhengigheter
pnpm dev              # Start dev-server (apps/web)
pnpm build        # Bygg alle pakker
pnpm typecheck        # Typesjekk alle pakker
pnpm check            # Lint + format (Biome)
pnpm test             # Kjør tester i alle workspaces (kun pakker med testscript)
```

## Grenser

- Ikke logg PII (fødselsnummer, navn, adresse)
- Bruk Aksel Design System-komponenter og spacing-tokens (`space-*`)
- Ikke sett CPU-limits i Nais-manifest (kun requests)
- Aldri hardkode tokens eller secrets
