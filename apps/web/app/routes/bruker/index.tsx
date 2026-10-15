import { PersonNavn } from "@bidrag/common";
import { Heading, Link, LocalAlert, VStack } from "@navikt/ds-react";
import { ClientOnly } from "~/common/ClientOnly.tsx";
import { useBidragLenker } from "~/common/navigation/useBidragLenker.ts";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";
import type { Route } from "./+types/index";

export default function BrukerIndex({ params }: Pick<Route.ComponentProps, "params">) {
    const { decodeFnr } = useObfuscateFnr();
    const brukerId = params.brukerid;
    const fnr = decodeFnr(brukerId);

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
        </VStack>
    );
}

function BisysBrukerLenke({ brukerId }: { brukerId: string }) {
    const lenke = useBidragLenker().bisysBrukerLenke(brukerId);
    return lenke ? <Link href={lenke.href}>Åpne brukeroversikten i Bisys</Link> : null;
}
