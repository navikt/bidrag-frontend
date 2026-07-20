import { Box, Heading, LocalAlert, VStack } from "@navikt/ds-react";
import { useHentFogdhistorikk } from "~/api/useApi.ts";
import PageLoadingSpinner from "~/common/components/loadingspinner/PageLoadingSpinner";
import type { Route } from "./+types/FogdhistorikkPage";
import FogdhistorikkTabell from "./components/FogdhistorikkTabell";

export default function FogdhistorikkPage({ params }: Route.ComponentProps) {
    const { saksnummer } = params;
    const tabTitle = `Fogdhistorikk - ${saksnummer}`;
    const {
        data: fogdhistorikk,
        error: fogdhistorikkError,
        isLoading: fogdhistorikkLoading,
    } = useHentFogdhistorikk(saksnummer);

    if (fogdhistorikkLoading) {
        return <PageLoadingSpinner />;
    }

    if (fogdhistorikkError) {
        return (
            <Box margin={"space-16"}>
                <LocalAlert status="error">
                    <LocalAlert.Header>
                        <LocalAlert.Title>
                            {fogdhistorikkError.message}
                        </LocalAlert.Title>
                    </LocalAlert.Header>
                </LocalAlert>
            </Box>
        );
    }

    const eierenhet =
        fogdhistorikk?.filter((historikk) => historikk.type === "EIER") ?? [];
    const midlertidige =
        fogdhistorikk?.filter((historikk) => historikk.type === "MIDL") ?? [];

    return (
        <VStack gap={"space-64"}>
            <title>{tabTitle}</title>
            <Heading size={"large"}>Fogdhistorikk</Heading>
            <FogdhistorikkTabell tittel="Eierenhet" historikk={eierenhet} />
            <FogdhistorikkTabell
                tittel="Midlertidig autorisasjon"
                historikk={midlertidige}
            />
        </VStack>
    );
}
