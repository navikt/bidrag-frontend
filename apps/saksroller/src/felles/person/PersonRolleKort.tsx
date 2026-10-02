import type { PersonDto } from "@bidrag/api/PersonApi";
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
    tags,
    headingActions,
    søktIdent,
    children,
}: InnholdProps) {
    return (
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
                    visModiaLenke
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
