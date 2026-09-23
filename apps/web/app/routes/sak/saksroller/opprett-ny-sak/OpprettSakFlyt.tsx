import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { BodyLong, Box, Heading, HStack, Loader, VStack } from "@navikt/ds-react";
import { Suspense, useMemo, useRef, useState } from "react";
import DiskresjonAlert from "../components/DiskresjonAlert";
import PersonInfo from "../components/PersonInfo";
import SøkPerson from "../components/SøkPerson";
import LasterSkeleton from "./components/LasterSkeleton";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "./felles/SkjemaSeksjon";
import BarnBeggeForeldreFlyt from "./flyt/BarnBeggeForeldre/BarnBeggeForeldreFlyt";
import BarnMedManglendeForeldreFlyt from "./flyt/BarnManglendeForeldre/BarnMedManglendeForeldreFlyt";
import EktefellebidragFlyt from "./flyt/Ektefellebidrag/EktefellebidragFlyt";
import FarskapsFlyt from "./flyt/Farskap/FarskapsFlyt";
import ForelderMedBarnFlyt from "./flyt/ForelderMedBarn/ForelderMedBarnFlyt";
import ForelderUtenBarnFlyt from "./flyt/ForelderUtenBarn/ForelderUtenBarnFlyt";
import OppfostringsbidragFlyt from "./flyt/Oppfostringsbidrag/OppfostringsbidragFlyt";
import type { PartRolle } from "./opprett-sak-schema";
import SakskategoriVelger from "./SakskategoriVelger";
import SaksrolleVelger from "./SaksrolleVelger";
import SakstypeVelger from "./SakstypeVelger";
import { type Sakstype, sakstypeTilBeskrivelse, useSaksrolleroversikt } from "./saksrolleroversiktContext";
import { tilPartISaken } from "./utils";

const AUTO_ASSIGNED_ROLES: Partial<Record<Sakstype, PartRolle>> = {
    OPPFOSTRINGSBIDRAG: "bidragspliktig",
    FARSKAP: "bidragsmottaker",
};

function getAutoAssignedRole(sakstype: Sakstype | null): PartRolle | null {
    if (!sakstype) return null;
    return AUTO_ASSIGNED_ROLES[sakstype] || null;
}

function ValgtPart({ person, sakstype }: { person: PersonDto; sakstype: Sakstype | null }) {
    return (
        <VStack gap="space-8">
            <PersonInfo ident={person.ident} navn={person.visningsnavn} fødselsdato={person.fødselsdato ?? undefined} />
            {person.diskresjonskode && <DiskresjonAlert diskresjonskode={person.diskresjonskode} />}
            <SaksrolleVelger
                key={`${person.ident}-${sakstype}`}
                partISaken={person}
                enforcedRolle={getAutoAssignedRole(sakstype)}
            />
        </VStack>
    );
}

function partSeksjonTittel(sakstype: Sakstype) {
    if (sakstype === "OPPFOSTRINGSBIDRAG") {
        return "Bidragspliktig";
    }
    if (sakstype === "FARSKAP") {
        return "Bidragsmottaker";
    }
    return "Part i saken";
}

function partSøkLabel(sakstype: Sakstype) {
    if (sakstype === "OPPFOSTRINGSBIDRAG") {
        return "Søk etter bidragspliktig";
    }
    if (sakstype === "FARSKAP") {
        return "Søk etter bidragsmottaker";
    }
    return "Søk etter part";
}

