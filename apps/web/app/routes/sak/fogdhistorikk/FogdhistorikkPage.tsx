import {Box, Heading, LocalAlert, VStack} from "@navikt/ds-react";

import PageLoadingSpinner from "../../components/loadingspinner/PageLoadingSpinner";
import {useHentFogdhistorikk} from "../useApi.ts";
import FogdhistorikkTabell from "./components/FogdhistorikkTabell";
import type {Route} from "+/routes/sak/fogdhistorikk/+types/FogdhistorikkPage.ts";

export default function FogdhistorikkPage({params}: Route.ComponentProps) {
    const {saksnummer} = params;
    const {
        data: fogdhistorikk,
        error: fogdhistorikkError,
        isLoading: fogdhistorikkLoading,
    } = useHentFogdhistorikk(saksnummer);


    if (fogdhistorikkLoading) {
        return <PageLoadingSpinner/>;
    }

    if (fogdhistorikkError) {
        return (
            <Box margin={"space-16"}>
                <LocalAlert status="error">
                    <LocalAlert.Header>
                        <LocalAlert.Title>{fogdhistorikkError.message}</LocalAlert.Title>
                    </LocalAlert.Header>
                </LocalAlert>
            </Box>
        );
    }

    const eierenhet = fogdhistorikk.filter((historikk) => historikk.type === "EIER");
    const midlertidige = fogdhistorikk.filter((historikk) => historikk.type === "MIDL");

    return (
        <VStack gap={"space-64"}>
            <Heading size={"large"}>Fogdhistorikk</Heading>
            <FogdhistorikkTabell tittel="Eierenhet" historikk={eierenhet}/>
            <FogdhistorikkTabell tittel="Midlertidig autorisasjon" historikk={midlertidige}/>
        </VStack>
    );
}
