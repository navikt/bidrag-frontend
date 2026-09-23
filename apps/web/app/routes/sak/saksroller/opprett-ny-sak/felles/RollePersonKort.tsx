import { MaskerSensitivInfo } from "@bidrag/common";
import { PersonIcon } from "@navikt/aksel-icons";
import { BodyLong, HGrid, HStack, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

import DiskresjonAlert from "../../components/DiskresjonAlert";
import PersonInfo from "../../components/PersonInfo";
import type { Diskresjonskode, ForelderPartRolle } from "../opprett-sak-schema";
import { hentForelderRolleLabel } from "../utils";
import { SkjemaSeksjonKort } from "./SkjemaSeksjon";

export type RollePerson = {
    rolle?: ForelderPartRolle;
    ident?: string;
    navn?: string;
    fødselsdato?: string;
    erKjent?: boolean;
    diskresjonskode?: Diskresjonskode;
};

export function RollePersonGrid({
    personer,
    skjulManglende = false,
    handlinger,
}: {
    personer: Array<RollePerson | null>;
    skjulManglende?: boolean;
    handlinger?: Partial<Record<ForelderPartRolle, ReactNode>>;
}) {
    const synligePersoner = skjulManglende ? personer.filter((person) => person !== null) : personer;

    return (
        <HGrid columns={{ xs: 1, md: 2 }} gap="space-16" align="start">
            {synligePersoner.map((person, index) => (
                <RollePersonKort
                    key={person?.rolle ?? index}
                    person={person}
                    førInnhold={person?.rolle ? handlinger?.[person.rolle] : undefined}
                />
            ))}
        </HGrid>
    );
}

export function RollePersonKort({
    person,
    tittel,
    førInnhold,
    children,
}: {
    person: RollePerson | null;
    tittel?: string;
    førInnhold?: ReactNode;
    children?: ReactNode;
}) {
    if (!person) {
        return <SkjemaSeksjonKort />;
    }

    const erUkjent = person.erKjent === false || !person.ident || !person.navn;

    return (
        <SkjemaSeksjonKort variant={erUkjent ? "warning" : "default"}>
            <VStack gap="space-12">
                <HStack align="center" gap="space-8">
                    <PersonIcon aria-hidden fontSize="1.5rem" />
                    <BodyLong size="small" weight="semibold">
                        {tittel ?? (person.rolle ? hentForelderRolleLabel(person.rolle) : "Person")}
                    </BodyLong>
                </HStack>
                {førInnhold}
                <MaskerSensitivInfo>
                    {erUkjent ? (
                        <BodyLong size="small" textColor="subtle" className="italic">
                            Ukjent
                        </BodyLong>
                    ) : (
                        <VStack gap="space-4">
                            <PersonInfo
                                ident={person.ident ?? ""}
                                navn={person.navn}
                                fødselsdato={person.fødselsdato}
                                visKopieringsknapp={false}
                            />
                            {person.diskresjonskode && <DiskresjonAlert diskresjonskode={person.diskresjonskode} />}
                        </VStack>
                    )}
                </MaskerSensitivInfo>
                {children}
            </VStack>
        </SkjemaSeksjonKort>
    );
}
