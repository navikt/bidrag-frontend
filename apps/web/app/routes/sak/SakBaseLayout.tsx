// routes/sak/SakBaseLayout.tsx
import type { RolleDto } from "@bidrag/api/SakApi";
import { type IRolleDetaljer, type RolleTypeAbbreviation, SakHeader } from "@bidrag/common";
import { Loader, VStack } from "@navikt/ds-react";
import { Suspense, useEffect, useMemo } from "react";
import { Outlet, useMatches } from "react-router";
import { useHentSak } from "~/api/useApi.ts";
import { useBisysLink } from "~/common/bisys/useBisysLink.ts";
import type { Route } from "./+types/SakBaseLayout.ts"; // Merk navnebyttet!
import { type SakSideTittelHandle, SakSideTittelProvider } from "./sakSideTittel";

export default function SakBaseLayout({ params }: Route.ComponentProps) {
    const saksnummer = params.saksnummer;
    const { setBisysLinkTarget } = useBisysLink();

    useEffect(() => {
        setBisysLinkTarget("sak", { saksnr: saksnummer });
    }, [saksnummer]);

    const { data: sak } = useHentSak(saksnummer);
    const mapToRolleDetalj = (rolle: RolleDto, index: number): IRolleDetaljer => {
        return {
            id: index,
            rolleType: rolle.type as unknown as RolleTypeAbbreviation,
            navn: `Pers ${index}`,
            ident: rolle.fodselsnummer ?? "",
            saksnummer: saksnummer,
        };
    };
    const roller: Array<IRolleDetaljer> = sak?.roller.map((r, index) => mapToRolleDetalj(r, index)) ?? [];

    // Standardtittel hentes fra `handle.sakSideTittel` på den dypeste matchende ruten
    // (f.eks. eksportert fra SakshistorikkPage.tsx). Sider kan overstyre denne dynamisk
    // via `useSettSakSideTittel` (se `sakSideTittel.tsx`).
    const matches = useMatches();
    const routeTittel = useMemo(() => {
        for (let i = matches.length - 1; i >= 0; i--) {
            const handle = matches[i]?.handle as SakSideTittelHandle | undefined;
            if (handle?.sakSideTittel) return handle.sakSideTittel;
        }
        return undefined;
    }, [matches]);

    return (
        <SakSideTittelProvider>
            {(overstyrtTittel) => {
                const tittel = overstyrtTittel ?? routeTittel;
                return (
                    <VStack gap={"space-32"}>
                        <Suspense fallback={<Loader size="xsmall" />}>
                            <SakHeader
                                saksnummer={saksnummer}
                                roller={roller}
                                skjermbilde={tittel ? { navn: tittel, referanse: saksnummer } : undefined}
                            />
                        </Suspense>
                        {/* Rendres direkte uten Page.Block for å tillate full bredde */}
                        <Outlet />
                    </VStack>
                );
            }}
        </SakSideTittelProvider>
    );
}
