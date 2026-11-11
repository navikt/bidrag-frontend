import { Heading, Link, LocalAlert, VStack } from "@navikt/ds-react";
import { ClientOnly } from "~/common/ClientOnly.tsx";
import { useBidragLenker } from "~/common/navigation/useBidragLenker.ts";
import type { Route } from "./+types/index";

export default function SakIndex({ params }: Pick<Route.ComponentProps, "params">) {
    return (
        <VStack gap={"space-48"}>
            <title>Sak</title>
            <Heading size={"medium"} level={"1"}>
                Sak {params.saksnummer}
            </Heading>
            <LocalAlert status={"announcement"}>
                <LocalAlert.Header>
                    <LocalAlert.Title>Under arbeid</LocalAlert.Title>
                </LocalAlert.Header>
                <LocalAlert.Content>
                    Saksoversikten er under utvikling.{" "}
                    <ClientOnly>
                        <BisysSakLenke saksnummer={params.saksnummer} />
                    </ClientOnly>
                </LocalAlert.Content>
            </LocalAlert>
        </VStack>
    );
}

function BisysSakLenke({ saksnummer }: { saksnummer: string }) {
    const lenke = useBidragLenker().bisysSakLenke(saksnummer);
    return lenke ? <Link href={lenke.href}>Åpne saken i Bisys</Link> : null;
}
