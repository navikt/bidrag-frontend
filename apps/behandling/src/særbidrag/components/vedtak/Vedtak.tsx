import { Resultatkode } from "@bidrag/api/BidragBehandlingApiV1";
import { Accordion, Alert, BodyShort, Heading, HStack, VStack } from "@navikt/ds-react";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useEffect } from "react";
import { VedtakProvider } from "../../../barnebidrag/components/vedtak/VedtakCommon";
import { QueryErrorWrapper } from "../../../common/components/query-error-boundary/QueryErrorWrapper";
import { AdminButtons } from "../../../common/components/vedtak/AdminButtons";
import { FatteVedtakButtons } from "../../../common/components/vedtak/FatteVedtakButtons";
import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import VedtakWrapper from "../../../common/components/vedtak/VedtakWrapper";
import text from "../../../common/constants/texts";
import { useBehandlingProvider } from "../../../common/context/BehandlingContext";
import { QueryKeys, useGetBehandlingV2, useGetBeregningSærbidrag } from "../../../common/hooks/useApiData";
import { hentVisningsnavn } from "../../../common/hooks/useVisningsnavn";
import type { VedtakBeregningResult } from "../../../types/vedtakTypes";
import { formatterBeløp, formatterProsent } from "../../../utils/number-utils";
import { STEPS } from "../../constants/steps";
import { DetaljertBeregningSærbidrag } from "./DetaljertBeregningSærbidrag";
import { UtgifsposterTable } from "./UtgifstposterTable";

const Vedtak = () => {
    const { behandlingId, activeStep, lesemodus } = useBehandlingProvider();
    const { erVedtakFattet, kanBehandlesINyLøsning } = useGetBehandlingV2();
    const queryClient = useQueryClient();
    const beregnetSærbidrag = queryClient.getQueryData<VedtakBeregningResult>(QueryKeys.beregningSærbidrag());
    const isBeregningError = queryClient.getQueryState(QueryKeys.beregningSærbidrag())?.status === "error";

    useEffect(() => {
        queryClient.refetchQueries({ queryKey: QueryKeys.behandlingV2(behandlingId) });
        queryClient.resetQueries({ queryKey: QueryKeys.beregningSærbidrag() });
    }, [activeStep]);

    return (
        <VedtakProvider className="grid gap-y-4 m-auto w-[830px]">
            {erVedtakFattet && !lesemodus && <Alert variant="warning">Vedtak er fattet for behandling</Alert>}
            <Heading level="2" size="medium">
                {text.title.vedtak}
            </Heading>
            <VedtakResultat />

            {!beregnetSærbidrag?.feil && !lesemodus && (
                <FatteVedtakButtons isBeregningError={isBeregningError} disabled={!kanBehandlesINyLøsning} />
            )}
            <AdminButtons />
        </VedtakProvider>
    );
};

