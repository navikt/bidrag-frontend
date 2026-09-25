import { IdentUtils, ModiaLink, PersonIdent, PersonNavnIdent, RolleTag, type RolleType } from "@bidrag/common";
import { beregnAlder } from "@bidrag/utils";
import { BodyShort, Box, CopyButton, HStack, Link, Skeleton, VStack } from "@navikt/ds-react";
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
    compact?: boolean;
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
    compact = false,
    children,
}: Props) {
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
        children,
    };

    return compact ? <CompactPersonInfo {...commonProps} /> : <StandardPersonInfo {...commonProps} />;
}

type PersonInfoContentProps = Omit<Props, "fødselsdato" | "alder" | "compact" | "fallback"> & {
    personAlder?: number;
    erSamhandlerIdent: boolean;
    samhandlerNavn?: string;
    visningsnavn?: string;
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
    compact,
}: Pick<PersonInfoContentProps, "ident" | "navn" | "samhandlerNavn"> & { compact?: boolean }) {
    return (
        <HStack gap="space-1">
            <BodyShort size="small" className={compact ? undefined : "personnavn"}>
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
    compact = false,
}: Pick<
    PersonInfoContentProps,
    "ident" | "navn" | "samhandlerNavn" | "erSamhandlerIdent" | "personAlder" | "visKopieringsknapp"
> & { compact?: boolean }) {
    return (
        <HStack asChild align="center">
            <BodyShort textColor="subtle" size="small">
                {erSamhandlerIdent ? (
                    <SamhandlerIdent ident={ident} navn={navn} samhandlerNavn={samhandlerNavn} compact={compact} />
                ) : (
                    <PersonNavnIdent
                        variant="ident"
                        ident={ident}
                        {...(!compact && { showCopyButton: visKopieringsknapp })}
                    />
                )}
                {personAlder !== undefined && ` (${personAlder} år)`}
            </BodyShort>
        </HStack>
    );
}

function StandardPersonInfo(props: PersonInfoContentProps) {
    const { ident, navn, visningsnavn, erSamhandlerIdent, visModiaLenke, tags, headingActions, children } = props;
    return (
        <HStack gap="space-8" align="start" wrap={false}>
            <RolleTagForPerson {...props} />
            <VStack minWidth="0" flexGrow="1">
                <HStack gap="space-8" align="center">
                    {!erSamhandlerIdent && (
                        <Box asChild minWidth="0">
                            <BodyShort
                                size="small"
                                weight="semibold"
                                truncate
                                className="personnavn"
                                title={visningsnavn ?? navn}
                            >
                                {visningsnavn ?? navn}
                            </BodyShort>
                        </Box>
                    )}
                    {visModiaLenke && !erSamhandlerIdent && <ModiaLink ident={ident} />}
                    {tags}
                    {headingActions}
                </HStack>
                <PersonIdentLine {...props} />
                {children}
            </VStack>
        </HStack>
    );
}

function CompactPersonInfo(props: PersonInfoContentProps) {
    const {
        ident,
        navn,
        visningsnavn,
        erSamhandlerIdent,
        visModiaLenke,
        tags,
        headingActions,
        children,
        visKopieringsknapp,
    } = props;
    return (
        <HStack gap="space-4" align="start" wrap={false}>
            <RolleTagForPerson {...props} />
            <VStack flexGrow="1">
                <HStack justify="space-between">
                    <VStack gap="space-1">
                        <HStack gap="space-4" align="center">
                            {!erSamhandlerIdent && (
                                <Box asChild minWidth="0">
                                    <BodyShort size="small" weight="semibold" title={visningsnavn ?? navn}>
                                        {visningsnavn ?? navn}
                                    </BodyShort>
                                </Box>
                            )}
                            {tags}
                            {headingActions}
                        </HStack>
                        <PersonIdentLine {...props} compact />
                    </VStack>
                    <HStack>
                        {visKopieringsknapp && <CopyButton copyText={ident} size="small" style={{ zIndex: 10000 }} />}
                        {visModiaLenke && !erSamhandlerIdent && <ModiaLink ident={ident} compact />}
                    </HStack>
                </HStack>
                {children}
            </VStack>
        </HStack>
    );
}

export default function PersonInfo({ fallback, ...props }: Props) {
    return (
        <Suspense fallback={fallback ?? <PersonInfoSkeleton compact={props.compact} />}>
            <PersonInfoContent {...props} />
        </Suspense>
    );
}

function PersonInfoSkeleton({ compact = false }: Pick<Props, "compact">) {
    return (
        <VStack gap="space-4" width={compact ? "12rem" : "16rem"} aria-label="Laster personinformasjon">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="100%" />
        </VStack>
    );
}
