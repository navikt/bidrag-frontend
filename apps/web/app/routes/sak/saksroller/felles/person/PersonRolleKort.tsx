import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, HStack, InlineMessage, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import type { ISamhandlerPersonInfo } from "~/api/types/person.ts";
import type { RolleType } from "../sakvisning-schema";
import DiskresjonAlert from "./DiskresjonAlert";
import PersonInfo from "./PersonInfo";

/**
 * Varsler om at personen har fått nytt fødselsnummer når søkt ident avviker fra funnet ident.
 * Bare fødselsnummeret sladdes med Ctrl+ø. Rendrer ingenting når identene er like.
 */
export function NyttFødselsnummerMelding({ ident, søktIdent }: Pick<ISamhandlerPersonInfo, "ident" | "søktIdent">) {
    if (!ident || !søktIdent || ident === søktIdent) {
        return null;
    }

    return (
        <InlineMessage status="info" size="small" role="status">
            Personen har fått nytt fødselsnummer. Søkte på <span className="personident">{søktIdent}</span>, bruker
            nyeste fødselsnummer <span className="personident">{ident}</span>.
        </InlineMessage>
    );
}

type InnholdProps = {
    person: PersonDto | null;
    ukjentTekst?: string;
    rolle?: RolleType;
    alder?: number;
    stønad18År?: boolean;
    visModiaLenke?: boolean;
    visKopieringsknapp?: boolean;
    visIkon?: boolean;
    tags?: ReactNode;
    headingActions?: ReactNode;
    søktIdent?: string;
    children?: ReactNode;
};

type Props = InnholdProps & {
    actions?: ReactNode;
};

export function KortRamme({ children }: { children: ReactNode }) {
    return (
        <Box background="raised" borderColor="neutral-subtleA" borderWidth="1" borderRadius="12" padding="space-16">
            {children}
        </Box>
    );
}

export function PersonRolleKortInnhold({
    person,
    ukjentTekst = "Ukjent",
    rolle,
    alder,
    stønad18År,
    visModiaLenke,
    visKopieringsknapp = true,
    visIkon = true,
    tags,
    headingActions,
    søktIdent,
    children,
}: InnholdProps) {
    const innhold = (
        <VStack gap="space-0" flexGrow="1" minWidth="0">
            {person ? (
                <PersonInfo
                    ident={person.ident}
                    fødselsdato={person.fødselsdato ?? undefined}
                    navn={person.visningsnavn}
                    alder={alder}
                    rolle={rolle}
                    stønad18År={stønad18År}
                    tags={tags}
                    headingActions={headingActions}
                    visModiaLenke={visModiaLenke}
                    visKopieringsknapp={visKopieringsknapp}
                    compact
                >
                    {person.diskresjonskode && <DiskresjonAlert diskresjonskode={person.diskresjonskode} />}
                    <NyttFødselsnummerMelding ident={person.ident} søktIdent={søktIdent} />
                    {children}
                </PersonInfo>
            ) : (
                <HStack gap="space-8" align="center">
                    <BodyLong size="small" textColor="subtle" className="italic">
                        {ukjentTekst}
                    </BodyLong>
                    {tags}
                    {headingActions}
                </HStack>
            )}
        </VStack>
    );

    return (
        <HStack gap="space-4" align="center" justify="space-between" width="100%">
            <HStack gap="space-4" align="center" flexGrow="1" minWidth="0">
                {visIkon && (
                    <Box padding="space-8" borderRadius="full" background="neutral-moderate">
                        <PersonIcon aria-hidden fontSize="1.25rem" className="text-ax-neutral-700" />
                    </Box>
                )}
                {innhold}
            </HStack>
        </HStack>
    );
}

export default function PersonRolleKort({ actions, ...innholdProps }: Props) {
    return (
        <KortRamme>
            <VStack gap="space-8">
                <PersonRolleKortInnhold {...innholdProps} />
                {actions && (
                    <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" paddingBlock="space-8 space-0">
                        {actions}
                    </Box>
                )}
            </VStack>
        </KortRamme>
    );
}
