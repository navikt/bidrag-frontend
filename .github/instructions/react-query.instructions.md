---
applyTo: "apps/**/*.{ts,tsx}"
---

# React Query — utledet state

bidrag-frontend er en React Router (ikke Next.js) + Vite-app med TanStack React Query
(`@tanstack/react-query`) som standard for server-state.

## Bruk `useMemo`, ikke `useState` + `useEffect`

Ikke speil et query-resultat inn i egen `useState` og synkroniser det med `useEffect`.
Regn ut utledede verdier direkte i render med `useMemo` fra queryens `data`/`isLoading`/`error`.
Synkronisering via `useEffect` gir en ekstra render-runde og åpner for stale state.

```tsx
// ❌ Feil — speiler queryen inn i egen state via useEffect
const [harTreff, setHarTreff] = useState(false);
const { data } = useQuery({ queryKey: ["ting"], queryFn: hentTing });

useEffect(() => {
    setHarTreff(!!data?.length);
}, [data]);

// ✅ Riktig — utled direkte fra queryresultatet
const { data } = useQuery({ queryKey: ["ting"], queryFn: hentTing });
const harTreff = useMemo(() => !!data?.length, [data]);
```

`useEffect` er for synkronisering mot noe *utenfor* React (DOM, subscriptions, eksterne
stores, imperative context-settere) — ikke for å utlede verdier som kan regnes ut i render.

Referanse i kodebasen: `useBestemEnhet.ts` bruker `useMemo` riktig;
`useEksisterendeSakSjekk.ts` ble refaktorert fra `useState`+`useEffect` til `useMemo`
for samme mønster.

## Ikke dupliser synkronisering til delt context

Hvis en hook allerede synker et query-/mutasjonsresultat (f.eks. `isPending`) inn i en
delt context, skal ikke komponenter som konsumerer hooken gjøre den samme
synkroniseringen på nytt med sin egen `useEffect`. Les verdien fra contexten i stedet.

## Boundaries

### 🚫 Never

- Speile query-/mutasjonsresultat inn i `useState` og synkronisere med `useEffect` når
  verdien kan utledes direkte med `useMemo`
- Duplisere samme context-synkronisering i flere komponenter
