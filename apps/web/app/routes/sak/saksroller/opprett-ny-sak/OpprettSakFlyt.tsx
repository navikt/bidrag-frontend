import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils/personUtils";
import { PersonIcon } from "@navikt/aksel-icons";
import { BodyLong, Box, Button, Heading, Loader, VStack } from "@navikt/ds-react";
import { Suspense, useMemo, useRef, useState } from "react";
import DiskresjonAlert from "../components/DiskresjonAlert";
import PersonInfo from "../components/PersonInfo";
import SøkPerson from "../components/SøkPerson";
import LasterSkeleton from "./components/LasterSkeleton";
import BarnBeggeForeldreFlyt from "./flyt/BarnBeggeForeldreFlyt";
import BarnMedManglendeForeldreFlyt from "./flyt/BarnMedManglendeForeldreFlyt";
import EktefellebidragFlyt from "./flyt/EktefellebidragFlyt";
import FarskapsFlyt from "./flyt/FarskapsFlyt";
import ForelderMedBarnFlyt from "./flyt/ForelderMedBarnFlyt";
import ForelderUtenBarnFlyt from "./flyt/ForelderUtenBarnFlyt";
import OppfostringsbidragFlyt from "./flyt/OppfostringsbidragFlyt";
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
        <div className="max-w-4xl mx-auto">
            <div className="min-h-screen bg-ax-neutral-100 py-8 px-4">
                <VStack gap="space-12">
                    {isLoadingOpprettSak && (
                        <div
                            className="fixed inset-0 bg-[white]/70 backdrop-blur-sm z-50 flex items-center justify-center"
                            role="status"
                            aria-live="polite"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <Loader size="2xlarge" title="Oppretter sak..." />
                                <BodyLong className="text-ax-neutral-800">Oppretter sak...</BodyLong>
                            </div>
                        </div>
                    )}

                    <Heading level="1" size="large">
                        Opprett ny sak
                    </Heading>

                    <Box as="div" background="default" borderRadius={"2"} padding="space-12">
                        <VStack gap="space-2">
                            {!sakstype && <SakstypeVelger onVelg={velgSakstype} />}

                            {sakstype && (
                                <VStack gap="space-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <Heading level="2" size="medium" className="mb-1">
                                                Sakstype
                                            </Heading>
                                            <BodyLong className="text-ax-neutral-1000 text-lg font-semibold">
                                                {sakstypeTilTekst(sakstype)}
                                            </BodyLong>
                                        </div>
                                        <Button variant="tertiary" size="small" onClick={endreSakstype}>
                                            Endre
                                        </Button>
                                    </div>

                                    <div className="border-t border-ax-neutral-300" />

                                    <SakskategoriVelger value={sakskategori} onChange={setSakskategori} />
                                </VStack>
                            )}

                            {sakstype && !partISaken && (
                                <>
                                    <div className="border-t border-ax-neutral-300" />
                                    <VStack gap="space-4">
                                        <div>
                                            <Heading level="2" size="medium" spacing>
                                                {sakstype === "OPPFOSTRINGSBIDRAG"
                                                    ? "Bidragspliktig"
                                                    : sakstype === "FARSKAP"
                                                      ? "Bidragsmottaker"
                                                      : "Part i saken"}
                                            </Heading>
                                            <BodyLong size="small" className="text-ax-neutral-700">
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
                                    <div className="border-t border-ax-neutral-300" />
                                    <VStack gap="space-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <Heading level="2" size="small" className="mb-3">
                                                    {sakstype === "OPPFOSTRINGSBIDRAG"
                                                        ? "Bidragspliktig"
                                                        : sakstype === "FARSKAP"
                                                          ? "Bidragsmottaker"
                                                          : "Part i saken"}
                                                </Heading>
                                                <div className="flex items-start gap-3">
                                                    <PersonIcon
                                                        aria-hidden
                                                        fontSize="1.5rem"
                                                        className="text-ax-brand-blue-600 mt-1"
                                                    />

                                                    <div className="flex-1">
                                                        <PersonInfo
                                                            ident={partISaken.ident}
                                                            navn={partISaken.visningsnavn}
                                                            fødselsdato={partISaken.fødselsdato ?? undefined}
                                                        />

                                                        {partISaken?.diskresjonskode && (
                                                            <div className="mt-2">
                                                                <DiskresjonAlert
                                                                    diskresjonskode={partISaken.diskresjonskode}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="tertiary" size="small" onClick={endrePartISaken}>
                                                Endre part
                                            </Button>
                                        </div>

                                        {sakstype && sakstype !== "OPPFOSTRINGSBIDRAG" && sakstype !== "FARSKAP" && (
                                            <>
                                                <div className="border-t border-ax-neutral-300" />
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
            </div>
        </div>
    );
}
