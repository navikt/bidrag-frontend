import { VStack } from "@navikt/ds-react";
import BekreftAdvarsel from "../../felles/bekreftelse/BekreftAdvarsel";
import EnhetInfoAlert from "./EnhetInfoAlert";
import KanIkkeOppretteSakAlert from "./KanIkkeOppretteSakAlert";
import SubmitButtons from "./SubmitButtons";
import type { Enhetsvarsel } from "./useFlowSubmission";

export interface EnhetOgSubmitSectionProps {
    enhet: string | null;
    enhetNavn: string | null;
    isLoadingEnhet: boolean;
    enhetError: Error | null;
    enhetsvarsel: Enhetsvarsel;
    blocked: boolean;
    isLoading?: boolean;
    submitError: Error | null;
    saksnummer: string | null;
    harEksisterendeSak?: boolean;
    manglerTilgangUtenBm?: boolean;
}

/**
 * Kombinert seksjon for enhetinformasjon og submit-knapper.
 * Brukes på slutten av alle opprett-sak flow for konsistent visning.
 */
export default function EnhetOgSubmitSection({
    enhet,
    enhetNavn,
    isLoadingEnhet,
    enhetError,
    enhetsvarsel,
    blocked,
    isLoading,
    submitError,
    saksnummer,
    harEksisterendeSak,
    manglerTilgangUtenBm = false,
}: EnhetOgSubmitSectionProps) {
    return (
        <VStack gap="space-12">
            {manglerTilgangUtenBm && <KanIkkeOppretteSakAlert />}
            {enhetsvarsel.bekreftelse.måBekrefte ? (
                <BekreftAdvarsel
                    tittel="Saken sendes til en annen enhet"
                    bekreftTekst={`Jeg har kontrollert at saken skal sendes til ${enhetNavn} (${enhet})`}
                    feilmelding="Du må bekrefte enheten saken sendes til"
                    bekreftelse={enhetsvarsel.bekreftelse}
                >
                    Arbeidsfordelingen sender saken til {enhetNavn} ({enhet})
                    {enhetsvarsel.flyttesFra.length > 0 && `, ikke til ${enhetsvarsel.flyttesFra.join(" eller ")}`}.
                    {enhetsvarsel.erSkjermet && " Enheten er skjermet, og du kan miste tilgang til saken."}
                </BekreftAdvarsel>
            ) : (
                <EnhetInfoAlert enhet={enhet} enhetNavn={enhetNavn} isLoading={isLoadingEnhet} error={enhetError} />
            )}

            <SubmitButtons
                blocked={blocked}
                isLoading={isLoading}
                error={submitError}
                saksnummer={saksnummer}
                harEksisterendeSak={harEksisterendeSak}
            />
        </VStack>
    );
}
