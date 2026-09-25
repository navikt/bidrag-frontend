import type { PersonDto } from "@bidrag/api/PersonApi";
import { Box, Heading, VStack } from "@navikt/ds-react";
import { useState } from "react";
import NullstillDialog from "../skjema/NullstillDialog";
import OpprettSakSkjema from "../skjema/OpprettSakSkjema";
import type { PartRolle } from "../skjema/opprett-sak-schema";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "../skjema/SkjemaSeksjon";
import { type OpprettSakStart, type Sakstype, useErOppretterSak } from "../skjema/saksrolleroversiktContext";
import SakstypeVelger from "./SakstypeVelger";
import StartpartVelger from "./StartpartVelger";

/** Siden for å opprette ny sak: velg sakstype, søk opp en person og fyll ut skjemaet. */
export default function OpprettSakFlyt() {
    const [sakstype, setSakstype] = useState<Sakstype>("BARNEBIDRAG");
    const [start, setStart] = useState<(OpprettSakStart & { versjon: number }) | null>(null);
    const [ventendeSakstype, setVentendeSakstype] = useState<Sakstype | null>(null);
    const oppretter = useErOppretterSak();

    const byttSakstype = (type: Sakstype) => {
        setVentendeSakstype(null);
        setStart(null);
        setSakstype(type);
    };

    const velgSakstype = (type: Sakstype) => {
        if (type === sakstype || oppretter) return;
        if (start) setVentendeSakstype(type);
        else byttSakstype(type);
    };

    const bekreftStart = (person: PersonDto, rolle: PartRolle) =>
        setStart((forrige) => ({ person, rolle, sakstype, versjon: (forrige?.versjon ?? 0) + 1 }));

    return (
        <Box maxWidth="80rem" marginInline="auto" paddingBlock="space-32" paddingInline="space-16">
            <VStack gap="space-24">
                <Heading level="1" size="large">
                    Opprett ny sak
                </Heading>
                <SkjemaSeksjon tittel="Type sak">
                    <SkjemaSeksjonKort>
                        <SakstypeVelger value={sakstype} onVelg={velgSakstype} />
                    </SkjemaSeksjonKort>
                </SkjemaSeksjon>
                <NullstillDialog
                    open={!!ventendeSakstype}
                    onOpenChange={(open) => !open && setVentendeSakstype(null)}
                    beskrivelse="Skjemaet nullstilles når du bytter sakstype."
                    onBekreft={() => ventendeSakstype && byttSakstype(ventendeSakstype)}
                />
                <StartpartVelger key={sakstype} sakstype={sakstype} harSkjema={!!start} onBekreft={bekreftStart} />
                {start && <OpprettSakSkjema key={start.versjon} start={start} />}
            </VStack>
        </Box>
    );
}
