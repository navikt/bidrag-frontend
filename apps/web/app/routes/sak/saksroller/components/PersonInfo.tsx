import { IdentUtils, ModiaLink, PersonIdent, PersonNavnIdent, RolleTag, type RolleType } from "@bidrag/common";
import { beregnAlder } from "@bidrag/utils";
import { BodyShort, Box, HStack, Link, Loader, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { useHentPersonData, useHentSamhandler } from "~/api/useApi.ts";
import type { RolleType as SaksrolleType } from "../sakvisning-schema.ts";

type Props = {
    navn?: string;
    ident: string;
    fødselsdato?: string;
    alder?: number;
    rolle?: SaksrolleType;
    stønad18År?: boolean;
    tags?: ReactNode;
    headingActions?: ReactNode;
    visModiaLenke?: boolean;
    visKopieringsknapp?: boolean;
    children?: ReactNode;
};

function PersonInfoContent({
    navn,
    ident,
    fødselsdato,
    alder,
    rolle,
    stønad18År,
    tags,
    headingActions,
    visModiaLenke,
    visKopieringsknapp = true,
    children,
}: Props) {
    const { data } = useHentPersonData(ident);
    const erSamhandlerIdent = IdentUtils.isSamhandlerId(ident);
    const { data: samhandlerData } = useHentSamhandler(ident, erSamhandlerIdent);
    const fødselsdatoPerson = fødselsdato ?? data?.fødselsdato;
    const personAlder = alder ?? (fødselsdatoPerson ? beregnAlder(fødselsdatoPerson) : undefined);

    return (
        <HStack gap="space-8" align="start" wrap={false}>
            {rolle && <RolleTag rolleType={rolle as RolleType} ident={ident} stønad18År={stønad18År} />}

            <VStack minWidth="0" flexGrow="1">
                <HStack gap="space-8" align="center">
                    {!erSamhandlerIdent && (
                        <Box asChild minWidth="0">
                            <BodyShort
                                size="small"
                                weight="semibold"
                                truncate
                                className="personnavn"
                                title={data?.visningsnavn ?? navn}
                            >
                                {data?.visningsnavn ?? navn}
                            </BodyShort>
                        </Box>
                    )}
                    {visModiaLenke && !erSamhandlerIdent && <ModiaLink ident={ident} />}
                    {tags}
                    {headingActions}
                </HStack>

                <HStack asChild align="center">
                    <BodyShort textColor="subtle" size="small">
                        {erSamhandlerIdent ? (
                            <HStack gap="space-1">
                                <BodyShort size="small" className="personnavn">
                                    {navn ?? samhandlerData?.navn}
                                </BodyShort>
                                <Link href={`/samhandler/${ident}`} target="_blank" rel="noopener noreferrer">
                                    <PersonIdent ident={ident} />
                                </Link>
                            </HStack>
                        ) : (
                            <PersonNavnIdent variant="ident" showCopyButton={visKopieringsknapp} ident={ident} />
                        )}

                        {personAlder !== undefined && ` (${personAlder} år)`}
                    </BodyShort>
                </HStack>

                {children}
            </VStack>
        </HStack>
    );
}

export default function PersonInfo(props: Props) {
    return (
        <Suspense fallback={<Loader size="xsmall" />}>
            <PersonInfoContent {...props} />
        </Suspense>
    );
}
