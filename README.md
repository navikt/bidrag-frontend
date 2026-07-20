# bidrag-frontend

pnpm-monorepo med React Router v8 i framework mode for bidrag saksbehanding.

## Struktur

```
bidrag-frontend/
├── apps/
│   └── web/              # Shell-app — React Router v8 (SSR + SPA)
├── packages/
│   ├── api/              # @bidrag/api — HTTP-klienter og proxy mot backends
│   ├── common/           # @bidrag/common — felles tjenester, React-komponenter, typer
│   └── utils/            # @bidrag/utils — formattering og norsk locale
├── .nais/                # Nais-manifest og miljøvariabel-filer per miljø
└── .github/workflows/    # CI/CD
```

## Kom i gang

**Krav:** Node.js 24+, pnpm 11+

For å installere private `@navikt`-pakker fra GitHub Packages må du ha token-oppsett i `~/.npmrc`.
Se: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry

Eksempel:

```ini
@navikt:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<TOKEN_GITHUB_PAT_MED_PACKAGES_READ>
```

```bash
# Installer avhengigheter
pnpm install

# Start dev-server
pnpm dev

# Bygg alle pakker
pnpm build

# Typesjekk alle pakker
pnpm typecheck

# Lint og format
pnpm check

# Kjør tester i alle workspaces (kun pakker med testscript)
pnpm test
```

## Auth lokalt

Lokal innlogging går via Wonderwall + Texas + localauth.
Frontend nås via Wonderwall på `http://localhost:4000`.

```bash
# 1. Start Wonderwall/Texas/Redis
docker compose up -d

# 2. Start frontend lokalt
pnpm dev
```

Åpne deretter:

```text
http://localhost:4000
```

Direkte åpning av app-porten (f.eks. `localhost:3000`) bypasser Wonderwall og gir ikke riktig auth-flyt.

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

## Scripts

### migrate-imports

Migrerer import-paths i `apps/web/app` (eller en valgfri delmappe) til monorepo-pakker:

| Fra | Til |
|-----|-----|
| `@navikt/bidrag-ui-common` | `@bidrag/common` |
| `react-router-dom` | `react-router` |
| `~/api/**`, `(../)+ api/**` | `@bidrag/api/**` (subpath bevares) |
| `~/utils/**`, `(../)+ utils/**` | `@bidrag/utils/**` (subpath bevares) |

```bash
# Hele apps/web/app (default)
pnpm tsx scripts/migrate-imports.ts

# Eller spesifikk mappe
pnpm tsx scripts/migrate-imports.ts apps/web/app/routes/sak/reskontro
```

### Migreringsoppskrift: bidrag-ui -> bidrag-frontend

Bruk denne rekkefølgen for å unngå breaking changes:

1. Flytt route + komponenter til `apps/web/app/routes/**`.
2. Port hooks/query til `apps/web/app/api/useApi.ts`.
3. Regenerer nødvendige API-klienter i `packages/api/src/api` og koble dem i `packages/api/src/api.ts`.
4. Oppdater env + NAIS:
   - `apps/web/app/env.server.ts`
   - `apps/web/app/api.env.ts`
   - `.nais/q1.yaml`, `.nais/q2.yaml`, `.nais/prod.yaml`
5. Verifiser alltid både outbound i `bidrag-frontend` **og** inbound i målbackend (f.eks. `bidrag-dokument`).
6. Oppdater `apps/web/.env.development` når nye required variabler innføres, ellers feiler `pnpm dev` med Zod-validering.

For `bidrag-dokument` i dev:
- q1: `bidrag-dokument-feature.dev-fss-pub.nais.io` + audience `...bidrag-dokument-feature...`
- q2: `bidrag-dokument.dev-fss-pub.nais.io` + audience `...bidrag-dokument...`

### Fikse TypeScript-feil etter migrering

Når nye filer migreres inn i monorepoet vil `pnpm typecheck` avdekke feil. Vanlige mønstre:

#### `@ts-ignore` → `@ts-expect-error`

Migreringsscriptet kan introdusere `@ts-ignore`. Første steg er å bytte til `@ts-expect-error`
— det gir kompileringsfeil hvis suppresseringen ikke lenger er nødvendig, og avdekker dermed
"falske" suppresseringer:

```bash
# Finn alle gjenværende @ts-ignore
grep -rn "@ts-ignore" apps/ packages/ --include="*.ts" --include="*.tsx"
```

**`@ts-expect-error` er siste utvei** — undersøk alltid rotårsaken først:

1. Kan typen endres til å stemme? → Fiks typen
2. Kan koden skrives om (f.eks. `Object.entries`, type guard, standardverdi)? → Gjør det
3. Er det en `as`-cast som er trygg og selvforklarende? → Bruk `as` i stedet for suppressering
4. Ingen av de over → `@ts-expect-error` med kommentar som forklarer hvorfor

Under migreringen ble samtlige `@ts-expect-error`/`@ts-ignore` fjernet ved å rette rotårsaken —
ingen ble beholdt. Se mønstrene nedenfor for konkrete eksempler på hvordan.

#### `catch (e)` sendt til logger

`e` i catch-blokker er `unknown`. Bruk type guard — ikke `as`-cast:

```ts
// ❌ usikker cast
SecureLoggerService.error("Feil", e as Error);

// ✅ type guard
SecureLoggerService.error("Feil", e instanceof Error ? e : new Error(String(e)));
```

#### `null` vs `undefined` fra API

Genererte API-typer returnerer `null` der interne interfaces forventer `undefined`:

```ts
// ❌ return null i queryFn med returntype T | undefined
if (!request) return null;

// ✅
if (!request) return undefined;
```

#### `useRef` med timeout

```ts
// ❌ null er ikke kompatibelt med clearTimeout
const ref = useRef<NodeJS.Timeout>(null);

// ✅
const ref = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
```

#### `Object.keys` med indeksering

```ts
// ❌ noUncheckedIndexedAccess blokkerer obj[key]
Object.keys(obj).map((key) => obj[key]);

// ✅
Object.entries(obj).map(([key, value]) => value);
```

#### Array-destructuring fra regex match

```ts
// ❌ regex-grupper er string | undefined
const [, prefix, scriptUrl] = match;

// ✅ default-verdier i destructuring
const [, prefix = "", scriptUrl = ""] = match;
```

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
| bidrag-dokument | `BIDRAG_DOKUMENT_URL` / `BIDRAG_DOKUMENT_AUDIENCE` |
| bisys | `BISYS_URL` |
| bidrag-ui | `BIDRAG_UI_BASE_URL` |
