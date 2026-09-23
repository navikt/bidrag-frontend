import { MaskerSensitivInfo } from "@bidrag/common";
import { PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Button, HStack } from "@navikt/ds-react";

type Props = {
    visningsnavn: string;
    onFjern: () => void;
};

export default function ValgtMotpart({ visningsnavn, onFjern }: Props) {
    return (
        <Box asChild background="success-moderate" borderWidth="1" borderColor="success-strong" borderRadius="8">
            <HStack align="center" justify="space-between" marginBlock="space-16 space-0" padding="space-12">
                <HStack asChild align="center" gap="space-12">
                    <MaskerSensitivInfo>
                        <PersonIcon fontSize="1.5rem" aria-hidden />
                        <BodyLong size="small" weight="semibold">
                            Motpart: {visningsnavn}
                        </BodyLong>
                    </MaskerSensitivInfo>
                </HStack>
                <Button
                    type="button"
                    size="xsmall"
                    variant="secondary"
                    onClick={onFjern}
                    aria-label={`Fjern motpart ${visningsnavn}`}
                    icon={<XMarkIcon aria-hidden />}
                />
            </HStack>
        </Box>
    );
}
