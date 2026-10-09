import { Box, Heading, LocalAlert, VStack } from "@navikt/ds-react";
import { OppgaveSeksjon } from "~/common/oppgave/OppgaveSeksjon.tsx";
import type { SakSideTittelHandle } from "~/routes/sak/sakSideTittel.tsx";
import type { Route } from "./+types/SakOversiktPage";

export const handle: SakSideTittelHandle = { sakSideTittel: "Saksoversikt" };

export default function SakOversiktPage({ params }: Route.ComponentProps) {
    const saksnummer = params.saksnummer;

    return (
        <VStack gap={"space-48"}>
            <title>Sak {saksnummer}</title>
            <Heading size={"medium"}>Oversikt sak {saksnummer}</Heading>
            <LocalAlert status={"announcement"}>
                <LocalAlert.Header>
                    <LocalAlert.Title>Under konstruksjon</LocalAlert.Title>
                </LocalAlert.Header>
                <LocalAlert.Content>
                    Denne siden er under utvikling og vil bli ferdigstilt i fremtidige versjoner. Funksjonalitet kan
                    være begrenset eller utilgjengelig.
                </LocalAlert.Content>
            </LocalAlert>

            <Box borderColor="neutral-subtle" padding="space-16" borderWidth="1" borderRadius="4">
                <VStack gap="space-16">
                    <Heading size={"small"}>Oppgaver</Heading>
                    <OppgaveSeksjon søk={{ saksnummer }} />
                </VStack>
            </Box>
        </VStack>
    );
}
