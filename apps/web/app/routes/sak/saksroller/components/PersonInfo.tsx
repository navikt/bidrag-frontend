import { IdentUtils, ModiaLink, PersonIdent, PersonNavnIdent, RolleTag, type RolleType } from "@bidrag/common";
import { beregnAlder } from "@bidrag/utils";
import { BodyShort, HStack, Link, Loader, VStack } from "@navikt/ds-react";
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
                        <BodyShort
                            size="small"
                            weight="semibold"
                            className="personnavn min-w-0 truncate"
                            title={data?.visningsnavn ?? navn}
                        >
                            {data?.visningsnavn ?? navn}
                        </BodyShort>
                    )}
                    {visModiaLenke && !erSamhandlerIdent && <ModiaLink ident={ident} />}
                    {tags}
                    {headingActions}
                </HStack>

                <BodyShort textColor="subtle" className="flex items-center" size="small">
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
                        <PersonNavnIdent variant="ident" showCopyButton={true} ident={ident} />
                    )}

                    {personAlder !== undefined && ` (${personAlder} år)`}
                </BodyShort>

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
