import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils/personUtils";
import { PersonIcon } from "@navikt/aksel-icons";
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
import RolleVisning from "./RolleVisning";
import SakskategoriVelger from "./SakskategoriVelger";
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

function requiresRoleSelection(sakstype: Sakstype | null): boolean {
    return !getAutoAssignedRole(sakstype);
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
        partISaken: partISakenSkjemaData,
        setPartISaken: setPartISakenSkjemaData,
        setSaksrolleFlyt,
        setPartISakenAlder,
        hentBarnkurver,
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

    const endreSakstype = () => {
        barnkurverRequestIdRef.current += 1;
        setSakstype(null);
        setSakskategori("Nasjonal");
        setPartISakenSkjemaData(null);
        setSaksrolleFlyt(null);
    };

    const endrePartISaken = () => {
        barnkurverRequestIdRef.current += 1;
        setPartISaken(null);
        setPartISakenSkjemaData(null);
        setSaksrolleFlyt(null);
    };

    const oppdaterFlytForSakstypeOgPart = (person: PersonDto, valgtSakstype: Sakstype | null) => {
        const autoRole = getAutoAssignedRole(valgtSakstype);

        if (!autoRole) {
            barnkurverRequestIdRef.current += 1;
            setPartISakenSkjemaData(null);
            setSaksrolleFlyt(null);
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
        const partISakAlder = person?.fødselsdato ? beregnAlder(person.fødselsdato) : beregnAlderFraFnr(person.ident);
        setPartISakenAlder(partISakAlder);

        oppdaterFlytForSakstypeOgPart(person, sakstype);
    };

    return (
        <Box maxWidth="56rem" marginInline="auto">
            <Box background="sunken" minHeight="100vh" paddingBlock="space-32" paddingInline="space-16">
                <VStack gap="space-12">
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

                    <Box as="div" background="default" borderRadius={"2"} padding="space-12">
                        <VStack gap="space-2">
                            {!sakstype && <SakstypeVelger onVelg={velgSakstype} />}

                            {sakstype && (
                                <VStack gap="space-2">
                                    <HStack align="start" justify="space-between" gap="space-16">
                                        <div>
                                            <Box asChild marginBlock="space-0 space-4">
                                                <Heading level="2" size="medium">
                                                    Sakstype
                                                </Heading>
                                            </Box>
                                            <BodyLong weight="semibold" textColor="default">
                                                {sakstypeTilTekst(sakstype)}
                                            </BodyLong>
                                        </div>
                                        <Button variant="tertiary" size="small" onClick={endreSakstype}>
                                            Endre
                                        </Button>
                                    </HStack>

                                    <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" />

                                    <SakskategoriVelger value={sakskategori} onChange={setSakskategori} />
                                </VStack>
                            )}

                            {sakstype && !partISaken && (
                                <>
                                    <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" />
                                    <VStack gap="space-4">
                                        <div>
                                            <Heading level="2" size="medium" spacing>
                                                {sakstype === "OPPFOSTRINGSBIDRAG"
                                                    ? "Bidragspliktig"
                                                    : sakstype === "FARSKAP"
                                                      ? "Bidragsmottaker"
                                                      : "Part i saken"}
                                            </Heading>
                                            <BodyLong size="small" textColor="subtle">
                                                {sakstypeTilBeskrivelse(sakstype)}
                                            </BodyLong>
                                        </div>
                                        <SøkPerson
                                            label={
                                                sakstype === "OPPFOSTRINGSBIDRAG"
                                                    ? "Søk etter bidragspliktig"
                                                    : sakstype === "FARSKAP"
                                                      ? "Søk etter bidragsmottaker"
                                                      : "Søk etter part"
                                            }
                                            personInformasjon={(person) => leggTilPartISaken(person)}
                                        />
                                    </VStack>
                                </>
                            )}

                            {partISaken && (
                                <>
                                    <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" />
                                    <VStack gap="space-4">
                                        <HStack justify="space-between" align="start">
                                            <Box flexGrow="1">
                                                <Box asChild marginBlock="space-0 space-12">
                                                    <Heading level="2" size="small">
                                                        {sakstype === "OPPFOSTRINGSBIDRAG"
                                                            ? "Bidragspliktig"
                                                            : sakstype === "FARSKAP"
                                                              ? "Bidragsmottaker"
                                                              : "Part i saken"}
                                                    </Heading>
                                                </Box>
                                                <HStack align="start" gap="space-12">
                                                    <Box asChild marginBlock="space-4 space-0">
                                                        <PersonIcon
                                                            aria-hidden
                                                            fontSize="1.5rem"
                                                            className="text-ax-brand-blue-600"
                                                        />
                                                    </Box>

                                                    <Box flexGrow="1">
                                                        <PersonInfo
                                                            ident={partISaken.ident}
                                                            navn={partISaken.visningsnavn}
                                                            fødselsdato={partISaken.fødselsdato ?? undefined}
                                                        />

                                                        {partISaken?.diskresjonskode && (
                                                            <Box marginBlock="space-8 space-0">
                                                                <DiskresjonAlert
                                                                    diskresjonskode={partISaken.diskresjonskode}
                                                                />
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </HStack>
                                            </Box>
                                            <Button variant="tertiary" size="small" onClick={endrePartISaken}>
                                                Endre part
                                            </Button>
                                        </HStack>

                                        {sakstype && sakstype !== "OPPFOSTRINGSBIDRAG" && sakstype !== "FARSKAP" && (
                                            <>
                                                <Box borderColor="neutral-subtleA" borderWidth="1 0 0 0" />
                                                <RolleVisning
                                                    partISaken={partISaken}
                                                    rolle={
                                                        getAutoAssignedRole(sakstype) ||
                                                        partISakenSkjemaData?.rolle ||
                                                        null
                                                    }
                                                    editable={requiresRoleSelection(sakstype)}
                                                />
                                            </>
                                        )}
                                    </VStack>
                                </>
                            )}
                        </VStack>
                    </Box>

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
