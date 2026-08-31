import { BEHANDLING_API_V1 } from "@bidrag/api";
import {
    type ForholdmessigFordelingDetaljerDto,
    type OpprettFFRequest,
    type OpprettFFRequestBarnDetaljer,
    type RolleDto,
    type SjekkForholdmessigFordelingResponse,
    Vedtakstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, BodyShort, Button, Dialog, Heading, HStack, Loader, VStack } from "@navikt/ds-react";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import {
    useGetBehandlingV2,
    useGetForholdsmessigFordelingDetaljer,
    useRefetchFFInfoFn,
} from "../../common/hooks/useApiData";
import useFeatureToogle from "../../common/hooks/useFeatureToggle";
import { useQueryParams } from "../../common/hooks/useQueryParams";
import { hentVisningsnavn } from "../../common/hooks/useVisningsnavn";
import environment from "../../environment.ts";
import { formatterBeløpForBeregning } from "../../utils/number-utils";
import { BarnListeOpprettFF } from "./BarnListe";
import { EgetTiltakNavBidragVarsel } from "./ForholdsmessigFordelingInfo";

export function OpprettForholdsmessigFordelingPanelContent({
    showButton = true,
    showAlert = true,
    isModal = true,
}: {
    showButton?: boolean;
    showAlert?: boolean;
    isModal?: boolean;
}) {
    const { forholdsmessigFordeling, roller, feilOppståttVedSisteGrunnlagsinnhenting, id, saksnummer } =
        useGetBehandlingV2();
    const { tilgangOppretteFF } = useFeatureToogle();
    const refetchFF = useRefetchFFInfoFn(true);
    const detaljer = useGetForholdsmessigFordelingDetaljer();
    const [manueltOverstyrteRevurderingsdatoer, setManueltOverstyrteRevurderingsdatoer] = useState<
        Record<string, string | undefined>
    >({});
    const harRevurderingssoknader = detaljer.søknaderRevurdering.length > 0;
    const revurderingssøknaderErDelAvFF = detaljer.søknaderRevurdering.some((s) => s.erDelAvFF);
    const kanOppretteFF = tilgangOppretteFF && !harRevurderingssoknader;
    const enhet = useQueryParams().get("enhet");
    const behandlesAvAnnenEnhet = enhet !== detaljer.skalBehandlesAvEnhet;

    const opprettFFFn = useMutation({
        retry: false,
        mutationFn: () => {
            const detaljerBarn = Object.entries(manueltOverstyrteRevurderingsdatoer)
                .filter(([, manueltOverstyrtRevurderingFraDato]) => !!manueltOverstyrtRevurderingFraDato)
                .map(
                    ([key, manueltOverstyrtRevurderingFraDato]) =>
                        ({
                            ident: key.split("|")[0],
                            stønadstype: key.split("|")[1],
                            manueltOverstyrtRevurderingFraDato: manueltOverstyrtRevurderingFraDato as string,
                        }) as OpprettFFRequestBarnDetaljer,
                );

            const requestBody: OpprettFFRequest = {
                detaljerBarn: detaljerBarn,
                opprettetAvEnhet: enhet,
            } as unknown as OpprettFFRequest;

            return BEHANDLING_API_V1.api.opprettForholdsmessigFordeling(id, requestBody);
        },
        onSuccess: () => {
            if (behandlesAvAnnenEnhet) {
                window.location.href = `${environment.url.bisysSakshistorikk}?saksnr=${saksnummer}`;
            } else {
                refetchFF();
            }
        },
    });

    const harOpprettetFF = forholdsmessigFordeling !== undefined;
    const harBarnMedSak = detaljer.barn.some((b) => b.saksnr !== undefined);
    const beløpshistorikkInnhentingFeilet = feilOppståttVedSisteGrunnlagsinnhenting?.some((f) =>
        f.grunnlagsdatatype.toLowerCase().startsWith("beløpshistorikk"),
    );

    function handleOpprett() {
        opprettFFFn.mutate();
    }

    return (
        <>
            <VStack gap="space-2" className="w-[650px] overflow-auto">
                {<BodyShort size="small">{alertTekst(detaljer, forholdsmessigFordeling, roller, showAlert)}</BodyShort>}
                {simulertBeregning(detaljer, roller, isModal)}
                {beløpshistorikkInnhentingFeilet && (
                    <Alert variant="warning" size="small">
                        <Heading size="xsmall">Innhenting av beløpshistorikk feilet</Heading>
                        <BodyShort size="small">
                            Innhenting av beløpshistorikk har feilet for minst ett barn. Det kan føre til at beregningen
                            av forholdsmessig fordeling ikke er korrekt.
                        </BodyShort>
                    </Alert>
                )}

                {opprettFFFn.isError && (
                    <Alert variant="error" size="small">
                        Noe gikk galt ved oppretting av forholdsmessig fordeling. Vennligst prøv på nytt
                    </Alert>
                )}
                {harRevurderingssoknader && (
                    <Alert variant="warning" size="small">
                        <Heading size="xsmall">
                            {revurderingssøknaderErDelAvFF
                                ? "Forholdsmessig fordeling er utløst av gammel løsning"
                                : "Det finnes åpne revurderingssøknader"}
                        </Heading>
                        <BodyShort size="small">
                            {revurderingssøknaderErDelAvFF
                                ? "Forholdsmessig fordeling i ny løsning kan ikke opprettes når FF tidligere er utløst av gammel løsning. Automatisk revurderingsoppgave må derfor feilregistreres før behandling i ny løsning kan begynne."
                                : "Sjekk hva revurderingssøknadene gjelder. Forholdsmessig fordeling kan ikke opprettes før søknadene er manuelt avsluttet."}
                        </BodyShort>
                    </Alert>
                )}
                <EgetTiltakNavBidragVarsel barn={detaljer.barn} />
                <BarnListeOpprettFF
                    barn={detaljer.barn}
                    skalBehandlesAvEnhet={detaljer.skalBehandlesAvEnhet}
                    manueltOverstyrteRevurderingsdatoer={manueltOverstyrteRevurderingsdatoer}
                    onManueltOverstyrtRevurderingsdatoChange={(ident, dato) => {
                        setManueltOverstyrteRevurderingsdatoer((current) => ({
                            ...current,
                            [ident]: dato,
                        }));
                    }}
                />
            </VStack>

            {showButton && harBarnMedSak && (
                <Dialog.Footer>
                    <HStack
                        gap="space-2"
                        justify="end"
                        className="pt-2 border-t border-[var(--ax-border-neutral-subtle)]"
                    >
                        <Button
                            size="small"
                            variant="primary"
                            disabled={!kanOppretteFF}
                            onClick={handleOpprett}
                            loading={opprettFFFn.isPending}
                        >
                            {!kanOppretteFF
                                ? "Opprett FF er deaktivert"
                                : harOpprettetFF
                                  ? "Oppdater"
                                  : behandlesAvAnnenEnhet
                                    ? "Opprett og gå tilbake til sakshistorikk"
                                    : "Opprett"}
                        </Button>
                    </HStack>
                </Dialog.Footer>
            )}
        </>
    );
}

