import { PersonIdent } from "@bidrag/common";
import { BodyShort, CopyButton, HStack, Link, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

import { SamhandlerKontonummerMelding } from "./FunnetPersonInfo.tsx";

type Props = {
    navn: string;
    ident: string;
    tags?: ReactNode;
};

/** Samhandler med samme oppsett som PersonInfo: navn øverst, ident med lenke og kopiknapp under. */
export default function SamhandlerInfo({ navn, ident, tags }: Props) {
    return (
        <VStack gap="space-4" minWidth="0">
            <VStack gap="space-1" minWidth="0">
                <HStack gap="space-4" align="center">
                    <BodyShort size="small" weight="semibold" truncate title={navn}>
                        {navn}
                    </BodyShort>
                    {tags}
                </HStack>
                <HStack asChild align="center">
                    <BodyShort as="div" textColor="subtle" size="small">
                        <Link href={`/samhandler/${ident}`} target="_blank" rel="noopener noreferrer">
                            <PersonIdent ident={ident} />
                        </Link>
                        <CopyButton copyText={ident} size="small" />
                    </BodyShort>
                </HStack>
            </VStack>
            <SamhandlerKontonummerMelding ident={ident} />
        </VStack>
    );
}