export default function OpprettSakFlyt() {
    const [partISaken, setPartISaken] = useState<PersonDto | null>();
    const {
        sakstype,
        setSakstype,
        sakskategori,
        setSakskategori,
        saksrolleFlyt,
        isLoadingOpprettSak,
        setPartISaken: setPartISakenSkjemaData,
        setSaksrolleFlyt,
        setPartISakenAlder,
        hentBarnkurver,
        nullstillRolleOgFlyt,
        nullstillPartOgFlyt,
    } = useSaksrolleroversikt();

    const FlytKomponent = useMemo(() => {
        if (!saksrolleFlyt) {
            return null;
        }

        const map = {
            FORELDER_MED_BARN: ForelderMedBarnFlyt,
            FORELDER_UTEN_BARN: ForelderUtenBarnFlyt,
            BARN_BEGGE_FORELDRE: BarnBeggeForeldreFlyt,
            BARN_MANGLENDE_FORELDRE: BarnMedManglendeForeldreFlyt,
            EKTEFELLEBIDRAG: EktefellebidragFlyt,
            FARSKAP: FarskapsFlyt,
            OPPFOSTRINGSBIDRAG: OppfostringsbidragFlyt,
        } as const;

        return map[saksrolleFlyt.type];
    }, [saksrolleFlyt]);

    const barnkurverRequestIdRef = useRef(0);
    const oppdaterFlytForSakstypeOgPart = (person: PersonDto, valgtSakstype: Sakstype | null) => {
        const autoRole = getAutoAssignedRole(valgtSakstype);

        if (!autoRole) {
            barnkurverRequestIdRef.current += 1;
            nullstillRolleOgFlyt();
            return;
        }

        setPartISakenSkjemaData(tilPartISaken(person, autoRole));

        if (valgtSakstype === "OPPFOSTRINGSBIDRAG") {
            barnkurverRequestIdRef.current += 1;
            const requestId = barnkurverRequestIdRef.current;
            hentBarnkurver(person.ident)
                .then((barnkurver) => {
                    if (barnkurverRequestIdRef.current !== requestId) return;
                    setSaksrolleFlyt({
                        key: Date.now(),
                        type: "OPPFOSTRINGSBIDRAG",
                        barnkurver,
                    });
                })
                .catch(() => {
                    if (barnkurverRequestIdRef.current !== requestId) return;
                    setSaksrolleFlyt({
                        key: Date.now(),
                        type: "OPPFOSTRINGSBIDRAG",
                        barnkurver: [],
                    });
                });
            return;
        }

        if (valgtSakstype === "FARSKAP") {
            barnkurverRequestIdRef.current += 1;
            const requestId = barnkurverRequestIdRef.current;
            hentBarnkurver(person.ident)
                .then((barnkurver) => {
                    if (barnkurverRequestIdRef.current !== requestId) return;
                    setSaksrolleFlyt({
                        key: Date.now(),
                        type: "FARSKAP",
                        barnkurver,
                    });
                })
                .catch(() => {
                    if (barnkurverRequestIdRef.current !== requestId) return;
                    setSaksrolleFlyt({
                        key: Date.now(),
                        type: "FARSKAP",
                        barnkurver: [],
                    });
                });
        }
    };

    const velgSakstype = (type: Sakstype) => {
        if (type === sakstype) {
            return;
        }

        setSakstype(type);
        setSakskategori("Nasjonal");

        if (partISaken) {
            oppdaterFlytForSakstypeOgPart(partISaken, type);
        } else {
            barnkurverRequestIdRef.current += 1;
            nullstillPartOgFlyt();
        }
    };

    const leggTilPartISaken = (person: PersonDto) => {
        barnkurverRequestIdRef.current += 1;
        nullstillPartOgFlyt();
        setPartISaken(person);
        const partISakAlder = beregnAlderForPerson(person);
        setPartISakenAlder(partISakAlder);

        oppdaterFlytForSakstypeOgPart(person, sakstype);
    };

    return (
        <Box maxWidth="56rem" marginInline="auto">
            <Box paddingBlock="space-32" paddingInline="space-16">
                <VStack gap="space-24">
                    {isLoadingOpprettSak && (
                        <Box
                            background="raised"
                            borderColor="neutral-subtleA"
                            borderWidth="1"
                            borderRadius="12"
                            padding="space-24"
                            role="status"
                            aria-live="polite"
                        >
                            <HStack align="center" justify="center">
                                <VStack align="center" gap="space-12">
                                    <Loader size="2xlarge" title="Oppretter sak..." />
                                    <BodyLong>Oppretter sak...</BodyLong>
                                </VStack>
                            </HStack>
                        </Box>
                    )}

                    <Heading level="1" size="large">
                        Opprett ny sak
                    </Heading>

                    <VStack gap="space-24">
                        <SkjemaSeksjon tittel="Type sak">
                            <SkjemaSeksjonKort>
                                <SakstypeVelger value={sakstype} onVelg={velgSakstype} />
                            </SkjemaSeksjonKort>
                            <SkjemaSeksjonKort>
                                <SakskategoriVelger value={sakskategori} onChange={setSakskategori} />
                            </SkjemaSeksjonKort>
                        </SkjemaSeksjon>

                        {sakstype && (
                            <SkjemaSeksjon
                                tittel={partSeksjonTittel(sakstype)}
                                beskrivelse={sakstypeTilBeskrivelse(sakstype)}
                            >
                                <SkjemaSeksjonKort>
                                    <SøkPerson
                                        label={partSøkLabel(sakstype)}
                                        personInformasjon={(person) => leggTilPartISaken(person)}
                                        compact
                                    />
                                </SkjemaSeksjonKort>
                                {partISaken && (
                                    <SkjemaSeksjonKort>
                                        <ValgtPart person={partISaken} sakstype={sakstype} />
                                    </SkjemaSeksjonKort>
                                )}
                            </SkjemaSeksjon>
                        )}
                    </VStack>

                    {partISaken && (
                        <Suspense fallback={<LasterSkeleton tekst="Laster data..." />}>
                            {!!saksrolleFlyt && FlytKomponent && <FlytKomponent key={saksrolleFlyt.key} />}
                        </Suspense>
                    )}
                </VStack>
            </Box>
        </Box>
    );
}
