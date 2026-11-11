import { Box, Heading, Link, LocalAlert, VStack } from "@navikt/ds-react";
import { ClientOnly } from "~/common/ClientOnly.tsx";
import { useBidragLenker } from "~/common/navigation/useBidragLenker.ts";
import { OppgaveSeksjon } from "~/common/oppgave/OppgaveSeksjon.tsx";
import type { SakSideTittelHandle } from "~/routes/sak/sakSideTittel.tsx";
import type { Route } from "./+types/SakOversiktPage";

export const handle: SakSideTittelHandle = { sakSideTittel: "Saksoversikt" };

export default function SakOversiktPage({ params }: Route.ComponentProps) {
    const saksnummer = params.saksnummer;

    return (
        <VStack gap={"space-48"}>
            <title>Sak {saksnummer}</title>
            <Heading size={"medium"} level={"1"}>
                Sak {saksnummer}
            </Heading>
            <LocalAlert status={"announcement"}>
                <LocalAlert.Header>
                    <LocalAlert.Title>Under arbeid</LocalAlert.Title>
                </LocalAlert.Header>
                <LocalAlert.Content>
                    Saksoversikten er under utvikling.{" "}
                    <ClientOnly>
                        <BisysSakLenke saksnummer={saksnummer} />
                    </ClientOnly>
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

function BisysSakLenke({ saksnummer }: { saksnummer: string }) {
    const lenke = useBidragLenker().bisysSakLenke(saksnummer);
    return lenke ? <Link href={lenke.href}>Åpne saken i Bisys</Link> : null;
}
