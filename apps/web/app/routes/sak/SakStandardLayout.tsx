// routes/sak/SakStandardLayout.tsx

import { HGrid, Loader, Page } from "@navikt/ds-react";
import { Suspense } from "react";
import { Outlet, useParams } from "react-router";
import SakMeny from "~/routes/sak/SakMeny.tsx";

export default function SakStandardLayout() {
    const { saksnummer = "" } = useParams();

    return (
        <HGrid
            columns={{ xs: "14rem minmax(0, 1fr)", "2xl": "14rem minmax(0, 1fr) 14rem" }}
            gap="space-32"
            marginBlock="space-32 space-0"
            paddingInline={{ xs: "space-16", "2xl": "space-0" }}
            minWidth="0"
        >
            <SakMeny saksnummer={saksnummer} />
            <Page.Block width="2xl">
                <Suspense fallback={<Loader size="medium" />}>
                    <Outlet />
                </Suspense>
            </Page.Block>
        </HGrid>
    );
}
