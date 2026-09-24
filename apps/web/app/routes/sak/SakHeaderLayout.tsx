import type { RolleDto } from "@bidrag/api/SakApi";
import { type IRolleDetaljer, type RolleTypeAbbreviation, SakHeader } from "@bidrag/common";
import { Outlet, useMatches, useParams } from "react-router";
import { useHentSak } from "~/api/useApi.ts";
import { type SakSideTittelHandle, SakSideTittelProvider } from "./sakSideTittel";

export default function SakHeaderLayout() {
    const { saksnummer = "" } = useParams();
    const { data: sak } = useHentSak(saksnummer);
    const matches = useMatches();
    const routeTittel = matches
        .map((match) => (match.handle as SakSideTittelHandle | undefined)?.sakSideTittel)
        .findLast((tittel) => tittel !== undefined);
    const roller: IRolleDetaljer[] =
        sak?.roller.map((rolle: RolleDto, index: number) => ({
            id: index,
            rolleType: rolle.type as unknown as RolleTypeAbbreviation,
            navn: `Pers ${index}`,
            ident: rolle.fodselsnummer ?? "",
            saksnummer,
        })) ?? [];

    return (
        <SakSideTittelProvider>
            {(overstyrtTittel) => {
                const tittel = overstyrtTittel ?? routeTittel;
                return (
                    <>
                        <SakHeader
                            saksnummer={saksnummer}
                            roller={roller}
                            skjermbilde={tittel ? { navn: tittel, referanse: saksnummer } : undefined}
                        />
                        <Outlet />
                    </>
                );
            }}
        </SakSideTittelProvider>
    );
}
