import { type ResultatBidragsberegningBarnDto, Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, BodyShort, Heading, Skeleton, Table, VStack } from "@navikt/ds-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { ActionButtons } from "../../../common/components/ActionButtons";
import { QueryErrorWrapper } from "../../../common/components/query-error-boundary/QueryErrorWrapper";
import { AdminButtons } from "../../../common/components/vedtak/AdminButtons";
import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import VedtakWrapper from "../../../common/components/vedtak/VedtakWrapper";
import text from "../../../common/constants/texts";
import { useBehandlingProvider } from "../../../common/context/BehandlingContext";
import { QueryKeys, useGetBehandlingV2, useGetBeregningBidrag } from "../../../common/hooks/useApiData";
import type { VedtakBarnebidragBeregningResult } from "../../../types/vedtakTypes";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";
import { STEPS } from "../../constants/steps";
import { BarnebidragStepper } from "../../enum/BarnebidragStepper";
import {
    ForholdsmessigFordelingVarsel,
    GammelVersjonAvBeregningVarsel,
    GrunnlagFraVedtakButton,
    NesteIndeksår,
    VedtakProvider,
    VedtakResultatBarn,
    VedtakTableBody,
    VedtakTableHeader,
    VedtakUgyldigBeregning,
} from "./VedtakCommon";

const Klagevedtak = () => {
    const { behandlingId, activeStep, lesemodus } = useBehandlingProvider();
    const { erVedtakFattet } = useGetBehandlingV2();
    const queryClient = useQueryClient();
    const beregning = queryClient.getQueryData<VedtakBarnebidragBeregningResult>(QueryKeys.beregnBarnebidrag(false));
    const lastetFørstegang = useRef(false);
    useEffect(() => {
        if (lastetFørstegang.current) {
            queryClient.refetchQueries({ queryKey: QueryKeys.behandlingV2(behandlingId) });
            queryClient.refetchQueries({ queryKey: QueryKeys.beregnBarnebidrag(false) });
        }
        lastetFørstegang.current = true;
    }, [activeStep]);
    return (
        <VedtakProvider className="grid gap-y-8  w-[1150px]">
            {erVedtakFattet && !lesemodus && <Alert variant="warning">Vedtak er fattet for behandling</Alert>}
            <div className="grid gap-y-2">
                <Heading level="2" size="medium">
                    {text.title.vedtak}
                </Heading>
            </div>
            <div className="grid gap-y-2">
                {!beregning?.feil && (
                    <div className="flex flex-row">
                        <Heading level="3" size="small">
                            {text.title.oppsummering}
                        </Heading>
                        <GrunnlagFraVedtakButton />
                    </div>
                )}
                <GammelVersjonAvBeregningVarsel />
                <ForholdsmessigFordelingVarsel />
                <VedtakUgyldigBeregning resultat={beregning?.resultat?.ugyldigBeregning} />
                <VedtakResultat />
            </div>
        </VedtakProvider>
    );
};

const VedtakResultat = () => {
    const { data: beregning } = useGetBeregningBidrag(false);

    return (
        <VedtakWrapper feil={beregning.feil} steps={STEPS}>
            {beregning.resultat?.resultatBarn?.map((r, i) => {
                return (
                    <div key={i + r.barn.ident + r.barn.navn} className="mb-8">
                        <VedtakResultatBarn barn={r.barn} />
                        <VedtakUgyldigBeregning resultat={r.ugyldigBeregning} />
                        <NesteIndeksår nesteIndeksår={r.indeksår} barnId={r.barn.ident} />
                        {r.barn.innbetaltBeløp && (
                            <ResultatDescription
                                data={[
                                    {
                                        label: "Innbetalt beløp",
                                        textRight: false,
                                        labelBold: true,
                                        value: formatterBeløpForBeregning(r.barn.innbetaltBeløp),
                                    },
                                ].filter((d) => d)}
                            />
                        )}
                        <BeregningTabellBarn resultatBarn={r} />
                    </div>
                );
            })}
        </VedtakWrapper>
    );
};
const BeregningTabellBarn = ({ resultatBarn }: { resultatBarn: ResultatBidragsberegningBarnDto }) => {
    const { isFetching, isLoading } = useGetBeregningBidrag(false);
    const { roller, virkningstidspunktV3, vedtakstype } = useGetBehandlingV2();

    const avslag = virkningstidspunktV3.barn.find((v) => v.rolle.ident === resultatBarn.barn.ident)?.avslag;
    const erAvslag = avslag !== null && avslag !== undefined;
    const avvistAldersjustering = resultatBarn.perioder.every(
        (p) => p.aldersjusteringDetaljer != null && p.aldersjusteringDetaljer?.aldersjustert === false,
    );
    const rolle = roller.find((v) => v.ident === resultatBarn.barn.ident);

    const erOpphør = vedtakstype === Vedtakstype.OPPHOR || rolle?.harLøpendeBidrag === true;

    if (isFetching && !isLoading) {
        return (
            <VStack gap="space-2" className="w-full">
                <BodyShort size="small">Beregner</BodyShort>
                <Skeleton variant="rectangle" width="100%" height={20} />
                <Skeleton variant="rectangle" width="100%" height={20} />
                <Skeleton variant="rectangle" width="100%" height={20} />
            </VStack>
        );
    }
    const perioder = resultatBarn.perioder;
    if (resultatBarn.erAvvisning && perioder.length === 0) {
        return (
            <Alert variant="info">
                <BodyShort size="small">
                    Vedtaket er avslag på behandling og har derfor ingen perioder. Vedtaket vil ikke føre til noe
                    endringer i regnskapet.
                </BodyShort>
            </Alert>
        );
    } else if (resultatBarn.erAvvistRevurdering) {
        return (
            <Alert variant="info">
                <BodyShort size="small">
                    Ingen perioder har slått ut til FF. Det vil derfor ikke fattes noe vedtak for revurderingsbarnet.
                </BodyShort>
            </Alert>
        );
    }
    return (
        <Table size="small">
            <VedtakTableHeader
                avslag={erAvslag}
                avvistAldersjustering={avvistAldersjustering}
                resultatUtenBeregning={resultatBarn.resultatUtenBeregning}
            />
            <VedtakTableBody
                resultatBarn={resultatBarn}
                avslag={erAvslag}
                opphør={erOpphør}
                anbefalesÅFatteVedtakForRevurderingsbarn={false}
                kanFatteVedtakForRevurderingsbarn={false}
            />
        </Table>
    );
};

const Side = () => {
    const { onStepChange } = useBehandlingProvider();

    const onNext = () => onStepChange(STEPS[BarnebidragStepper.VEDTAK_ENDELIG]);

    return (
        <>
            <ActionButtons onNext={onNext} />
        </>
    );
};

export default ({ endeligVedtak = false }: { endeligVedtak?: boolean }) => {
    return (
        <QueryErrorWrapper>
            <Klagevedtak />
            {!endeligVedtak && <Side />}
            <div className="my-3" />
            <AdminButtons />
        </QueryErrorWrapper>
    );
};
