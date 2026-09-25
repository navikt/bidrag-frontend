import { BodyLong, Box, Loader, VStack } from "@navikt/ds-react";
import { type ComponentProps, Suspense } from "react";
import BarnebidragFlyt from "../flyt/Barnebidrag/BarnebidragFlyt";
import EktefellebidragFlyt from "../flyt/Ektefellebidrag/EktefellebidragFlyt";
import EnPartMedBarnFlyt from "../flyt/EnPartMedBarn/EnPartMedBarnFlyt";
import LasterSkeleton from "./LasterSkeleton";
import { SaksrolleroversiktProvider, useErOppretterSak } from "./saksrolleroversiktContext";

const flytkomponenter = {
    BARNEBIDRAG: BarnebidragFlyt,
    EKTEFELLEBIDRAG: EktefellebidragFlyt,
    FARSKAP: EnPartMedBarnFlyt,
    OPPFOSTRINGSBIDRAG: EnPartMedBarnFlyt,
} as const;

/**
 * Skjemaet for valgt sakstype, fylt ut fra startpersonen. Brukes både på siden og i modalen.
 * Gi ny `key` for å starte skjemaet på nytt.
 */
export default function OpprettSakSkjema(props: Omit<ComponentProps<typeof SaksrolleroversiktProvider>, "children">) {
    const FlytKomponent = flytkomponenter[props.start.sakstype];
    const oppretter = useErOppretterSak();

    return (
        <SaksrolleroversiktProvider {...props}>
            {oppretter && <OppretterSak />}
            <Suspense fallback={<LasterSkeleton tekst="Laster data..." />}>
                <FlytKomponent />
            </Suspense>
        </SaksrolleroversiktProvider>
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
