import { InlineMessage, VStack } from "@navikt/ds-react";
import { useSaksrolleroversikt } from "../skjema/saksrolleroversiktContext";
import EnhetInfoAlert from "./EnhetInfoAlert";
import KanIkkeOppretteSakAlert from "./KanIkkeOppretteSakAlert";
import type { OppsummeringParter } from "./Oppsummering";
import SubmitButtons from "./SubmitButtons";

export interface EnhetOgSubmitSectionProps {
    enhet: string | null;
    enhetNavn: string | null;
    isLoadingEnhet: boolean;
    enhetError: Error | null;
    blocked: boolean;
    isLoading?: boolean;
    submitError: Error | null;
    saksnummer: string | null;
    manglerTilgangUtenBm?: boolean;
    oppsummering?: OppsummeringParter;
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
    blocked,
    isLoading,
    submitError,
    saksnummer,
    manglerTilgangUtenBm = false,
}: EnhetOgSubmitSectionProps) {
    const eierfogd = useSaksrolleroversikt().inngang?.eierfogd;
    const avvikerFraEierfogd = !isLoadingEnhet && !!enhet && !!eierfogd && enhet !== eierfogd;

    return (
        <VStack gap="space-12">
            {manglerTilgangUtenBm && <KanIkkeOppretteSakAlert />}
            <EnhetInfoAlert enhet={enhet} enhetNavn={enhetNavn} isLoading={isLoadingEnhet} error={enhetError} />
            {avvikerFraEierfogd && (
                <InlineMessage status="warning" size="small">
                    Arbeidsfordelingen gir en annen enhet enn {eierfogd}. Saken sendes til enheten over.
                </InlineMessage>
            )}

            <SubmitButtons blocked={blocked} isLoading={isLoading} error={submitError} saksnummer={saksnummer} />
        </VStack>
    );
}
