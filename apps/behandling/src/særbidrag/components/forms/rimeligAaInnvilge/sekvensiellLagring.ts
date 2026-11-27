/**
 * Lagrer én om gangen. Et kall mens en lagring pågår, lagres etter den pågående lagringen. Flere kall mens en lagring pågår, gir
 * bare én ny lagring, med det siste navnet. Lagringen leser selv de nyeste verdiene, så den siste lagringen har alltid den siste
 * endringen, og lagringene kommer fram i samme rekkefølge som endringene.
 */
export const opprettSekvensiellLagring = (lagre: (name: string) => Promise<void>) => {
    let lagringPågår = false;
    let ventende: string | null = null;

    return async (name: string): Promise<void> => {
        if (lagringPågår) {
            ventende = name;
            return;
        }
        lagringPågår = true;
        try {
            let neste: string | null = name;
            while (neste !== null) {
                ventende = null;
                await lagre(neste);
                neste = ventende;
            }
        } finally {
            lagringPågår = false;
        }
    };
};
