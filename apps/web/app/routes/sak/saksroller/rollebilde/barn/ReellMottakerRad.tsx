import { RolleTag, RolleTypeAbbreviation } from "@bidrag/common";
import { PencilIcon, PlusIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Button, HStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

type Props = {
    harReellMottaker: boolean;
    reellMottakerInfo: ReactNode;
    onEndre: () => void;
    onLeggTil: () => void;
};

/** Kollapset "vis reell mottaker + rediger via blyant"-rad, delt mellom rediger-sak og opprett-ny-sak. */
export default function ReellMottakerRad({ harReellMottaker, reellMottakerInfo, onEndre, onLeggTil }: Props) {
    return (
        <Box marginBlock="space-8 space-0">
            {harReellMottaker ? (
                <>
                    <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" />
                    <HStack gap="space-12" align="center" justify="space-between" paddingBlock="space-8">
                        <HStack gap="space-8" align="center" minWidth="0">
                            <RolleTag rolleType={RolleTypeAbbreviation.RM} />
                            <BodyLong size="small" textColor="subtle" truncate>
                                {reellMottakerInfo}
                            </BodyLong>
                        </HStack>
                        <Button
                            variant="tertiary"
                            size="xsmall"
                            type="button"
                            icon={<PencilIcon aria-hidden />}
                            aria-label="Endre reell mottaker"
                            onClick={onEndre}
                        />
                    </HStack>
                    <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" />
                </>
            ) : (
                <Button
                    variant="tertiary"
                    size="small"
                    type="button"
                    icon={<PlusIcon aria-hidden />}
                    onClick={onLeggTil}
                >
                    Legg til reell mottaker
                </Button>
            )}
        </Box>
    );
}
