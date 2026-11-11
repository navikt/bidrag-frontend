import { PersonNavn } from "@bidrag/common";
import { Box, Heading, Link, Loader, LocalAlert, VStack } from "@navikt/ds-react";
import { useHentPersoninformasjon } from "~/api/useApi.ts";
import { ClientOnly } from "~/common/ClientOnly.tsx";
import { useBidragLenker } from "~/common/navigation/useBidragLenker.ts";
import { OppgaveSeksjon } from "~/common/oppgave/OppgaveSeksjon.tsx";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";
import type { Route } from "./+types/BrukerOversikt";

export default function BrukerOversikt({ params }: Route.ComponentProps) {
    const { decodeFnr } = useObfuscateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId);
    const { data: bruker } = useHentPersoninformasjon({ ident: fnr });

    return (
        <VStack gap={"space-48"}>
            <title>Brukeroversikt</title>
            <Heading size={"medium"}>
                Brukeroversikt for <PersonNavn ident={fnr} />
            </Heading>
            <LocalAlert status={"announcement"}>
                <LocalAlert.Header>
                    <LocalAlert.Title>Under arbeid</LocalAlert.Title>
                </LocalAlert.Header>
                <LocalAlert.Content>
                    Brukeroversikten er under utvikling.{" "}
                    <ClientOnly>
                        <BisysBrukerLenke brukerId={brukerId} />
                    </ClientOnly>
                </LocalAlert.Content>
            </LocalAlert>

            <Box borderColor="neutral-subtle" padding="space-16" borderWidth="1" borderRadius="4">
                <VStack gap="space-16">
                    <Heading size={"small"}>Oppgaver</Heading>
                    {!bruker ? (
                        <Loader />
                    ) : bruker.aktørId ? (
                        <OppgaveSeksjon søk={{ aktoerId: bruker.aktørId }} />
                    ) : (
                        <p>Ingen oppgaver</p>
                    )}
                </VStack>
            </Box>
        </VStack>
    );
}

function BisysBrukerLenke({ brukerId }: { brukerId: string }) {
    const lenke = useBidragLenker().bisysBrukerLenke(brukerId);
    return lenke ? <Link href={lenke.href}>Åpne brukeroversikten i Bisys</Link> : null;
}
