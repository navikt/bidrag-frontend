import { Box, Heading, HGrid, VStack } from "@navikt/ds-react";
import { useState } from "react";
import NullstillDialog from "../skjema/NullstillDialog";
import OpprettSakSkjema from "../skjema/OpprettSakSkjema";
import { type OpprettSakstype, type Sakskategori, useErOppretterSak } from "../skjema/OpprettSakStartContext";
import SakskategoriVelger from "../skjema/SakskategoriVelger";
import { SkjemaSeksjonKort } from "../skjema/SkjemaSeksjon";
import SakstypeVelger from "./SakstypeVelger";

/** Siden for å opprette ny sak med partsvalg og barn direkte i skjemaet. */
export default function OpprettSakFlyt() {
    const [sakstype, setSakstype] = useState<OpprettSakstype>("BARNEBIDRAG");
    const [harEndringer, setHarEndringer] = useState(false);
    const [kategori, setKategori] = useState<Sakskategori>("Nasjonal");
    const [ventendeSakstype, setVentendeSakstype] = useState<OpprettSakstype | null>(null);
    const oppretter = useErOppretterSak();

    const byttSakstype = (type: OpprettSakstype) => {
        setVentendeSakstype(null);
        setHarEndringer(false);
        setSakstype(type);
    };

    const velgSakstype = (type: OpprettSakstype) => {
        if (type === sakstype || oppretter) return;
        if (harEndringer) setVentendeSakstype(type);
        else byttSakstype(type);
    };

    return (
        <Box maxWidth="80rem" marginInline="auto" paddingBlock="space-32" paddingInline="space-16">
            <VStack gap="space-24">
                <Heading level="1" size="large">
                    Opprett ny sak
                </Heading>
                <Box background="sunken" borderRadius="12" padding="space-12">
                    <HGrid columns={{ xs: 1, sm: 2 }} gap="space-16">
                        <SkjemaSeksjonKort>
                            <SakstypeVelger value={sakstype} onVelg={velgSakstype} />
                        </SkjemaSeksjonKort>
                        <SkjemaSeksjonKort>
                            <SakskategoriVelger value={kategori} onChange={(ny) => !oppretter && setKategori(ny)} />
                        </SkjemaSeksjonKort>
                    </HGrid>
                </Box>
                <NullstillDialog
                    open={!!ventendeSakstype}
                    onOpenChange={(open) => !open && setVentendeSakstype(null)}
                    beskrivelse="Skjemaet nullstilles når du bytter sakstype."
                    onBekreft={() => ventendeSakstype && byttSakstype(ventendeSakstype)}
                />
                <OpprettSakSkjema key={sakstype} start={{ sakstype }} kategori={kategori} onEndret={setHarEndringer} />
            </VStack>
        </Box>
    );
}