export default function OpprettForholdsmessigFordelingPrompt() {
    const { forholdsmessigFordeling, roller, vedtakstype } = useGetBehandlingV2();
    const { tilgangOppretteFF } = useFeatureToogle();
    const detaljer = useGetForholdsmessigFordelingDetaljer();
    const [modalOpen, setModalOpen] = useState(false);

    const kanOppretteFF = ![Vedtakstype.INNKREVING, Vedtakstype.ALDERSJUSTERING, Vedtakstype.OPPHOR].includes(
        vedtakstype,
    );
    if (!kanOppretteFF) return null;
    if (!tilgangOppretteFF || detaljer.kanOppretteForholdsmessigFordeling === false) return null;

    const harOpprettetFF = forholdsmessigFordeling !== undefined;

    return (
        <>
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <Dialog.Popup className="w-fit" position="center">
                    <Dialog.Header>
                        {harOpprettetFF ? "Oppdater forholdsmessig fordeling" : "Opprett forholdsmessig fordeling"}
                    </Dialog.Header>

                    <Dialog.Body className="min-w-[700px]">
                        <React.Suspense fallback={<Loader size="medium" />}>
                            <OpprettForholdsmessigFordelingPanelContent showAlert={false} />
                        </React.Suspense>
                    </Dialog.Body>
                </Dialog.Popup>
            </Dialog>
            <Alert
                size="small"
                className="ax-lg:max-w-saksbehandling-inner ax-md:max-w-saksbehandling-inner-md ax-sm:max-w-saksbehandling-inner-sm mb-2"
                variant={harOpprettetFF || detaljer.måOppretteForholdsmessigFordeling ? "warning" : "info"}
            >
                <Heading size="xsmall">Forholdsmessig fordeling</Heading>
                <VStack gap="space-12">
                    <div>
                        {alertTekst(detaljer, forholdsmessigFordeling, roller)}
                        {simulertBeregning(detaljer, roller)}
                    </div>
                    <Button
                        size="xsmall"
                        className="self-start m-0 ml-[-8px]"
                        variant={"secondary"}
                        onClick={() => setModalOpen(true)}
                    >
                        Vis detaljer
                    </Button>
                </VStack>
            </Alert>
        </>
    );
}

