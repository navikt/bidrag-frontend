// routes/sak/SakStandardLayout.tsx

import { HGrid, Loader, Page } from "@navikt/ds-react";
import { Suspense } from "react";
import { Outlet, useMatches, useParams } from "react-router";
import SakMeny from "~/routes/sak/SakMeny.tsx";
import { useSakMenyKollapset } from "~/routes/sak/SakMenyKollapset.tsx";

/**
 * Route-`handle` for sider med brede tabeller. `brukHeleBredden` fjerner den tomme høyrekolonnen
 * som standardlayouten har fra 2xl, slik at siden får den plassen.
 */
export interface SakStandardLayoutHandle {
    brukHeleBredden?: boolean;
}

export default function SakStandardLayout() {
    const { saksnummer = "" } = useParams();
    const [menyKollapset, setMenyKollapset] = useSakMenyKollapset();
    const menykolonne = menyKollapset ? "max-content" : "14rem";
    const brukHeleBredden = useMatches().some(
        (match) => (match.handle as SakStandardLayoutHandle | undefined)?.brukHeleBredden,
    );

    return (
        <HGrid
            columns={
                brukHeleBredden
                    ? `${menykolonne} minmax(0, 1fr)`
                    : { xs: `${menykolonne} minmax(0, 1fr)`, "2xl": `${menykolonne} minmax(0, 1fr) 14rem` }
            }
            gap="space-32"
            marginBlock="space-32 space-0"
            paddingInline={brukHeleBredden ? "space-16" : { xs: "space-16", "2xl": "space-0" }}
            minWidth="0"
        >
            <SakMeny saksnummer={saksnummer} kollapset={menyKollapset} onKollapsetChange={setMenyKollapset} />
            <Page.Block width="2xl">
                <Suspense fallback={<Loader size="medium" />}>
                    <Outlet />
                </Suspense>
            </Page.Block>
        </HGrid>
    );
}
