import { BEHANDLING_API_V1 } from "@bidrag/api";
import {
    Behandlingstype,
    type ForholdsmessigFordelingBarnDto,
    type OppdaterRevurderingsdatoBarn,
    SoktAvType,
} from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, Button, Dialog, Heading, HStack, Loader, LocalAlert, VStack } from "@navikt/ds-react";
import { useMutation } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { BehandlingAlert } from "../../common/components/BehandlingAlert.tsx";
import { useGetBehandlingV2, useRefetchFFInfoFn } from "../../common/hooks/useApiData";
import useFeatureToogle from "../../common/hooks/useFeatureToggle";
import { type EndretRevurderingsdato, kanEndreRevurderingsdato } from "./BarnDetaljer";
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
    const [endredeRevurderingsdatoer, setEndredeRevurderingsdatoer] = useState<EndretRevurderingsdato[]>([]);

    const oppdaterRevurderingsdatoFn = useMutation({
        retry: false,
        mutationFn: () => {
            try {
                const barn = endredeRevurderingsdatoer.map(
                    (endret) =>
                        ({
                            ident: endret.ident,
                            stønadstype: endret.stønadstype,
                            nyRevurderingsdato: endret.dato,
                        }) satisfies OppdaterRevurderingsdatoBarn,
                );
                return BEHANDLING_API_V1.api.oppdaterRevurderingsdato(id, { barn });
            } catch (e) {
                console.error(e);
            }
        },
        onSuccess: () => {
            setEndredeRevurderingsdatoer([]);
            refetchFF();
        },
    });

    if (!forholdsmessigFordeling) return null;

    const erLesemodusVedtak = lesemodus?.fattetTidspunkt !== undefined;
    const kanEndreRevurderingsdatoer =
        tilgangOppretteFF && !lesemodus && forholdsmessigFordeling.barn.some(kanEndreRevurderingsdato);
    const harEndringer = endredeRevurderingsdatoer.length > 0;

    function handleOpenChange(open: boolean) {
        setModalOpen(open);
        if (!open) {
            setEndredeRevurderingsdatoer([]);
            oppdaterRevurderingsdatoFn.reset();
        }
    }

    function oppdaterRevurderingsdato(barn: ForholdsmessigFordelingBarnDto, nyDato?: string) {
        setEndredeRevurderingsdatoer((current) => {
            const andreBarn = current.filter(
                (endret) => endret.ident !== barn.ident || endret.stønadstype !== barn.stønadstype,
            );
            return nyDato
                ? [...andreBarn, { ident: barn.ident, stønadstype: barn.stønadstype, dato: nyDato }]
                : andreBarn;
        });
    }

    return (
        <>
            <Dialog open={modalOpen} onOpenChange={handleOpenChange} aria-label="Forholdsmessig fordeling detaljer">
                <Dialog.Popup className="w-fit" position="center">
                    <Dialog.Header>Forholdsmessig fordeling detaljer</Dialog.Header>
                    <Dialog.Body className="min-w-[700px]">
                        <VStack gap="space-2">
                            {oppdaterRevurderingsdatoFn.isError && (
                                <LocalAlert status="error" size="small">
                                    Noe gikk galt ved oppdatering av revurderingsdato. Vennligst prøv på nytt
                                </LocalAlert>
                            )}
                            <Suspense fallback={<Loader size="medium" />}>
                                <BarnListe
                                    barn={forholdsmessigFordeling.barn}
                                    endredeRevurderingsdatoer={endredeRevurderingsdatoer}
                                    onRevurderingsdatoChange={
                                        kanEndreRevurderingsdatoer ? oppdaterRevurderingsdato : undefined
                                    }
                                />
                            </Suspense>
                        </VStack>
                    </Dialog.Body>
                    {kanEndreRevurderingsdatoer && (
                        <Dialog.Footer>
                            <VStack gap="space-8" className="pt-2 border-t border-[var(--ax-border-neutral-subtle)]">
                                {harEndringer && (
                                    <BehandlingAlert variant="warning">
                                        Virkningstidspunkt er endret, dette kan påvirke beregningen. <br /> Inntekter og
                                        boforhold må vurderes på nytt. Vurder også om det må varsles på nytt.
                                    </BehandlingAlert>
                                )}
                                <HStack gap="space-2" justify="end">
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
                            </VStack>
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
