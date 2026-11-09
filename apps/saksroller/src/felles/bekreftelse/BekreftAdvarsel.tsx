import { BodyLong, Checkbox, CheckboxGroup, LocalAlert, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import type { Bekreftelse } from "./useBekreftelse";

const BEKREFTET = "bekreftet";

/** Advarsel saksbehandler må krysse av for før saken kan opprettes eller lagres. */
export default function BekreftAdvarsel({
    tittel,
    children,
    bekreftTekst,
    feilmelding,
    bekreftelse,
}: {
    tittel: string;
    children: ReactNode;
    bekreftTekst: string;
    feilmelding: string;
    bekreftelse: Bekreftelse;
}) {
    if (!bekreftelse.måBekrefte) return null;

    return (
        <LocalAlert status="warning" size="small" as="div">
            <LocalAlert.Header>
                <LocalAlert.Title>{tittel}</LocalAlert.Title>
            </LocalAlert.Header>
            <LocalAlert.Content>
                <VStack gap="space-8">
                    <BodyLong size="small">{children}</BodyLong>
                    <CheckboxGroup
                        legend={tittel}
                        hideLegend
                        size="small"
                        value={bekreftelse.bekreftet ? [BEKREFTET] : []}
                        onChange={(verdier: string[]) => bekreftelse.settBekreftet(verdier.includes(BEKREFTET))}
                        error={bekreftelse.visFeil ? feilmelding : undefined}
                    >
                        <Checkbox value={BEKREFTET}>{bekreftTekst}</Checkbox>
                    </CheckboxGroup>
                </VStack>
            </LocalAlert.Content>
        </LocalAlert>
    );
}
