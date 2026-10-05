import { IdentUtils } from "@bidrag/common";
import { BodyShort, Box, HStack, InlineMessage, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

import { useHentSamhandler } from "../../api/samhandler.api";
import PersonInfo from "./PersonInfo.tsx";
import { KortRamme } from "./PersonRolleKort.tsx";

type Props = {
    navn: string;
    ident: string;
    handlinger?: ReactNode;
};

export function FunnetPersonInnhold({ label, navn, ident }: { label?: string; navn: string; ident?: string }) {
    return (
        <VStack gap="space-4">
            {label && (
                <BodyShort size="small" weight="semibold">
                    {label}
                </BodyShort>
            )}
            <PersonInfo ident={ident ?? ""} navn={navn} />
            <SamhandlerKontonummerMelding ident={ident} />
        </VStack>
    );
}

function SamhandlerKontonummerMelding({ ident }: { ident?: string }) {
    const erSamhandlerIdent = ident ? IdentUtils.isSamhandlerId(ident) : false;
    const { data } = useHentSamhandler(ident ?? "", erSamhandlerIdent);
    const manglerKontonummer =
        erSamhandlerIdent && data && !data.kontonummer?.norskKontonummer && !data.kontonummer?.iban;

    if (!manglerKontonummer) return null;

    return (
        <InlineMessage status="warning" size="small">
            Samhandler mangler norsk kontonummer eller IBAN
        </InlineMessage>
    );
}

export default function FunnetPersonInfo({ navn, ident, handlinger }: Props) {
    return (
        <KortRamme background="info-soft" borderColor="info">
            <HStack gap="space-8" align="start" justify="space-between" wrap={false}>
                <Box flexGrow="1" minWidth="0">
                    <PersonInfo truncate navn={navn} ident={ident} rolle="RM" visModiaLenke>
                        <SamhandlerKontonummerMelding ident={ident} />
                    </PersonInfo>
                </Box>
                {handlinger && <Box flexShrink="0">{handlinger}</Box>}
            </HStack>
        </KortRamme>
    );
}
