import { PersonNavn } from "@bidrag/common";
import { Alert, Heading, VStack } from "@navikt/ds-react";
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
            <Alert variant={"warning"}>Siden er under konstruksjon</Alert>
        </VStack>
    );
}
