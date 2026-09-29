import type { PersonDto } from "@bidrag/api/PersonApi";
import { MaskerSensitivInfo, PersonIdent } from "@bidrag/common";
import { beregnAlder } from "@bidrag/utils";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { BodyShort, HStack, VStack } from "@navikt/ds-react";
import { useState } from "react";
import DiskresjonAlert from "../../felles/person/DiskresjonAlert";
import PersonInfo from "../../felles/person/PersonInfo";
import SøkPerson from "../../felles/person-søk/SøkPerson";
import NullstillDialog from "../skjema/NullstillDialog";
import type { PartRolle } from "../skjema/opprett-sak-schema";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "../skjema/SkjemaSeksjon";
import {
    type Sakstype,
    sakstypeTilBeskrivelse,
    tvungenRolle,
    useErOppretterSak,
} from "../skjema/saksrolleroversiktContext";
import SaksrolleVelger from "./SaksrolleVelger";

type Utkast = { person: PersonDto; rolle: PartRolle | null };

const SEKSJONSTITTEL: Partial<Record<Sakstype, string>> = {
    OPPFOSTRINGSBIDRAG: "Bidragspliktig",
    FARSKAP: "Bidragsmottaker",
};

const SØKELABEL: Partial<Record<Sakstype, string>> = {
    OPPFOSTRINGSBIDRAG: "Søk etter bidragspliktig",
    FARSKAP: "Søk etter bidragsmottaker",
};

/**
 * Søk som bare brukes for å starte skjemaet. Når rollen er valgt, fylles skjemaet ut
 * med personen og søket tømmes. Partene kan deretter endres fritt i skjemaet.
 */
export default function StartpartVelger({
    sakstype,
    forhåndsvalgt = null,
    visSøk = true,
    harSkjema,
    onValgt,
}: {
    sakstype: Sakstype;
    forhåndsvalgt?: PersonDto | null;
    visSøk?: boolean;
    /** Et utfylt skjema nullstilles ved nytt valg, så da spørres det først. */
    harSkjema: boolean;
    onValgt: (person: PersonDto, rolle: PartRolle) => void;
}) {
    const isLoadingOpprettSak = useErOppretterSak();
    const låstRolle = tvungenRolle(sakstype);
    const [utkast, setUtkast] = useState<Utkast | null>(() =>
        forhåndsvalgt ? { person: forhåndsvalgt, rolle: låstRolle } : null,
    );
    const [søkNøkkel, setSøkNøkkel] = useState(0);
    const [viserNullstillDialog, setViserNullstillDialog] = useState(false);

    const fyllUt = (valgt: Utkast | null = utkast) => {
        if (!valgt?.rolle) return;
        onValgt(valgt.person, valgt.rolle);
        setUtkast(null);
        setSøkNøkkel((forrige) => forrige + 1);
        setViserNullstillDialog(false);
    };

    const velg = (valgt: Utkast) => {
        setUtkast(valgt);
        if (!valgt.rolle) return;
        if (harSkjema) setViserNullstillDialog(true);
        else fyllUt(valgt);
    };

    const velgPerson = (person: PersonDto) => {
        if (isLoadingOpprettSak) return;
        velg({ person, rolle: låstRolle });
    };

    const avbrytNullstilling = (open: boolean) => {
        setViserNullstillDialog(open);
        if (!open) setUtkast((forrige) => (forrige && !låstRolle ? { ...forrige, rolle: null } : null));
    };

    return (
        <SkjemaSeksjon
            tittel={visSøk ? (SEKSJONSTITTEL[sakstype] ?? "Søk opp person") : "Velg rolle"}
            beskrivelse={sakstypeTilBeskrivelse(sakstype)}
        >
            {visSøk && (
                <SkjemaSeksjonKort>
                    <SøkPerson
                        key={søkNøkkel}
                        label={SØKELABEL[sakstype] ?? "Søk etter person"}
                        personInformasjon={velgPerson}
                    />
                </SkjemaSeksjonKort>
            )}
            {utkast && (
                <SkjemaSeksjonKort>
                    <VStack gap="space-16" align="start">
                        <ValgtPart person={utkast.person} />
                        <SaksrolleVelger
                            navn={utkast.person.visningsnavn}
                            alder={beregnAlderForPerson(utkast.person)}
                            sakstype={sakstype}
                            rolle={utkast.rolle}
                            readOnly={!!låstRolle || isLoadingOpprettSak}
                            onVelg={(rolle) => velg({ ...utkast, rolle })}
                        />
                    </VStack>
                </SkjemaSeksjonKort>
            )}
            <NullstillDialog
                open={viserNullstillDialog}
                onOpenChange={avbrytNullstilling}
                beskrivelse={
                    <>
                        Skjemaet nullstilles og fylles ut på nytt med{" "}
                        <span className="personnavn">{utkast?.person.visningsnavn}</span>.
                    </>
                }
                onBekreft={() => fyllUt()}
            />
        </SkjemaSeksjon>
    );
}

function ValgtPart({ person }: { person: PersonDto }) {
    return (
        <VStack gap="space-8">
            <PersonInfo
                truncate
                ident={person.ident}
                navn={person.visningsnavn}
                fødselsdato={person.fødselsdato ?? undefined}
                fallback={<ValgtPartPersonInfo person={person} />}
            />
            {person.diskresjonskode && <DiskresjonAlert diskresjonskode={person.diskresjonskode} />}
        </VStack>
    );
}

function ValgtPartPersonInfo({ person }: { person: PersonDto }) {
    const alder = person.fødselsdato ? beregnAlder(person.fødselsdato) : undefined;

    return (
        <MaskerSensitivInfo>
            <VStack>
                <BodyShort size="small" weight="semibold">
                    {person.visningsnavn}
                </BodyShort>
                <HStack align="center" gap="space-4">
                    <PersonIdent ident={person.ident} />
                    {alder !== undefined && (
                        <BodyShort size="small" textColor="subtle">
                            ({alder} år)
                        </BodyShort>
                    )}
                </HStack>
            </VStack>
        </MaskerSensitivInfo>
    );
}
