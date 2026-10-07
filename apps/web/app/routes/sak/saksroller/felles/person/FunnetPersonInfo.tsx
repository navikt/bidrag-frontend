import { IdentUtils } from "@bidrag/common";
import { PersonIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, HStack, InlineMessage, VStack } from "@navikt/ds-react";

import { useHentSamhandler } from "~/api/useApi.ts";
import PersonInfo from "./PersonInfo.tsx";

type Props = {
    navn: string;
    ident: string;
};

export function FunnetPersonInnhold({ label, navn, ident }: { label?: string; navn: string; ident?: string }) {
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
            {samhandlerManglerKontonummer && (
                <InlineMessage status="warning" size="small">
                    Samhandler mangler norsk kontonummer eller IBAN
                </InlineMessage>
            )}
        </VStack>
    );
}

export default function FunnetPersonInfo({ navn, ident }: Props) {
    return (
        <Box background="info-soft" borderColor="info" borderWidth="1" borderRadius="8" padding="space-12">
            <HStack gap="space-12" align="start" minWidth="0" wrap={false}>
                <PersonIcon fontSize="1.5rem" aria-hidden className="text-ax-accent-700" />
                <FunnetPersonInnhold label="Reell mottaker:" navn={navn} ident={ident} />
            </HStack>
        </Box>
    );
}
