import { useEffect, useState } from "react";
import type { MenyVisning } from "./useDokumentState";

/**
 * Nedre grense for hvor bred nettleseren må være før en gitt visning er brukbar. Under grensen tar
 * venstremenyen så mye plass at dokumentfremviseren blir ubrukelig, så visningen minimeres automatisk.
 */
const MINSTE_VINDUSBREDDE: Record<MenyVisning, number> = {
    skjult: 0,
    liste: 700,
    tabell: 1200,
};

function finnMaksVisning(vindusbredde: number): MenyVisning {
    if (vindusbredde >= MINSTE_VINDUSBREDDE.tabell) return "tabell";
    if (vindusbredde >= MINSTE_VINDUSBREDDE.liste) return "liste";
    return "skjult";
}

/**
 * Den mest plasskrevende visningen vinduet har plass til akkurat nå.
 *
 * Brukerens valgte visning beholdes uendret – den klemmes bare ned til dette taket mens vinduet er
 * for smalt, og gjenopprettes automatisk når vinduet blir bredt igjen.
 *
 * Ved server-rendering antas full bredde, slik at markupen matcher det de fleste ser.
 */
export function useMaksMenyVisning(): MenyVisning {
    const [maksVisning, setMaksVisning] = useState<MenyVisning>("tabell");

    useEffect(() => {
        const oppdater = () => setMaksVisning(finnMaksVisning(window.innerWidth));

        oppdater();
        window.addEventListener("resize", oppdater);
        return () => window.removeEventListener("resize", oppdater);
    }, []);

    return maksVisning;
}
