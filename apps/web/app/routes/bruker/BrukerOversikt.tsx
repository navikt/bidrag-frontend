import { PersonNavn } from "@bidrag/common";
import { Box, Heading, Loader, LocalAlert, VStack } from "@navikt/ds-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { finnOppgaver } from "~/api/query/oppgave.query.ts";
import { useHentPersoninformasjon } from "~/api/useApi.ts";
import { OppgaveTabell } from "~/common/oppgave/OppgaveTabell.tsx";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";
import type { Route } from "./+types/BrukerOversikt";

export default function BrukerOversikt({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId);
    const { data: bruker } = useHentPersoninformasjon({ ident: fnr });

    const { data: oppgaver } = useSuspenseQuery(finnOppgaver({ aktoerId: bruker?.aktørId }));

    return (
        <VStack gap={"space-48"}>
            <title>Brukeroversikt</title>
            <Heading size={"medium"}>
                Brukeroversikt for <PersonNavn ident={fnr} />
            </Heading>
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
                    <Heading size={"medium"}>Oppgaver</Heading>
                    <Suspense fallback={<Loader />}>
                        <OppgaveTabell oppgaver={oppgaver ?? []} />
                    </Suspense>
                </VStack>
            </Box>
        </VStack>
    );
}
