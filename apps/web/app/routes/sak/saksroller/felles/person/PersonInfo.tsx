import {
    IdentUtils,
    ModiaLink,
    PersonIdent,
    PersonNavnIdent,
    RolleTag,
    type RolleType,
    useBidragCommons,
} from "@bidrag/common";
import { beregnAlder } from "@bidrag/utils";
import { BodyShort, Box, HStack, Link, Skeleton, VStack } from "@navikt/ds-react";
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
    truncate?: boolean;
    children?: ReactNode;
    fallback?: ReactNode;
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
    truncate = false,
    children,
}: Props) {
    const { erMaskert } = useBidragCommons();
    const { data } = useHentPersonData(ident);
    const erSamhandlerIdent = IdentUtils.isSamhandlerId(ident);
    const { data: samhandlerData } = useHentSamhandler(ident, erSamhandlerIdent);
    const fødselsdatoPerson = fødselsdato ?? data?.fødselsdato;
    const personAlder = alder ?? (fødselsdatoPerson ? beregnAlder(fødselsdatoPerson) : undefined);

    const commonProps = {
        ident,
        navn,
        personAlder,
        rolle,
        stønad18År,
        tags,
        headingActions,
        visModiaLenke,
        visKopieringsknapp,
        erSamhandlerIdent,
        samhandlerNavn: samhandlerData?.navn,
        visningsnavn: data?.visningsnavn,
        erMaskert,
        truncate,
        children,
    };

    return <PersonInfoLayout {...commonProps} />;
}

type PersonInfoContentProps = Omit<Props, "fødselsdato" | "alder" | "fallback"> & {
    personAlder?: number;
    erSamhandlerIdent: boolean;
    samhandlerNavn?: string;
    visningsnavn?: string;
    erMaskert: boolean;
};

function RolleTagForPerson({
    rolle,
    ident,
    stønad18År,
}: Pick<PersonInfoContentProps, "rolle" | "ident" | "stønad18År">) {
    return rolle ? <RolleTag rolleType={rolle as RolleType} ident={ident} stønad18År={stønad18År} /> : null;
}

function SamhandlerIdent({
    ident,
    navn,
    samhandlerNavn,
}: Pick<PersonInfoContentProps, "ident" | "navn" | "samhandlerNavn">) {
    return (
        <HStack gap="space-1">
            <BodyShort size="small" className="personnavn">
                {navn ?? samhandlerNavn}
            </BodyShort>
            <Link href={`/samhandler/${ident}`} target="_blank" rel="noopener noreferrer">
                <PersonIdent ident={ident} />
            </Link>
        </HStack>
    );
}

function PersonIdentLine({
    ident,
    navn,
    samhandlerNavn,
    erSamhandlerIdent,
    personAlder,
    visKopieringsknapp,
}: Pick<
    PersonInfoContentProps,
    "ident" | "navn" | "samhandlerNavn" | "erSamhandlerIdent" | "personAlder" | "visKopieringsknapp"
>) {
    return (
        <HStack asChild align="center">
            <BodyShort textColor="subtle" size="small">
                {erSamhandlerIdent ? (
                    <SamhandlerIdent ident={ident} navn={navn} samhandlerNavn={samhandlerNavn} />
                ) : (
                    <PersonNavnIdent variant="ident" ident={ident} showCopyButton={visKopieringsknapp} />
                )}
                {personAlder !== undefined && ` (${personAlder} år)`}
            </BodyShort>
        </HStack>
    );
}

function PersonInfoLayout(props: PersonInfoContentProps) {
    const {
        ident,
        navn,
        visningsnavn,
        erMaskert,
        erSamhandlerIdent,
        visModiaLenke,
        tags,
        headingActions,
        truncate,
        children,
    } = props;
    return (
        <HStack gap="space-4" align="start" wrap={false}>
            <RolleTagForPerson {...props} />
            <VStack flexGrow="1" minWidth="0">
                <HStack justify="space-between" wrap={false}>
                    <VStack gap="space-1" minWidth="0">
                        <HStack gap="space-4" align="center">
                            {!erSamhandlerIdent && (
                                <Box asChild minWidth="0">
                                    <BodyShort
                                        size="small"
                                        weight="semibold"
                                        truncate={truncate}
                                        className="personnavn"
                                        title={erMaskert ? undefined : (visningsnavn ?? navn)}
                                    >
                                        {visningsnavn ?? navn}
                                    </BodyShort>
                                </Box>
                            )}
                            {tags}
                            {headingActions}
                        </HStack>
                        <PersonIdentLine {...props} />
                    </VStack>
                    {visModiaLenke && !erSamhandlerIdent && <ModiaLink ident={ident} compact />}
                </HStack>
                {children}
            </VStack>
        </HStack>
    );
}

export default function PersonInfo({ fallback, ...props }: Props) {
    return (
        <Suspense fallback={fallback ?? <PersonInfoSkeleton />}>
            <PersonInfoContent {...props} />
        </Suspense>
    );
}

function PersonInfoSkeleton() {
    return (
        <VStack gap="space-4" width="12rem" aria-label="Laster personinformasjon">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="100%" />
        </VStack>
    );
}
