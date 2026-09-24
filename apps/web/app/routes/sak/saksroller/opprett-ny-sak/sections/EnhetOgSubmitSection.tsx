import { VStack } from "@navikt/ds-react";

import EnhetInfoAlert from "../components/EnhetInfoAlert";
import SubmitButtons from "../components/SubmitButtons";

export interface EnhetOgSubmitSectionProps {
    enhet: string | null;
    enhetNavn: string | null;
    isLoadingEnhet: boolean;
    enhetError: Error | null;
    blocked: boolean;
    isLoading?: boolean;
    submitError: Error | null;
    saksnummer: string | null;
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
}: EnhetOgSubmitSectionProps) {
    return (
        <VStack gap="space-12">
            <EnhetInfoAlert enhet={enhet} enhetNavn={enhetNavn} isLoading={isLoadingEnhet} error={enhetError} />

            <SubmitButtons blocked={blocked} isLoading={isLoading} error={submitError} saksnummer={saksnummer} />
        </VStack>
    );
}
