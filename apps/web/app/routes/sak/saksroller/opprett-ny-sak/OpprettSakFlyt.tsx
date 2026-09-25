import type { PersonDto } from "@bidrag/api/PersonApi";
import { MaskerSensitivInfo, PersonIdent } from "@bidrag/common";
import { beregnAlder } from "@bidrag/utils";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { BodyLong, BodyShort, Box, Heading, HGrid, HStack, InlineMessage, Loader, VStack } from "@navikt/ds-react";
import { type ReactNode, Suspense, useEffect, useRef } from "react";
import { useHentPersoninformasjon } from "~/api/useApi.ts";
import DiskresjonAlert from "../components/DiskresjonAlert";
import PersonInfo from "../components/PersonInfo";
import SøkPerson from "../components/SøkPerson";
import LasterSkeleton from "./components/LasterSkeleton";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "./felles/SkjemaSeksjon";
import BarnebidragFlyt from "./flyt/Barnebidrag/BarnebidragFlyt";
import EktefellebidragFlyt from "./flyt/Ektefellebidrag/EktefellebidragFlyt";
import EnPartMedBarnFlyt from "./flyt/EnPartMedBarn/EnPartMedBarnFlyt";
import { type InngangRolle, tilPartRolle } from "./inngang";
import SakskategoriVelger from "./SakskategoriVelger";
import SaksrolleVelger from "./SaksrolleVelger";
import SakstypeVelger from "./SakstypeVelger";
import {
    type Sakstype,
    sakstypeTilBeskrivelse,
    tvungenRolle,
    useSaksrolleroversikt,
} from "./saksrolleroversiktContext";

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

function partSeksjonTittel(sakstype: Sakstype) {
    if (sakstype === "OPPFOSTRINGSBIDRAG") {
        return "Bidragspliktig";
    }
    if (sakstype === "FARSKAP") {
        return "Bidragsmottaker";
    }
    return "Søk opp person";
}

function partSøkLabel(sakstype: Sakstype) {
    if (sakstype === "OPPFOSTRINGSBIDRAG") {
        return "Søk etter bidragspliktig";
    }
    if (sakstype === "FARSKAP") {
        return "Søk etter bidragsmottaker";
    }
    return "Søk etter person";
}

const flytkomponenter = {
    BARNEBIDRAG: BarnebidragFlyt,
    EKTEFELLEBIDRAG: EktefellebidragFlyt,
    FARSKAP: EnPartMedBarnFlyt,
    OPPFOSTRINGSBIDRAG: EnPartMedBarnFlyt,
} as const;

export default function OpprettSakFlyt({ visning = "side" }: { visning?: "side" | "modal" }) {
    const {
        valgtPerson,
        partISaken,
        valgVersjon,
        sakstype,
        sakskategori,
        velgKategori,
        isLoadingOpprettSak,
        velgPerson,
        velgSakstype: settSakstypeOgNullstill,
    } = useSaksrolleroversikt();

    const velgSakstype = (type: Sakstype) => {
        if (type === sakstype || isLoadingOpprettSak) return;
        settSakstypeOgNullstill(type);
    };

    const leggTilPartISaken = (person: PersonDto) => {
        if (!sakstype || isLoadingOpprettSak) return;
        velgPerson(person);
    };

    const velgFraInngang = (person: PersonDto, rolle: InngangRolle | undefined) => {
        if (!sakstype || isLoadingOpprettSak) return;
        velgPerson(person, tilPartRolle(rolle, beregnAlderForPerson(person)));
    };

    const velgSakskategori = (kategori: typeof sakskategori) => {
        if (kategori === sakskategori || isLoadingOpprettSak) return;
        velgKategori(kategori);
    };

    const FlytKomponent = sakstype ? flytkomponenter[sakstype] : null;

    return (
        <FlytRamme visning={visning}>
            {isLoadingOpprettSak && <OppretterSak />}

            <VStack gap="space-24" aria-busy={isLoadingOpprettSak}>
                <SkjemaSeksjon tittel="Type sak">
                    <HGrid gap="space-24" columns={{ xs: 1, sm: 2 }} align="start">
                        <SkjemaSeksjonKort>
                            <SakskategoriVelger value={sakskategori} onChange={velgSakskategori} />
                        </SkjemaSeksjonKort>
                        <SkjemaSeksjonKort>
                            <SakstypeVelger value={sakstype} onVelg={velgSakstype} />
                        </SkjemaSeksjonKort>
                    </HGrid>
                </SkjemaSeksjon>

                <Forhåndsutfylling onPerson={velgFraInngang} />
                {sakstype && (
                    <PartSeksjon
                        sakstype={sakstype}
                        sakskategori={sakskategori}
                        partISaken={valgtPerson}
                        onPersonValgt={leggTilPartISaken}
                    />
                )}
            </VStack>

            {partISaken && FlytKomponent && (
                <Suspense fallback={<LasterSkeleton tekst="Laster data..." />}>
                    <FlytKomponent key={valgVersjon} />
                </Suspense>
            )}
        </FlytRamme>
    );
}

