import { BEHANDLING_API_V1 } from "@bidrag/api";
import {
    Behandlingstype,
    type ForholdsmessigFordelingBarnDto,
    type OppdaterRevurderingsdatoBarn,
    SoktAvType,
    type Stonadstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, Button, Dialog, Heading, HStack, VStack } from "@navikt/ds-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useGetBehandlingV2, useRefetchFFInfoFn } from "../../common/hooks/useApiData";
import useFeatureToogle from "../../common/hooks/useFeatureToggle";
import { kanEndreRevurderingsdato } from "./BarnDetaljer";
import { BarnListe } from "./BarnListe";
export function harÅpenEgetTiltakUtenInnkreving(barn: ForholdsmessigFordelingBarnDto[]) {
    return barn.some((b) =>
        b.åpneBehandlinger.some(
            (behandling) =>
                behandling.behandlingstype === Behandlingstype.EGET_TILTAK &&
                behandling.søktAvType === SoktAvType.NAV_BIDRAG &&
                !behandling.medInnkreving,
        ),
    );
}

export function EgetTiltakNavBidragVarsel({ barn }: { barn: ForholdsmessigFordelingBarnDto[] }) {
    if (!harÅpenEgetTiltakUtenInnkreving(barn)) return null;
    return (
        <Alert
            size="small"
            variant="warning"
            className="ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm"
        >
            <Heading size="xsmall">{"Åpne behandlinger med eget tiltak u/innkreving"}</Heading>
            Det finnes åpne behandlinger med eget tiltak u/innkreving. Denne vil inngå i behandling av FF. Hvis det
            gjelder tilbakekreving så må søknaden avsluttes og behandles etter FF vedtaket er fattet.
        </Alert>
    );
}
export default function ForholdsmessigFordelingInfo() {
    const { forholdsmessigFordeling, lesemodus, id } = useGetBehandlingV2();
    const { tilgangOppretteFF } = useFeatureToogle();
    const refetchFF = useRefetchFFInfoFn(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [endredeRevurderingsdatoer, setEndredeRevurderingsdatoer] = useState<Record<string, string | undefined>>({});

    const oppdaterRevurderingsdatoFn = useMutation({
        retry: false,
        mutationFn: () => {
            try {
                const barn = Object.entries(endredeRevurderingsdatoer)
                    .filter(([, dato]) => !!dato)
                    .map(([nøkkel, dato]) => {
                        const [ident, stønadstype] = nøkkel.split("|");
                        return {
                            ident,
                            stønadstype: stønadstype as Stonadstype,
                            revurderingFraDato: dato as string,
                        } satisfies OppdaterRevurderingsdatoBarn;
                    });
                return BEHANDLING_API_V1.api.oppdaterRevurderingsdato(id, { barn });
            } catch (e) {
                console.error(e);
            }
        },
        onSuccess: () => {
            setEndredeRevurderingsdatoer({});
            refetchFF();
        },
    });

    if (!forholdsmessigFordeling) return null;

    const erLesemodusVedtak = lesemodus?.fattetTidspunkt !== undefined;
    const kanEndreRevurderingsdatoer =
        tilgangOppretteFF && !lesemodus && forholdsmessigFordeling.barn.some(kanEndreRevurderingsdato);
    const harEndringer = Object.values(endredeRevurderingsdatoer).some((dato) => !!dato);

    function handleOpenChange(open: boolean) {
        setModalOpen(open);
        if (!open) {
            setEndredeRevurderingsdatoer({});
            oppdaterRevurderingsdatoFn.reset();
        }
    }
    return (
        <>
            <Dialog open={modalOpen} onOpenChange={handleOpenChange} aria-label="Forholdsmessig fordeling detaljer">
                <Dialog.Popup className="w-fit" position="center">
                    <Dialog.Header>Forholdsmessig fordeling detaljer</Dialog.Header>
                    <Dialog.Body className="min-w-[700px]">
                        <VStack gap="space-2">
                            {oppdaterRevurderingsdatoFn.isError && (
                                <Alert variant="error" size="small">
                                    Noe gikk galt ved oppdatering av revurderingsdato. Vennligst prøv på nytt
                                </Alert>
                            )}
                            <BarnListe
                                barn={forholdsmessigFordeling.barn}
                                endredeRevurderingsdatoer={endredeRevurderingsdatoer}
                                onRevurderingsdatoChange={
                                    kanEndreRevurderingsdatoer
                                        ? (nøkkel, dato) =>
                                              setEndredeRevurderingsdatoer((current) => ({
                                                  ...current,
                                                  [nøkkel]: dato,
                                              }))
                                        : undefined
                                }
                            />
                        </VStack>
                    </Dialog.Body>
                    {kanEndreRevurderingsdatoer && (
                        <Dialog.Footer>
                            <HStack
                                gap="space-2"
                                justify="end"
                                className="pt-2 border-t border-[var(--ax-border-neutral-subtle)]"
                            >
                                <Button
                                    size="small"
                                    variant="primary"
                                    disabled={!harEndringer}
                                    onClick={() => oppdaterRevurderingsdatoFn.mutate()}
                                    loading={oppdaterRevurderingsdatoFn.isPending}
                                >
                                    Oppdater revurderingsdato
                                </Button>
                            </HStack>
                        </Dialog.Footer>
                    )}
                </Dialog.Popup>
            </Dialog>
            <Alert
                size="small"
                variant="info"
                className="ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm"
            >
                <Heading size="xsmall">
                    {erLesemodusVedtak ? "Forholdsmessig fordeling" : "Forholdsmessig fordeling opprettet"}
                </Heading>
                <VStack gap="space-12">
                    <div>
                        {erLesemodusVedtak
                            ? "Forholdsmessig fordeling var opprettet for vedtak. Se detaljer om hvilken barn/BM og saker FF er del av."
                            : "Forholdsmessig fordeling er opprettet for behandling. Se detaljer om hvilken barn/BM og saker FF er del av."}
                    </div>
                    <HStack gap="space-16">
                        <Button size="xsmall" variant="secondary-neutral" onClick={() => setModalOpen(true)}>
                            Vis detaljer
                        </Button>
                    </HStack>
                </VStack>
            </Alert>
        </>
    );
}
