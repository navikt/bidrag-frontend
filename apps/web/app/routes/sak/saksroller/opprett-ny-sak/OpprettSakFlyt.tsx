import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { BodyLong, Box, Button, Heading, HStack, Loader, VStack } from "@navikt/ds-react";
import { Suspense, useMemo, useRef, useState } from "react";
import DiskresjonAlert from "../components/DiskresjonAlert";
import PersonInfo from "../components/PersonInfo";
import SøkPerson from "../components/SøkPerson";
import LasterSkeleton from "./components/LasterSkeleton";
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
import {
    type Sakstype,
    sakstypeTilBeskrivelse,
    sakstypeTilTekst,
    useSaksrolleroversikt,
} from "./saksrolleroversiktContext";
import { tilPartISaken } from "./utils";

const AUTO_ASSIGNED_ROLES: Partial<Record<Sakstype, PartRolle>> = {
    OPPFOSTRINGSBIDRAG: "bidragspliktig",
    FARSKAP: "bidragsmottaker",
};

function getAutoAssignedRole(sakstype: Sakstype | null): PartRolle | null {
    if (!sakstype) return null;
    return AUTO_ASSIGNED_ROLES[sakstype] || null;
}

function ValgtPart({
    person,
    sakstype,
    onEndre,
}: {
    person: PersonDto;
    sakstype: Sakstype | null;
    onEndre: () => void;
}) {
    const rolleNavn =
        sakstype === "OPPFOSTRINGSBIDRAG"
            ? "Bidragspliktig"
            : sakstype === "FARSKAP"
              ? "Bidragsmottaker"
              : "Part i saken";

    return (
        <Box asChild background="sunken" padding="space-12">
            <VStack gap="space-4">
                <Heading level="2" size="small">
                    {rolleNavn}
                </Heading>
                <Box
                    background="raised"
                    borderColor="neutral-subtleA"
                    borderWidth="1"
                    borderRadius="12"
                    padding="space-12"
                >
                    <VStack gap="space-8">
                        <HStack align="start" justify="space-between" gap="space-8">
                            <Box flexGrow="1">
                                <PersonInfo
                                    ident={person.ident}
                                    navn={person.visningsnavn}
                                    fødselsdato={person.fødselsdato ?? undefined}
                                />
                                {person.diskresjonskode && (
                                    <Box marginBlock="space-8 space-0">
                                        <DiskresjonAlert diskresjonskode={person.diskresjonskode} />
                                    </Box>
                                )}
                            </Box>
                            <Button variant="tertiary" size="small" onClick={onEndre}>
                                Endre part
                            </Button>
                        </HStack>
                        <SaksrolleVelger partISaken={person} enforcedRolle={getAutoAssignedRole(sakstype)} />
                    </VStack>
                </Box>
            </VStack>
        </Box>
    );
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
    const nullstillValgtPart = () => {
        barnkurverRequestIdRef.current += 1;
        setPartISaken(null);
        nullstillPartOgFlyt();
    };

    const endreSakstype = () => {
        nullstillValgtPart();
        setSakstype(null);
        setSakskategori("Nasjonal");
    };

    const endrePartISaken = nullstillValgtPart;

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
        setSakstype(type);

        if (partISaken) {
            oppdaterFlytForSakstypeOgPart(partISaken, type);
        }
    };

    const leggTilPartISaken = (person: PersonDto) => {
        setPartISaken(person);
        const partISakAlder = beregnAlderForPerson(person);
        setPartISakenAlder(partISakAlder);

        oppdaterFlytForSakstypeOgPart(person, sakstype);
    };

    return (
        <Box maxWidth="56rem" marginInline="auto">
            <Box minHeight="100vh" paddingBlock="space-32" paddingInline="space-16">
                <VStack gap="space-24">
                    {isLoadingOpprettSak && (
                        <HStack
                            position="fixed"
                            inset="space-0"
                            align="center"
                            justify="center"
                            className="z-50 bg-[white]/70 backdrop-blur-sm"
                            role="status"
                            aria-live="polite"
                        >
                            <VStack align="center" gap="space-12">
                                <Loader size="2xlarge" title="Oppretter sak..." />
                                <BodyLong>Oppretter sak...</BodyLong>
                            </VStack>
                        </HStack>
                    )}

                    <Heading level="1" size="large">
                        Opprett ny sak
                    </Heading>

                    <VStack gap="space-24">
                        {!sakstype && (
                            <Box background="sunken" padding="space-12">
                                <SakstypeVelger onVelg={velgSakstype} />
                            </Box>
                        )}

                        {sakstype && (
                            <Box asChild background="sunken" padding="space-12">
                                <VStack gap="space-8">
                                    <HStack align="start" justify="space-between" gap="space-16">
                                        <VStack gap="space-4">
                                            <Heading level="2" size="medium">
                                                Sakstype
                                            </Heading>
                                            <BodyLong weight="semibold" textColor="default">
                                                {sakstypeTilTekst(sakstype)}
                                            </BodyLong>
                                        </VStack>
                                        <Button variant="tertiary" size="small" onClick={endreSakstype}>
                                            Endre
                                        </Button>
                                    </HStack>

                                    <Box background="raised" padding="space-12">
                                        <SakskategoriVelger value={sakskategori} onChange={setSakskategori} />
                                    </Box>
                                </VStack>
                            </Box>
                        )}

                        {sakstype && !partISaken && (
                            <Box asChild background="sunken" padding="space-12">
                                <VStack gap="space-8">
                                    <Box>
                                        <Heading level="2" size="medium">
                                            {sakstype === "OPPFOSTRINGSBIDRAG"
                                                ? "Bidragspliktig"
                                                : sakstype === "FARSKAP"
                                                  ? "Bidragsmottaker"
                                                  : "Part i saken"}
                                        </Heading>
                                        <BodyLong size="small" textColor="subtle">
                                            {sakstypeTilBeskrivelse(sakstype)}
                                        </BodyLong>
                                    </Box>
                                    <Box background="raised" padding="space-12">
                                        <SøkPerson
                                            label={
                                                sakstype === "OPPFOSTRINGSBIDRAG"
                                                    ? "Søk etter bidragspliktig"
                                                    : sakstype === "FARSKAP"
                                                      ? "Søk etter bidragsmottaker"
                                                      : "Søk etter part"
                                            }
                                            personInformasjon={(person) => leggTilPartISaken(person)}
                                            compact
                                        />
                                    </Box>
                                </VStack>
                            </Box>
                        )}

                        {partISaken && <ValgtPart person={partISaken} sakstype={sakstype} onEndre={endrePartISaken} />}
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