function FlytRamme({ visning, children }: { visning: "side" | "modal"; children: ReactNode }) {
    if (visning === "modal") return <VStack gap="space-24">{children}</VStack>;

    return (
        <Box maxWidth="80rem" marginInline="auto" paddingBlock="space-32" paddingInline="space-16">
            <VStack gap="space-24">
                <Heading level="1" size="large">
                    Opprett ny sak
                </Heading>
                {children}
            </VStack>
        </Box>
    );
}

function Forhåndsutfylling({ onPerson }: { onPerson: (person: PersonDto, rolle: InngangRolle | undefined) => void }) {
    const { inngang } = useSaksrolleroversikt();
    const { data: person, error } = useHentPersoninformasjon(inngang ? { ident: inngang.ident } : null);
    const utført = useRef(false);
    const onPersonRef = useRef(onPerson);
    onPersonRef.current = onPerson;

    useEffect(() => {
        if (!person || utført.current) return;
        utført.current = true;
        onPersonRef.current(person, inngang?.rolle);
    }, [person, inngang?.rolle]);

    if (!error) return null;
    return (
        <InlineMessage status="warning">
            Kunne ikke hente personen saken ble åpnet for. Søk opp personen manuelt.
        </InlineMessage>
    );
}

function OppretterSak() {
    return (
        <Box
            background="raised"
            borderColor="neutral-subtleA"
            borderWidth="1"
            borderRadius="12"
            padding="space-24"
            role="status"
            aria-live="polite"
        >
            <VStack align="center" gap="space-12">
                <Loader size="2xlarge" title="Oppretter sak..." />
                <BodyLong>Oppretter sak...</BodyLong>
            </VStack>
        </Box>
    );
}

function PartSeksjon({
    sakstype,
    sakskategori,
    partISaken,
    onPersonValgt,
}: {
    sakstype: Sakstype;
    sakskategori: unknown;
    partISaken?: PersonDto | null;
    onPersonValgt: (person: PersonDto) => void;
}) {
    return (
        <SkjemaSeksjon tittel={partSeksjonTittel(sakstype)} beskrivelse={sakstypeTilBeskrivelse(sakstype)}>
            <HGrid gap="space-24" columns={{ xs: 1, sm: 2 }}>
                <SkjemaSeksjonKort>
                    <SøkPerson
                        key={`${sakstype}-${sakskategori}`}
                        label={partSøkLabel(sakstype)}
                        personInformasjon={onPersonValgt}
                        compact
                    />
                </SkjemaSeksjonKort>
                {partISaken && (
                    <SkjemaSeksjonKort>
                        <ValgtPart person={partISaken} />
                    </SkjemaSeksjonKort>
                )}
            </HGrid>
            {partISaken && (
                <SkjemaSeksjonKort>
                    <SaksrolleVelger
                        key={`${partISaken.ident}-${sakstype}`}
                        partISaken={partISaken}
                        enforcedRolle={tvungenRolle(sakstype)}
                    />
                </SkjemaSeksjonKort>
            )}
        </SkjemaSeksjon>
    );
}
