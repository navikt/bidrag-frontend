import type { PersonDto } from "@bidrag/api/PersonApi";
import { MaskerSensitivInfo, PersonIdent } from "@bidrag/common";
import { beregnAlder } from "@bidrag/utils";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { BodyShort, Button, HStack, VStack } from "@navikt/ds-react";
import { useState } from "react";
import DiskresjonAlert from "../components/DiskresjonAlert";
import PersonInfo from "../components/PersonInfo";
import SøkPerson from "../components/SøkPerson";
import NullstillDialog from "./felles/NullstillDialog";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "./felles/SkjemaSeksjon";
import type { PartRolle } from "./opprett-sak-schema";
import SaksrolleVelger from "./SaksrolleVelger";
import { type Sakstype, sakstypeTilBeskrivelse, tvungenRolle, useErOppretterSak } from "./saksrolleroversiktContext";

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
 * Søk som bare brukes for å starte skjemaet. Når saksbehandleren bekrefter, fylles skjemaet ut
 * med personen og søket tømmes. Partene kan deretter endres fritt i skjemaet.
 */
export default function StartpartVelger({
    sakstype,
    forhåndsvalgt = null,
    visSøk = true,
    harSkjema,
    onBekreft,
}: {
    sakstype: Sakstype;
    forhåndsvalgt?: PersonDto | null;
    visSøk?: boolean;
    /** Et utfylt skjema nullstilles ved ny bekreftelse, så da spørres det først. */
    harSkjema: boolean;
    onBekreft: (person: PersonDto, rolle: PartRolle) => void;
}) {
    const isLoadingOpprettSak = useErOppretterSak();
    const låstRolle = tvungenRolle(sakstype);
    const [utkast, setUtkast] = useState<Utkast | null>(() =>
        forhåndsvalgt ? { person: forhåndsvalgt, rolle: låstRolle } : null,
    );
    const [søkNøkkel, setSøkNøkkel] = useState(0);
    const [viserNullstillDialog, setViserNullstillDialog] = useState(false);

    const velgPerson = (person: PersonDto) => {
        if (isLoadingOpprettSak) return;
        setUtkast({ person, rolle: låstRolle });
    };

    const bekreft = () => {
        if (!utkast?.rolle) return;
        onBekreft(utkast.person, utkast.rolle);
        setUtkast(null);
        setSøkNøkkel((forrige) => forrige + 1);
        setViserNullstillDialog(false);
    };

    const onBekreftKlikk = () => (harSkjema ? setViserNullstillDialog(true) : bekreft());

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
                        compact
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
                            onVelg={(rolle) => setUtkast({ ...utkast, rolle })}
                        />
                        <Button
                            type="button"
                            size="small"
                            disabled={!utkast.rolle || isLoadingOpprettSak}
                            onClick={onBekreftKlikk}
                        >
                            Bekreft
                        </Button>
                    </VStack>
                </SkjemaSeksjonKort>
            )}
            <NullstillDialog
                open={viserNullstillDialog}
                onOpenChange={setViserNullstillDialog}
                beskrivelse={`Skjemaet nullstilles og fylles ut på nytt med ${utkast?.person.visningsnavn}.`}
                onBekreft={bekreft}
            />
        </SkjemaSeksjon>
    );
}

function ValgtPart({ person }: { person: PersonDto }) {
    return (
        <VStack gap="space-8">
            <PersonInfo
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
