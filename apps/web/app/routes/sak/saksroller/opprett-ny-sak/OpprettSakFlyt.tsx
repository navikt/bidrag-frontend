import type { PersonDto } from "@bidrag/api/PersonApi";
import { BodyLong, Box, Heading, HStack, InlineMessage, Loader, VStack } from "@navikt/ds-react";
import { Suspense, useMemo, useState } from "react";
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
    const {
        valgtPerson: partISaken,
        valgVersjon,
        sakstype,
        sakskategori,
        velgKategori,
        saksrolleFlyt,
        isLoadingOpprettSak,
        velgPerson,
        velgSakstype: settSakstypeOgNullstill,
        velgRolle,
        settFlytHvisGjeldende,
        hentBarnkurver,
    } = useSaksrolleroversikt();
    const [barnkurvFeil, settBarnkurvFeil] = useState<{ versjon: number; tekst: string } | null>(null);

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

    const oppdaterFlytForSakstypeOgPart = (person: PersonDto, valgtSakstype: Sakstype | null) => {
        const autoRole = getAutoAssignedRole(valgtSakstype);

        if (!autoRole) {
            return;
        }

        const versjon = velgRolle(autoRole);

        if (valgtSakstype === "OPPFOSTRINGSBIDRAG" || valgtSakstype === "FARSKAP") {
            hentBarnkurver(person.ident)
                .then((barnkurver) => {
                    settFlytHvisGjeldende(versjon, {
                        key: Date.now(),
                        type: valgtSakstype,
                        barnkurver,
                    });
                })
                .catch(() => {
                    settBarnkurvFeil({
                        versjon,
                        tekst: "Kunne ikke hente forslag til barn. Du kan søke opp barn manuelt.",
                    });
                    settFlytHvisGjeldende(versjon, {
                        key: Date.now(),
                        type: valgtSakstype,
                        barnkurver: [],
                    });
                });
        }
    };

    const velgSakstype = (type: Sakstype) => {
        if (type === sakstype || isLoadingOpprettSak) {
            return;
        }

        settSakstypeOgNullstill(type);
    };

    const leggTilPartISaken = (person: PersonDto) => {
        if (!sakstype || isLoadingOpprettSak) return;
        velgPerson(person);
        oppdaterFlytForSakstypeOgPart(person, sakstype);
    };

    const velgSakskategori = (kategori: typeof sakskategori) => {
        if (kategori === sakskategori || isLoadingOpprettSak) return;
        velgKategori(kategori);
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

                    <VStack gap="space-24" aria-busy={isLoadingOpprettSak}>
                        <SkjemaSeksjon tittel="Type sak">
                            <SkjemaSeksjonKort>
                                <SakstypeVelger value={sakstype} onVelg={velgSakstype} />
                            </SkjemaSeksjonKort>
                            <SkjemaSeksjonKort>
                                <SakskategoriVelger value={sakskategori} onChange={velgSakskategori} />
                            </SkjemaSeksjonKort>
                        </SkjemaSeksjon>

                        {sakstype && (
                            <SkjemaSeksjon
                                tittel={partSeksjonTittel(sakstype)}
                                beskrivelse={sakstypeTilBeskrivelse(sakstype)}
                            >
                                <SkjemaSeksjonKort>
                                    <SøkPerson
                                        key={`${sakstype}-${sakskategori}`}
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
                        <>
                            {barnkurvFeil?.versjon === valgVersjon && (
                                <InlineMessage status="warning">{barnkurvFeil.tekst}</InlineMessage>
                            )}
                            <Suspense fallback={<LasterSkeleton tekst="Laster data..." />}>
                                {!!saksrolleFlyt && FlytKomponent && <FlytKomponent key={saksrolleFlyt.key} />}
                            </Suspense>
                        </>
                    )}
                </VStack>
            </Box>
        </Box>
    );
}
