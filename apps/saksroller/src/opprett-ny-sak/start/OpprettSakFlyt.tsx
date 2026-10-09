import type { PersonDto } from "@bidrag/api/PersonApi";
import { Box, Heading, VStack } from "@navikt/ds-react";
import { useState } from "react";
import NullstillDialog from "../skjema/NullstillDialog";
import OpprettSakSkjema from "../skjema/OpprettSakSkjema";
import {
    type OpprettSakStart,
    type OpprettSakstype,
    type Sakskategori,
    useErOppretterSak,
} from "../skjema/OpprettSakStartContext";
import type { PartRolle } from "../skjema/opprett-sak-schema";
import SakskategoriVelger from "../skjema/SakskategoriVelger";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "../skjema/SkjemaSeksjon";
import SakstypeVelger from "./SakstypeVelger";
import StartpartVelger from "./StartpartVelger";

/** Siden for å opprette ny sak: velg sakstype, søk opp en person og fyll ut skjemaet. */
export default function OpprettSakFlyt() {
    const [sakstype, setSakstype] = useState<OpprettSakstype>("BARNEBIDRAG");
    const [start, setStart] = useState<(OpprettSakStart & { versjon: number }) | null>(null);
    const [kategori, setKategori] = useState<Sakskategori>("Nasjonal");
    const [ventendeSakstype, setVentendeSakstype] = useState<OpprettSakstype | null>(null);
    const oppretter = useErOppretterSak();

    const byttSakstype = (type: OpprettSakstype) => {
        setVentendeSakstype(null);
        setStart(null);
        setSakstype(type);
    };

    const velgSakstype = (type: OpprettSakstype) => {
        if (type === sakstype || oppretter) return;
        if (start) setVentendeSakstype(type);
        else byttSakstype(type);
    };

    const startSkjema = (person: PersonDto, rolle: PartRolle) =>
        setStart((forrige) => ({ person, rolle, sakstype, versjon: (forrige?.versjon ?? 0) + 1 }));

    return (
        <Box maxWidth="80rem" marginInline="auto" paddingBlock="space-32" paddingInline="space-16">
            <VStack gap="space-24">
                <Heading level="1" size="large">
                    Opprett ny sak
                </Heading>
                <SkjemaSeksjon tittel="Type sak">
                    <SkjemaSeksjonKort>
                        <VStack gap="space-16">
                            <SakstypeVelger value={sakstype} onVelg={velgSakstype} />
                            <SakskategoriVelger value={kategori} onChange={(ny) => !oppretter && setKategori(ny)} />
                        </VStack>
                    </SkjemaSeksjonKort>
                </SkjemaSeksjon>
                <StartpartVelger key={sakstype} sakstype={sakstype} harSkjema={!!start} onValgt={startSkjema} />
                <NullstillDialog
                    open={!!ventendeSakstype}
                    onOpenChange={(open) => !open && setVentendeSakstype(null)}
                    beskrivelse="Skjemaet nullstilles når du bytter sakstype."
                    onBekreft={() => ventendeSakstype && byttSakstype(ventendeSakstype)}
                />
                {start && <OpprettSakSkjema key={start.versjon} start={start} kategori={kategori} />}
            </VStack>
        </Box>
    );
}
