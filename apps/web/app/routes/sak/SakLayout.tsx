import {type IRolleDetaljer, type RolleTypeAbbreviation, SakHeader} from "@bidrag/common";
import {Loader, Page, VStack} from "@navikt/ds-react";
import React, {Suspense} from "react";
import {Outlet, useParams} from "react-router";

import {RolleDto} from "@bidrag/api/SakApi";
import {useHentSak} from "./useApi";
import {Route} from "+/routes/sak/+types/SakLayout.ts";

export default function SakLayout({params}: Route.ComponentProps) {
    const saksnummer = params.saksnummer
    const {data: sak} = useHentSak(saksnummer);
    const mapToRolleDetalj = (rolle: RolleDto, index: number): IRolleDetaljer => {
        return {
            id: index,
            rolleType: rolle.type as unknown as RolleTypeAbbreviation,
            navn: "Pers " + index,
            ident: rolle.fodselsnummer ?? "",
            saksnummer: saksnummer,
        };
    };
    const roller: Array<IRolleDetaljer> = sak?.roller.map((r, index) => mapToRolleDetalj(r, index)) ?? [];
    return (
        <VStack gap={"space-32"}>
            <Suspense fallback={<Loader size="xsmall"/>}>
                {/*<SakHeader saksnummer={saksnummer} roller={roller}/>*/}
            </Suspense>
            <Page>
                <Page.Block width="xl" gutters={true}>
                    <Suspense fallback={<Loader size="medium"/>}>
                        <Outlet/>
                    </Suspense>
                </Page.Block>
            </Page>
        </VStack>
    );
}
