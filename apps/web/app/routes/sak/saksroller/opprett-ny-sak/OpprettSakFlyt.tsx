import type { PersonDto } from "@bidrag/api/PersonApi";
import { beregnAlderForPerson } from "@bidrag/utils/personUtils";
import { BodyLong, Box, Heading, HGrid, InlineMessage, Loader, VStack } from "@navikt/ds-react";
import { type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { useHentPersoninformasjon } from "~/api/useApi.ts";
import LasterSkeleton from "./components/LasterSkeleton";
import NullstillDialog from "./felles/NullstillDialog";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "./felles/SkjemaSeksjon";
import BarnebidragFlyt from "./flyt/Barnebidrag/BarnebidragFlyt";
import EktefellebidragFlyt from "./flyt/Ektefellebidrag/EktefellebidragFlyt";
import EnPartMedBarnFlyt from "./flyt/EnPartMedBarn/EnPartMedBarnFlyt";
import { tilPartRolle } from "./inngang";
import SakskategoriVelger from "./SakskategoriVelger";
import SakstypeVelger from "./SakstypeVelger";
import StartpartVelger from "./StartpartVelger";
import { type Sakstype, useSaksrolleroversikt } from "./saksrolleroversiktContext";

const flytkomponenter = {
    BARNEBIDRAG: BarnebidragFlyt,
    EKTEFELLEBIDRAG: EktefellebidragFlyt,
    FARSKAP: EnPartMedBarnFlyt,
    OPPFOSTRINGSBIDRAG: EnPartMedBarnFlyt,
} as const;

export default function OpprettSakFlyt({ visning = "side" }: { visning?: "side" | "modal" }) {
    const {
        partISaken,
        valgVersjon,
        sakstype,
        sakskategori,
        velgKategori,
        isLoadingOpprettSak,
        velgSakstype: settSakstypeOgNullstill,
    } = useSaksrolleroversikt();
    const [forhåndsvalgt, setForhåndsvalgt] = useState<PersonDto | null>(null);
    const [ventendeBytte, setVentendeBytte] = useState<{ beskrivelse: string; utfør: () => void } | null>(null);

    const byttMedBekreftelse = (beskrivelse: string, bytt: () => void) => {
        const utfør = () => {
            setForhåndsvalgt(null);
            setVentendeBytte(null);
            bytt();
        };
        if (partISaken) setVentendeBytte({ beskrivelse, utfør });
        else utfør();
    };

    const velgSakstype = (type: Sakstype) => {
        if (type === sakstype || isLoadingOpprettSak) return;
        byttMedBekreftelse("Skjemaet nullstilles når du bytter sakstype.", () => settSakstypeOgNullstill(type));
    };

    const velgSakskategori = (kategori: typeof sakskategori) => {
        if (kategori === sakskategori || isLoadingOpprettSak) return;
        byttMedBekreftelse("Skjemaet nullstilles når du bytter kategori.", () => velgKategori(kategori));
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
                <NullstillDialog
                    open={!!ventendeBytte}
                    onOpenChange={(open) => !open && setVentendeBytte(null)}
                    beskrivelse={ventendeBytte?.beskrivelse ?? ""}
                    onBekreft={() => ventendeBytte?.utfør()}
                />

                <Forhåndsutfylling onUtenRolle={setForhåndsvalgt} />
                {sakstype && (
                    <StartpartVelger
                        key={`${sakstype}-${sakskategori}-${forhåndsvalgt?.ident}`}
                        sakstype={sakstype}
                        forhåndsvalgt={forhåndsvalgt}
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

/** Personen kalleren åpnet flyten for. Med kjent rolle bekreftes den direkte, ellers må saksbehandleren velge rolle. */
function Forhåndsutfylling({ onUtenRolle }: { onUtenRolle: (person: PersonDto) => void }) {
    const { inngang, bekreftStart } = useSaksrolleroversikt();
    const { data: person, error } = useHentPersoninformasjon(inngang ? { ident: inngang.ident } : null);
    const utført = useRef(false);
    const handlinger = useRef({ onUtenRolle, bekreftStart });
    handlinger.current = { onUtenRolle, bekreftStart };

    useEffect(() => {
        if (!person || utført.current) return;
        utført.current = true;
        const rolle = tilPartRolle(inngang?.rolle, beregnAlderForPerson(person));
        if (rolle) handlinger.current.bekreftStart(person, rolle);
        else handlinger.current.onUtenRolle(person);
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