function alertTekst(
    detaljer: SjekkForholdmessigFordelingResponse,
    forholdsmessigFordeling: ForholdmessigFordelingDetaljerDto,
    roller: RolleDto[],
    showAlert = true,
) {
    const harOpprettetFF = forholdsmessigFordeling !== undefined;
    const alleBarnErISøknaden = detaljer.barn.every((b) => roller.some((rb) => rb.ident === b.ident));
    const minstEnAnnenBarHarLøpendeBidrag = detaljer.barn.some((b) => b.harLøpendeBidrag);
    const minstEnAnnenBarnHarPrivatAvtale = detaljer.barn.some((b) => b.privateAvtale !== undefined);
    let message = "Det kan hende bidraget må forholdsmessig fordeles";
    if (detaljer.måOppretteForholdsmessigFordeling) {
        message = "Bidraget må forholdsmessig fordeles på grunn av manglende evne i minst en av periodene.";
    }
    if (harOpprettetFF) {
        return `BP har andre barn/saker som ikke er del av behandlingen. ${showAlert ? "Se detaljer for hvilken barn/saker det gjelder" : ""}`;
    }
    if (alleBarnErISøknaden) {
        return `Minst ett søknadsbarn har løpende bidrag fra eldste virkningstidspunkt. ${message}`;
    }
    if (!minstEnAnnenBarHarLøpendeBidrag && minstEnAnnenBarnHarPrivatAvtale) {
        return `Det er opprettet private avtale for minst en annen barn. ${message}`;
    }
    if (!minstEnAnnenBarHarLøpendeBidrag) {
        return `Det finnes åpne behandlinger for andre barn i samme eller annen sak til bidragspliktig. ${message}`;
    }
    return `Bidragspliktig har andre barn/saker utenfor søknaden med løpende bidrag. ${message}`;
}

function simulertBeregning(detaljer: SjekkForholdmessigFordelingResponse, roller: RolleDto[], showWarning = false) {
    if (detaljer.simulertGrunnlag && detaljer.simulertGrunnlag.length > 0) {
        const tilRolletype = (ident: string) => roller.find((r) => r.ident === ident)?.rolletype;
        const content = (
            <BodyShort size="small" className="whitespace-pre-line">
                Beregningen er basert på antatte inntekter (fordi ingen inntektsperioder er valgt):
                {detaljer.simulertGrunnlag.map((g) => (
                    <div key={g.gjelder}>
                        <strong>{tilRolletype(g.gjelder)}</strong>: {hentVisningsnavn(g.inntektstype)} med beløp{" "}
                        {formatterBeløpForBeregning(g.beløp)}
                    </div>
                ))}
            </BodyShort>
        );

        if (showWarning) {
            return (
                <Alert variant="info" size="small" inline className="pb-2">
                    {content}
                </Alert>
            );
        }
        return content;
    }
    return null;
}
