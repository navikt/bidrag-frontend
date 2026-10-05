import { Box, Heading, Loader, LocalAlert, VStack } from "@navikt/ds-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useFlag } from "@unleash/proxy-client-react";
import { Suspense } from "react";
import { finnOppgaver } from "~/api/query/oppgave.query.ts";
import { OppgaveTabell } from "~/common/oppgave/OppgaveTabell.tsx";
import type { Route } from "./+types/SakOversiktPage";

export default function SakOversiktPage({ params }: Route.ComponentProps) {
    const saksnummer = params.saksnummer;
    const oppgaveEnabledFlag = useFlag("frontend.oppgaver");

    const { data: oppgaver } = useSuspenseQuery(finnOppgaver({ saksnummer: saksnummer }, oppgaveEnabledFlag));

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
                    <Suspense fallback={<Loader />}>
                        <OppgaveTabell oppgaver={oppgaver ?? []} />
                    </Suspense>
                </VStack>
            </Box>
        </VStack>
    );
}
