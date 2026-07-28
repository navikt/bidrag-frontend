// routes/sak/sakSideTittel.tsx
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

/**
 * Route-`handle`-form for statisk sidetittel. Legges til i den enkelte side-modulen med
 * `export const handle: SakSideTittelHandle = { sakSideTittel: "Sakshistorikk" }`, og plukkes
 * opp automatisk av `SakBaseLayout` via `useMatches()` – uavhengig av hvor dypt siden ligger
 * i rute-hierarkiet (f.eks. under `SakStandardLayout`).
 */
export interface SakSideTittelHandle {
    sakSideTittel?: string;
}

interface SakSideTittelContextValue {
    settOverstyrtTittel: (tittel: string | undefined) => void;
}

const SakSideTittelContext = createContext<SakSideTittelContextValue | undefined>(undefined);

/**
 * Holder styr på en eventuell sideoverstyring av tittelen som vises i `SakHeader`.
 *
 * Wrapper `SakHeader` + `Outlet` i `SakBaseLayout`. Render-prop-mønsteret gir `SakBaseLayout`
 * tilgang til gjeldende overstyring (for å sende videre til `SakHeader`), samtidig som
 * `Outlet`-treet får contexten tilgjengelig for `useSettSakSideTittel`.
 */
export function SakSideTittelProvider({ children }: { children: (overstyrtTittel: string | undefined) => ReactNode }) {
    const [overstyrtTittel, setOverstyrtTittel] = useState<string | undefined>(undefined);

    return (
        <SakSideTittelContext.Provider value={{ settOverstyrtTittel: setOverstyrtTittel }}>
            {children(overstyrtTittel)}
        </SakSideTittelContext.Provider>
    );
}

/**
 * Lar en side overstyre tittelen som vises øverst i sak-headeren, f.eks. for å vise noe mer
 * spesifikt enn den statiske route-tittelen (dokumentnavn, journalpost-id o.l.).
 *
 * Nullstilles automatisk når siden unmountes eller `tittel` endres til `undefined`, slik at
 * neste side ikke arver en gammel overstyring.
 *
 * @example
 * useSettSakSideTittel(dokument ? `Dokument – ${dokument.tittel}` : undefined);
 */
export function useSettSakSideTittel(tittel: string | undefined) {
    const ctx = useContext(SakSideTittelContext);
    if (!ctx) {
        throw new Error("useSettSakSideTittel må brukes innenfor SakBaseLayout");
    }

    useEffect(() => {
        ctx.settOverstyrtTittel(tittel);
        return () => ctx.settOverstyrtTittel(undefined);
    }, [ctx, tittel]);
}
