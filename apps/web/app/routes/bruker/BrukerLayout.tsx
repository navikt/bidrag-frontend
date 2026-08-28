import {HStack, Loader, Page, VStack} from "@navikt/ds-react";
import {Outlet} from "react-router";
import {useHentPersoninformasjon} from "~/api/useApi";
import {useObfuscateFnr} from "~/common/person/useObfuscateFnr";
import BrukerMeny from "~/routes/bruker/BrukerMeny";
import type {Route} from "./+types/BrukerLayout";
import {BrukerHeader} from "./BrukerHeader";
import {useTilgangssjekkBruker} from "@bidrag/common";

export default function BrukerLayout({params}: Route.ComponentProps) {
    const {decodeFnr} = useObfuscateFnr();
    const brukerId = params.brukerid;
    const ident = decodeFnr(brukerId);
    const {harTilgang, TilgangAlert} = useTilgangssjekkBruker(ident);
    const {data: bruker, isLoading, error} = useHentPersoninformasjon({ident}, harTilgang);

    if (!harTilgang && TilgangAlert) return (
        <Page.Block gutters>
            <VStack justify={"center"} margin={"space-64"}>
                <TilgangAlert size={"medium"}/>
            </VStack>
        </Page.Block>
    )

    if (isLoading || bruker === undefined) {
        return <Loader/>;
    }

    if (error) {
        return error.message;
    }

    return (
        <VStack gap={"space-32"}>
            <BrukerHeader bruker={bruker}/>
            <HStack gap={"space-32"} wrap={false}>
                <BrukerMeny brukerId={brukerId}/>
                <Page.Block width="2xl" style={{flex: "1 1 auto", minWidth: 0}}>
                    <Outlet/>
                </Page.Block>
            </HStack>
        </VStack>
    );
}
