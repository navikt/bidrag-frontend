import { useBisysLink, useTilgangssjekkSak } from "@bidrag/common";
import { Page, VStack } from "@navikt/ds-react";
import { useEffect } from "react";
import { Outlet, useParams } from "react-router";

export default function SakBaseLayout() {
    const { saksnummer = "" } = useParams();
    const { setBisysLinkTarget } = useBisysLink();
    const { harTilgang, TilgangAlert } = useTilgangssjekkSak(saksnummer);

    useEffect(() => {
        setBisysLinkTarget("sak", { saksnr: saksnummer });
    }, [saksnummer]);

    if (!harTilgang && TilgangAlert) {
        return (
            <Page.Block gutters>
                <VStack justify={"center"} margin={"space-64"}>
                    <TilgangAlert size={"medium"} />
                </VStack>
            </Page.Block>
        );
    }

    return <Outlet />;
}
