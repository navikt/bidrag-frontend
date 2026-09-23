import { Alert, BodyShort } from "@navikt/ds-react";
import type { ReactNode } from "react";
import type { ForelderPartRolle } from "../opprett-sak-schema";
import { type RollePerson, RollePersonGrid } from "./RollePersonKort";
import SkjemaSeksjon from "./SkjemaSeksjon";

type Part = Omit<RollePerson, "rolle">;

type Props = {
    partISaken: Part;
    partISakenRolle: ForelderPartRolle;
    motpart: Part;
    motpartRolle: ForelderPartRolle;
    motpartInnhold?: ReactNode;
    visParter?: boolean;
    tomTekst?: string;
    beskrivelse?: string;
    feil?: string;
};

export default function ParterSeksjon({
    partISaken,
    partISakenRolle,
    motpart,
    motpartRolle,
    motpartInnhold,
    visParter = true,
    tomTekst = "Velg minst ett barn før du kontrollerer partene i saken.",
    beskrivelse = "Kontroller bidragsmottaker og bidragspliktig.",
    feil,
}: Props) {
    const personer: RollePerson[] = [
        { ...partISaken, rolle: partISakenRolle },
        { ...motpart, rolle: motpartRolle },
    ];

    return (
        <SkjemaSeksjon tittel="Parter" beskrivelse={beskrivelse}>
            {feil && <Alert variant="error">{feil}</Alert>}
            {visParter ? (
                <RollePersonGrid personer={personer} handlinger={{ [motpartRolle]: motpartInnhold }} />
            ) : (
                <BodyShort size="small" textColor="subtle">
                    {tomTekst}
                </BodyShort>
            )}
        </SkjemaSeksjon>
    );
}
