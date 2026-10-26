import { InlineMessage, LocalAlert } from "@navikt/ds-react";

/** Status for oppslaget av relasjonen mellom barna og foreldrene, `undefined` når kontrollen er ferdig. */
export type Relasjonskontroll = "venter" | "feilet" | undefined;

/** Lagring og opprettelse stopper så lenge relasjonen ikke er kontrollert. */
export function relasjonskontrollStatus({ isError, isLoading }: { isError: boolean; isLoading: boolean }) {
    if (isError) return "feilet" as const;
    if (isLoading) return "venter" as const;
    return undefined;
}

export default function Relasjonskontrollmelding({ relasjonskontroll }: { relasjonskontroll: Relasjonskontroll }) {
    if (relasjonskontroll === "venter") {
        return <InlineMessage status="info">Kontrollerer relasjonen mellom barna og foreldrene.</InlineMessage>;
    }
    if (relasjonskontroll === "feilet") {
        return (
            <LocalAlert status="error">
                <LocalAlert.Header>
                    <LocalAlert.Title>
                        Kunne ikke kontrollere relasjonen mellom barna og foreldrene. Oppdater siden og prøv igjen.
                    </LocalAlert.Title>
                </LocalAlert.Header>
            </LocalAlert>
        );
    }
    return null;
}
