---
name: bidrag-frontend-migrering
description: Migrer funksjonalitet fra bidrag-ui til bidrag-frontend med fast oppskrift for route, API, env og NAIS
license: MIT
compatibility: bidrag-ui + bidrag-frontend
metadata:
  domain: frontend
  tags: migration react-router nais api
---

# Bidrag Frontend-migrering

Bruk denne når en funksjon/side skal flyttes fra `bidrag-ui` til `bidrag-frontend`.

## Workflow

1. **Kartlegg scope**
   - Kildeside + alle underkomponenter
   - Hooks/query i `useApi`
   - API-klienter i `packages/api`
   - Ruter som siden lenker videre til

2. **Flytt UI og route**
   - Opprett route under `apps/web/app/routes/**`
   - Flytt filer
   - Kjør `pnpm tsx scripts/migrate-imports.ts <mappe>`
   - Rydd imports manuelt etter behov

3. **Flytt datahenting**
   - Port hooks til `apps/web/app/api/useApi.ts`
   - Behold eksisterende mønster for `TilgangsFeilError`, logging og retry

4. **Koble API-kontrakter**
   - Regenerer API-klienter i `packages/api/src/api`
   - Koble klient i `packages/api/src/api.ts`
   - Unngå manuell redigering av genererte filer

5. **Miljø og NAIS**
   - Legg til URL + audience i `apps/web/app/env.server.ts`, `api.env.ts` og `.nais/*.yaml`
   - Oppdater outbound host i `bidrag-frontend`
   - Verifiser inbound-regler i målbackend (f.eks. `bidrag-dokument`) for riktig caller-app og cluster

6. **Legacy/Bisys**
   - Behold URL-kompatibilitet
   - Legg til redirect-ruter der ny løsning mangler målrute

7. **Lokal kjøring**
   - Oppdater `apps/web/.env.development` med nye obligatoriske variabler
   - Kjør `pnpm dev` og verifiser at `env.server.ts` ikke feiler

8. **Verifisering**
   - `pnpm --filter @bidrag/api run typecheck`
   - `pnpm --filter web run typecheck`
   - Målrettet `biome check` på berørte filer

## Vanlige feil

- 403 mot backend fordi inbound-rule mangler i målrepo
- Feil audience/URL for miljø (q1/q2/prod)
- `pnpm dev` feiler pga manglende env i `.env.development`
- React-komponent returnerer `undefined` i stedet for `null`
