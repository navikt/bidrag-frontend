import { VStack } from "@navikt/ds-react";

import EnhetInfoAlert from "../components/EnhetInfoAlert";
import SubmitButtons from "../components/SubmitButtons";

interface EnhetOgSubmitSectionProps {
    enhet: string | null;
    enhetNavn: string | null;
    isLoadingEnhet: boolean;
    enhetError: Error | null;
    disabled: boolean;
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
    disabled,
    submitError,
    saksnummer,
}: EnhetOgSubmitSectionProps) {
    return (
        <VStack gap="space-6">
            <EnhetInfoAlert enhet={enhet} enhetNavn={enhetNavn} isLoading={isLoadingEnhet} error={enhetError} />

            <SubmitButtons disabled={disabled} error={submitError} saksnummer={saksnummer} />
        </VStack>
    );
}
