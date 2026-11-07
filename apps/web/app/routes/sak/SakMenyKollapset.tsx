import { createContext, type ReactNode, useContext, useState } from "react";

type SakMenyKollapset = [kollapset: boolean, setKollapset: (kollapset: boolean) => void];

const SakMenyKollapsetContext = createContext<SakMenyKollapset | null>(null);

/**
 * Holder rede på om sakmenyen er skjult, for alle sakssider under samme sak. Tilstanden ligger over
 * layoutene, slik at menyen forblir skjult når saksbehandler går mellom sider med ulike layouter.
 */
export function SakMenyKollapsetProvider({ children }: { children: ReactNode }) {
    const tilstand = useState(false);
    return <SakMenyKollapsetContext.Provider value={tilstand}>{children}</SakMenyKollapsetContext.Provider>;
}

/** Tilstanden fra `SakMenyKollapsetProvider`, eller en lokal tilstand når provideren mangler. */
export function useSakMenyKollapset(): SakMenyKollapset {
    const delt = useContext(SakMenyKollapsetContext);
    const lokal = useState(false);
    return delt ?? lokal;
}
