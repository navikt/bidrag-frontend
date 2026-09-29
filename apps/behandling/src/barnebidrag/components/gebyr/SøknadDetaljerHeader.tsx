import type { SoknadDetaljerDto } from "@bidrag/api/BidragBehandlingApiV1";
import { BodyShort, Box, HStack, Label } from "@navikt/ds-react";
import { SOKNAD_LABELS } from "../../../common/constants/soknadFraLabels";
import text from "../../../common/constants/texts";
import { hentVisningsnavn } from "../../../common/hooks/useVisningsnavn";
import { DateToDDMMYYYYString } from "../../../utils/date-utils";

export const SøknadDetaljerHeader = ({ søknad }: { søknad: SoknadDetaljerDto }) => {
    return (
        <Box background="brand-beige-soft" padding="space-8">
            <HStack gap="space-48" wrap>
                <HStack gap="space-8">
                    <Label size="small">{text.label.søknadfra}:</Label>
                    <BodyShort size="small">{SOKNAD_LABELS[søknad.søktAvType]}</BodyShort>
                </HStack>
                <HStack gap="space-8">
                    <Label size="small">{text.label.mottattdato}:</Label>
                    <BodyShort size="small">{DateToDDMMYYYYString(new Date(søknad.mottattDato))}</BodyShort>
                </HStack>
                <HStack gap="space-8">
                    <Label size="small">{text.label.søktfradato}:</Label>
                    <BodyShort size="small">{DateToDDMMYYYYString(new Date(søknad.søktFomDato))}</BodyShort>
                </HStack>
                {søknad.behandlingstype && (
                    <HStack gap="space-8">
                        <Label size="small">{text.label.søknadstype}:</Label>
                        <BodyShort size="small">{hentVisningsnavn(søknad.behandlingstype)}</BodyShort>
                    </HStack>
                )}
            </HStack>
        </Box>
    );
};
