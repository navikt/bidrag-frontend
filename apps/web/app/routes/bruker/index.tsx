import { PersonNavn } from "@bidrag/common";
import {Alert, Heading, LocalAlert, VStack} from "@navikt/ds-react";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";
import type { Route } from "./+types/index";

export default function BrukerIndex({ params }: Route.ComponentProps) {
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
                    <LocalAlert.Title>
                       Under konstruksjon
                    </LocalAlert.Title>
                </LocalAlert.Header>
                <LocalAlert.Content>
                    Denne siden er under utvikling og vil bli ferdigstilt i fremtidige versjoner. Funksjonalitet kan være begrenset eller utilgjengelig.
                </LocalAlert.Content>
            </LocalAlert>
        </VStack>
    );
}
