import { BodyLong, Box, Loader, VStack } from "@navikt/ds-react";
import { type ComponentProps, Suspense } from "react";
import { RedigeringsvisningProvider } from "../../felles/RedigeringsRamme";
import BarnebidragFlyt from "../flyt/barnebidrag/BarnebidragFlyt";
import EktefellebidragFlyt from "../flyt/ektefellebidrag/EktefellebidragFlyt";
import EnPartMedBarnFlyt from "../flyt/en-part-med-barn/EnPartMedBarnFlyt";
import LasterSkeleton from "./LasterSkeleton";
import { OpprettSakStartProvider, useErOppretterSak } from "./OpprettSakStartContext";

const flytkomponenter = {
    BARNEBIDRAG: BarnebidragFlyt,
    EKTEFELLEBIDRAG: EktefellebidragFlyt,
    FARSKAP: EnPartMedBarnFlyt,
    OPPFOSTRINGSBIDRAG: EnPartMedBarnFlyt,
} as const;

/**
 * Skjemaet for valgt sakstype. Siden starter tom, mens modalen fylles ut fra startpersonen.
 * Gi ny `key` for å starte skjemaet på nytt.
 */
export default function OpprettSakSkjema(props: Omit<ComponentProps<typeof OpprettSakStartProvider>, "children">) {
    const FlytKomponent = flytkomponenter[props.start.sakstype];
    const oppretter = useErOppretterSak();

    return (
        <OpprettSakStartProvider {...props}>
            {oppretter && <OppretterSak />}
            <RedigeringsvisningProvider>
                <Suspense fallback={<LasterSkeleton tekst="Laster data..." />}>
                    <FlytKomponent />
                </Suspense>
            </RedigeringsvisningProvider>
        </OpprettSakStartProvider>
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