const VedtakResultat = () => {
    const { data: beregnetSærbidrag } = useGetBeregningSærbidrag();
    const { medInnkreving } = useGetBehandlingV2();

    function renderResultat() {
        if (beregnetSærbidrag.feil) return null;
        const erDirekteAvslag = beregnetSærbidrag.resultat?.erDirekteAvslag;
        const erAvslagSomInneholderUtgifter = [
            Resultatkode.GODKJENTBELOPERLAVEREENNFORSKUDDSSATS,
            Resultatkode.ALLE_UTGIFTER_ER_FORELDET,
        ].includes(beregnetSærbidrag.resultat?.resultatKode);
        const erBeregningeAvslag = beregnetSærbidrag.resultat?.resultatKode !== Resultatkode.SAeRBIDRAGINNVILGET;
        const resultat = beregnetSærbidrag.resultat;
        if (erDirekteAvslag) {
            return (
                <div>
                    <Heading size="small">Avslag</Heading>
                    <BodyShort size="small">
                        <dl className="bd_datadisplay">
                            <dt>Årsak</dt>
                            <dd>{hentVisningsnavn(resultat.resultatKode)}</dd>
                        </dl>
                    </BodyShort>
                </div>
            );
        }
        if (erAvslagSomInneholderUtgifter) {
            return (
                <div>
                    <Heading size="small">Avslag</Heading>
                    <VStack gap={"space-2"}>
                        <ResultatDescription
                            data={[
                                {
                                    label: "Årsak",
                                    value: hentVisningsnavn(resultat.resultatKode),
                                },
                                resultat.resultatKode === Resultatkode.GODKJENTBELOPERLAVEREENNFORSKUDDSSATS && {
                                    label: "Forskuddssats",
                                    value: formatterBeløp(resultat.forskuddssats, true),
                                },
                                {
                                    label: "Kravbeløp",
                                    value: formatterBeløp(resultat.beregning?.totalKravbeløp, true),
                                },
                                {
                                    label: "Godkjent beløp",
                                    value: formatterBeløp(resultat.beregning?.totalGodkjentBeløp, true),
                                },
                            ].filter((d) => d)}
                        />
                        <UtgifterLagtTilGrunnAccordion />
                    </VStack>
                </div>
            );
        }
        return (
            <div>
                {erBeregningeAvslag ? (
                    <Heading spacing size="small">
                        Avslag, {hentVisningsnavn(resultat.resultatKode).toLowerCase()}
                    </Heading>
                ) : (
                    <Heading spacing size="small">
                        Særbidrag innvilget
                    </Heading>
                )}
                <VStack gap={"space-2"} className="pt-2">
                    <HStack gap={"space-24"} style={{ width: "max-content" }}>
                        <ResultatDescription
                            title="Inntekter"
                            data={[
                                {
                                    label: "Inntekt BM",
                                    value: formatterBeløp(resultat.inntekter.inntektBM, true),
                                },
                                {
                                    label: "Inntekt BP",
                                    value: formatterBeløp(resultat.inntekter.inntektBP, true),
                                },
                                {
                                    label: "Inntekt BA",
                                    value: formatterBeløp(resultat.inntekter.inntektBarn, true),
                                },
                            ]}
                        />

                        <ResultatDescription
                            title="Boforhold"
                            data={[
                                {
                                    label: "Antall barn i husstanden",
                                    value: resultat.antallBarnIHusstanden,
                                },
                                {
                                    label: "Voksne i husstanden",
                                    value: resultat.voksenIHusstanden
                                        ? resultat.enesteVoksenIHusstandenErEgetBarn
                                            ? "Ja (barn over 18 år)"
                                            : "Ja"
                                        : "Nei",
                                },
                            ]}
                        />
                        <ResultatDescription
                            title="Beregning"
                            data={[
                                {
                                    label: "Kravbeløp",
                                    value: formatterBeløp(resultat.beregning?.totalKravbeløp, true),
                                },
                                {
                                    label: "Godkjent beløp",
                                    value: formatterBeløp(resultat.beregning?.totalGodkjentBeløp, true),
                                },
                                {
                                    label: "Maks godkjent beløp",
                                    value: formatterBeløp(resultat.maksGodkjentBeløp, true),
                                },
                                {
                                    label: "BP's andel",
                                    value: formatterProsent(resultat.bpsAndel?.endeligAndelFaktor),
                                },
                                {
                                    label: "BP har evne",
                                    value: resultat.bpHarEvne === false ? "Nei" : "Ja",
                                },

                                {
                                    label: "Resultat",
                                    value: erBeregningeAvslag ? "Avslag" : formatterBeløp(resultat.resultat, true),
                                },

                                {
                                    label: "Betalt av BP",
                                    value: formatterBeløp(resultat.beregning?.totalBeløpBetaltAvBp, true),
                                },
                                {
                                    label: medInnkreving ? "Beløp som innkreves" : "Fastsatt beløp å betale",
                                    value: erBeregningeAvslag
                                        ? "Avslag"
                                        : formatterBeløp(resultat.beløpSomInnkreves, true),
                                },
                            ].filter((d) => d)}
                        />
                    </HStack>
                    <UtgifterLagtTilGrunnAccordion />
                    <BeregningsdetaljerAccordion />
                </VStack>
            </div>
        );
    }
    return (
        <VedtakWrapper feil={beregnetSærbidrag.feil} steps={STEPS}>
            {renderResultat()}
        </VedtakWrapper>
    );
};
const UtgifterLagtTilGrunnAccordion: React.FC = () => {
    return (
        <Accordion size="small">
            <Accordion.Item>
                <Accordion.Header>Utgiftene lagt til grunn</Accordion.Header>
                <Accordion.Content className="*:mb-5">
                    <UtgifsposterTable />
                </Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
};
const BeregningsdetaljerAccordion: React.FC = () => {
    return (
        <Accordion size="small">
            <Accordion.Item>
                <Accordion.Header>Beregningsdetaljer</Accordion.Header>
                <Accordion.Content className="*:mb-5">
                    <DetaljertBeregningSærbidrag />
                </Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
};
export default () => {
    return (
        <QueryErrorWrapper>
            <Vedtak />
        </QueryErrorWrapper>
    );
};
