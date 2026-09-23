import { IdentUtils } from "@bidrag/common";
import { PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Box, Button, HStack, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

import { useHentSamhandler } from "~/api/useApi.ts";
import type { Diskresjonskode } from "../sakvisning-schema.ts";
import DiskresjonAlert from "./DiskresjonAlert.tsx";
import PersonInfo from "./PersonInfo.tsx";

type Props = {
    navn: string;
    disabled?: boolean;
    label?: string;
    ident?: string;
    fjern?: () => void;
    variant?: "info" | "warning";
    diskresjonskode?: Diskresjonskode;
};

type InnholdProps = Pick<Props, "label" | "navn" | "ident" | "diskresjonskode">;

export function FunnetPersonInnhold({ label, navn, ident, diskresjonskode }: InnholdProps) {
    const erSamhandlerIdent = ident ? IdentUtils.isSamhandlerId(ident) : false;
    const { data } = useHentSamhandler(ident ?? "", erSamhandlerIdent);
    const samhandlerManglerKontonummer =
        erSamhandlerIdent && data && !data.kontonummer?.norskKontonummer && !data.kontonummer?.iban;

    return (
        <VStack gap="space-4">
            {label && (
                <BodyShort size="small" weight="semibold">
                    {label}
                </BodyShort>
            )}
            <PersonInfo ident={ident ?? ""} navn={navn} />
            {diskresjonskode && <DiskresjonAlert diskresjonskode={diskresjonskode} />}
            {samhandlerManglerKontonummer && (
                <Alert inline size="small" variant="warning">
                    Samhandler mangler norsk kontonummer eller IBAN
                </Alert>
            )}
        </VStack>
    );
}

export default function FunnetPersonInfo({ disabled, fjern, variant = "info", ...innholdProps }: Props): ReactNode {
    return (
        <Box
            background={variant === "warning" ? "warning-soft" : "info-soft"}
            borderColor={variant === "warning" ? "warning" : "info"}
            borderWidth="1"
            borderRadius="8"
            padding="space-12"
        >
            <HStack gap="space-12" align="start" justify="space-between" wrap={false}>
                <HStack gap="space-12" align="start" minWidth="0" wrap={false}>
                    <PersonIcon
                        fontSize="1.5rem"
                        aria-hidden
                        className={variant === "warning" ? "text-ax-warning-700" : "text-ax-accent-700"}
                    />
                    <FunnetPersonInnhold {...innholdProps} />
                </HStack>
                {fjern && !disabled && (
                    <Button
                        type="button"
                        variant="tertiary"
                        size="xsmall"
                        icon={<XMarkIcon aria-hidden />}
                        onClick={fjern}
                    >
                        Fjern
                    </Button>
                )}
            </HStack>
        </Box>
    );
}
