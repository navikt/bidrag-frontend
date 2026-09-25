import { MaskerSensitivInfo } from "@bidrag/common";
import { PersonIcon } from "@navikt/aksel-icons";
import { BodyLong, HStack, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

import DiskresjonAlert from "../../felles/person/DiskresjonAlert";
import PersonInfo from "../../felles/person/PersonInfo";
import type { Diskresjonskode, ForelderPartRolle } from "../skjema/opprett-sak-schema";
import { SkjemaSeksjonKort } from "../skjema/SkjemaSeksjon";
import { hentForelderRolleLabel } from "./part-utils";

export type RollePerson = {
    rolle?: ForelderPartRolle;
    ident?: string;
    navn?: string;
    fødselsdato?: string;
    erKjent?: boolean;
    diskresjonskode?: Diskresjonskode;
};

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

    const erIkkeValgt = person.erKjent === undefined && !person.ident;
    const erUkjent = person.erKjent === false || !person.ident || !person.navn;

    return (
        <SkjemaSeksjonKort variant={erUkjent && !erIkkeValgt ? "warning" : "default"}>
            <VStack gap="space-12">
                <HStack align="center" gap="space-8">
                    <PersonIcon aria-hidden fontSize="1.5rem" />
                    <BodyLong size="small" weight="semibold">
                        {tittel ?? rolletittel(person.rolle)}
                    </BodyLong>
                </HStack>
                {førInnhold}
                <MaskerSensitivInfo>
                    {erIkkeValgt ? (
                        <UkjentPerson tekst="Ikke valgt" />
                    ) : erUkjent ? (
                        <UkjentPerson tekst="Ukjent" />
                    ) : (
                        <KjentPerson person={person} />
                    )}
                </MaskerSensitivInfo>
                {children}
            </VStack>
        </SkjemaSeksjonKort>
    );
}

function rolletittel(rolle?: ForelderPartRolle) {
    return rolle ? hentForelderRolleLabel(rolle) : "Person";
}

function UkjentPerson({ tekst }: { tekst: string }) {
    return (
        <BodyLong size="small" textColor="subtle" className="italic">
            {tekst}
        </BodyLong>
    );
}

function KjentPerson({ person }: { person: RollePerson }) {
    return (
        <VStack gap="space-4">
            <PersonInfo
                ident={person.ident ?? ""}
                navn={person.navn}
                fødselsdato={person.fødselsdato}
                visKopieringsknapp={false}
            />
            {person.diskresjonskode && <DiskresjonAlert diskresjonskode={person.diskresjonskode} />}
        </VStack>
    );
}
