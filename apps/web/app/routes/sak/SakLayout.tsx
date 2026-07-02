import type { RolleDto } from "@bidrag/api/SakApi";
import {
    type IRolleDetaljer,
    type RolleTypeAbbreviation,
    SakHeader,
} from "@bidrag/common";
import { Loader, Page, VStack } from "@navikt/ds-react";
import { Suspense, useEffect } from "react";
import { Outlet } from "react-router";
import { useHentSak } from "~/api/useApi.ts";
import { useBisysLink } from "~/common/bisys/useBisysLink.ts";
import type { Route } from "./+types/SakLayout.ts";

export default function SakLayout({ params }: Route.ComponentProps) {
    const saksnummer = params.saksnummer;
    const { setBisysLinkTarget } = useBisysLink();

    useEffect(() => {
        setBisysLinkTarget("sak", { saksnr: saksnummer });
    }, [saksnummer]);

    const { data: sak } = useHentSak(saksnummer);
    const mapToRolleDetalj = (
        rolle: RolleDto,
        index: number,
    ): IRolleDetaljer => {
        return {
            id: index,
            rolleType: rolle.type as unknown as RolleTypeAbbreviation,
            navn: `Pers ${index}`,
            ident: rolle.fodselsnummer ?? "",
            saksnummer: saksnummer,
        };
    };
    const roller: Array<IRolleDetaljer> =
        sak?.roller.map((r, index) => mapToRolleDetalj(r, index)) ?? [];
    return (
        <VStack gap={"space-32"}>
            <Suspense fallback={<Loader size="xsmall" />}>
                <SakHeader saksnummer={saksnummer} roller={roller} />
            </Suspense>
            <Page.Block width="xl">
                <Suspense fallback={<Loader size="medium" />}>
                    <Outlet />
                </Suspense>
            </Page.Block>
        </VStack>
    );
}
