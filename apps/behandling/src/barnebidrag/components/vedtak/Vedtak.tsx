import {
    type FatteVedtakRevurderingsbarn,
    type ResultatBidragsberegningBarnDto,
    type UgyldigBeregningDto,
    Vedtakstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, BodyShort, Heading, HStack, Skeleton, Table, VStack } from "@navikt/ds-react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import InnkrevingIkon from "../../../assets/Innkreving";
import { QueryErrorWrapper } from "../../../common/components/query-error-boundary/QueryErrorWrapper";
import { AdminButtons } from "../../../common/components/vedtak/AdminButtons";
import { FatteVedtakButtons } from "../../../common/components/vedtak/FatteVedtakButtons";
import { OverstyrFatteVedtakRevurderingSwitch } from "../../../common/components/vedtak/OverstyrRevurderingSwitch";
import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import VedtakWrapper from "../../../common/components/vedtak/VedtakWrapper";
import text from "../../../common/constants/texts";
import { useBehandlingProvider } from "../../../common/context/BehandlingContext";
import { QueryKeys, useGetBehandlingV2, useGetBeregningBidrag } from "../../../common/hooks/useApiData";
import { DateToDDMMYYYYString, dateOrNull, deductDays } from "../../../utils/date-utils";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";
import { STEPS } from "../../constants/steps";
import {
    ForholdsmessigFordelingVarsel,
    GammelVersjonAvBeregningVarsel,
    GrunnlagFraVedtakButton,
    NesteIndeksår,
    VedtakProvider,
    VedtakResultatBarn,
    VedtakTableBody,
    VedtakTableHeader,
} from "./VedtakCommon";

const Vedtak = () => {
    const { behandlingId, activeStep, lesemodus } = useBehandlingProvider();
    const {
        erVedtakFattet,
        erDelvedtakFattet,
        kanBehandlesINyLøsning,
        lesemodus: lesemodusBehandling,
        vedtakstype,
    } = useGetBehandlingV2();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const beregning = useGetBeregningBidrag(false).data;
    const isBeregningError = queryClient.getQueryState(QueryKeys.beregnBarnebidrag(false))?.status === "error";
    const isFetching = useIsFetching({ queryKey: ["beregning_barnebidrag"] }) > 0;
    const lastetFørstegang = useRef(false);
    const [fatteVedtakRevurderingsbarn, setFatteVedtakRevurderingsbarn] = React.useState<FatteVedtakRevurderingsbarn>();
    const [erRevurderingsbarnOverstyringUgyldig, setErRevurderingsbarnOverstyringUgyldig] = React.useState(false);

    const kanViseFatteVedtakKnapp =
        !beregning?.feil && beregning?.resultat && beregning.resultat.kanFatteVedtak && !beregning?.ugyldigBeregning;
    useEffect(() => {
        if (lastetFørstegang.current) {
            queryClient.refetchQueries({ queryKey: QueryKeys.behandlingV2(behandlingId) });
            queryClient.refetchQueries({ queryKey: QueryKeys.beregnBarnebidrag(false) });
        }
        lastetFørstegang.current = true;
        if (lesemodusBehandling?.erOrkestrertVedtak || (vedtakstype === Vedtakstype.KLAGE && !lesemodus)) {
            const searchParams = new URLSearchParams(location.search);

            searchParams.set("steg", "vedtak_endelig");

            navigate({
                pathname: location.pathname,
                search: searchParams.toString(),
            });
        }
    }, [activeStep]);

    return (
        <VedtakProvider className="grid gap-y-8  w-[1150px]">
            {erVedtakFattet && !lesemodus && <Alert variant="warning">Vedtak er fattet for behandling</Alert>}
            {!erVedtakFattet && erDelvedtakFattet && !lesemodus && (
                <Alert variant="warning">
                    Vedtak er delvis fattet og kan derfor ikke endres. Det har skjedd en feil ved fatting av vedtak.
                    Prøv å på nytt eller opprett fagsystemsak
                </Alert>
            )}
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

            {kanViseFatteVedtakKnapp && !isFetching && (
                <OverstyrFatteVedtakRevurderingSwitch
                    onChange={setFatteVedtakRevurderingsbarn}
                    onValidationChange={setErRevurderingsbarnOverstyringUgyldig}
                    kanFatteVedtakForRevurderingsbarn={beregning.resultat?.kanFatteVedtakForRevurderingsbarn}
                    skalFatteVedtakForRevurderingsbarn={beregning.resultat?.skalFatteVedtakForRevurderingsbarn}
                    manueltOverstyrtFatteVedtakRevurderingsbarnBegrunnelse={
                        beregning.resultat?.manueltOverstyrtFatteVedtakRevurderingsbarnBegrunnelse
                    }
                />
            )}
            {kanViseFatteVedtakKnapp && !lesemodus && (
                <FatteVedtakButtons
                    isBeregningError={isBeregningError}
                    disabled={!kanBehandlesINyLøsning || !beregning.resultat.kanFatteVedtak}
                    opprettesForsendelse={beregning?.resultat?.resultatBarn?.some(
                        (r) => r.forsendelseDistribueresAutomatisk,
                    )}
                    fatteVedtakRevurderingsbarn={fatteVedtakRevurderingsbarn}
                    erRevurderingsbarnOverstyringUgyldig={erRevurderingsbarnOverstyringUgyldig}
                />
            )}
            <AdminButtons />
        </VedtakProvider>
    );
};

const VedtakUgyldigBeregning = ({ resultat }: { resultat?: UgyldigBeregningDto }) => {
    if (!resultat) return null;
    return (
        <Alert variant="warning" size="small" className="mb-2">
            <Heading size="xsmall">Kan ikke fatte vedtak</Heading>
            <BodyShort size="small">{resultat.begrunnelse}</BodyShort>
        </Alert>
    );
};

const VedtakResultat = () => {
    const { data: beregning } = useGetBeregningBidrag(false);
    const { medInnkreving } = useGetBehandlingV2();

    return (
        <VedtakWrapper feil={beregning.feil} steps={STEPS}>
            {beregning.resultat?.resultatBarn?.map((r, i) => {
                const erAvslag = r.erAvvisning || r.erAvvistRevurdering || r.perioder.every((p) => p.erDirekteAvslag);
                return (
                    <div key={i + r.barn.ident + r.barn.navn} className="mb-8">
                        <VedtakResultatBarn barn={r.barn} />
                        <VedtakUgyldigBeregning resultat={r.ugyldigBeregning} />
                        {!erAvslag && <NesteIndeksår nesteIndeksår={r.indeksår} barnId={r.barn.ident} />}
                        {medInnkreving && !r.medInnkreving && (
                            <BodyShort size="small" spacing>
                                Uten innkreving
                            </BodyShort>
                        )}
                        {r.barn.innbetaltBeløp && !erAvslag && (
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
                        <BeregningTabellBarn
                            resultatBarn={r}
                            bleManueltOverstyrtTilÅIkkeFatteVedtak={
                                r.erAvvistRevurdering &&
                                beregning.resultat?.manueltOverstyrtFatteVedtakRevurderingsbarnBegrunnelse != null
                            }
                            kanFatteVedtakForRevurderingsbarn={beregning.resultat?.kanFatteVedtakForRevurderingsbarn}
                            anbefalesÅFatteVedtakForRevurderingsbarn={
                                beregning.resultat?.skalFatteVedtakForRevurderingsbarn
                            }
                        />
                        {r.innkrevesFraPerioder?.length > 0 && (
                            <BodyShort size="small">
                                <HStack gap="space-2" className="items-center">
                                    <InnkrevingIkon />
                                    <div>Innkreves: </div>
                                    <div>
                                        {r.innkrevesFraPerioder
                                            .map(
                                                (periode) =>
                                                    `${DateToDDMMYYYYString(dateOrNull(periode.fom))} - ${periode.til != null ? DateToDDMMYYYYString(deductDays(dateOrNull(periode.til), 1)) : ""}`,
                                            )
                                            .join(", ")}
                                    </div>
                                </HStack>
                            </BodyShort>
                        )}
                    </div>
                );
            })}
        </VedtakWrapper>
    );
};
const BeregningTabellBarn = ({
    resultatBarn,
    bleManueltOverstyrtTilÅIkkeFatteVedtak,
    kanFatteVedtakForRevurderingsbarn,
    anbefalesÅFatteVedtakForRevurderingsbarn,
}: {
    resultatBarn: ResultatBidragsberegningBarnDto;
    bleManueltOverstyrtTilÅIkkeFatteVedtak?: boolean;
    kanFatteVedtakForRevurderingsbarn?: boolean;
    anbefalesÅFatteVedtakForRevurderingsbarn?: boolean;
}) => {
    const { isFetching, isLoading } = useGetBeregningBidrag(false);

    const { vedtakstype, roller } = useGetBehandlingV2();
    const rolle = roller.find((v) => v.ident === resultatBarn.barn.ident);

    const erOpphør = vedtakstype === Vedtakstype.OPPHOR || rolle?.harLøpendeBidrag === true;

    const erAllePerioderAvslag = resultatBarn.perioder.every((p) => p.erDirekteAvslag);
    const avvistAldersjustering =
        resultatBarn.perioder.length > 0 &&
        resultatBarn.perioder.every(
            (p) => p.aldersjusteringDetaljer != null && p.aldersjusteringDetaljer?.aldersjustert === false,
        );
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
    if (resultatBarn.erAvvisning && !resultatBarn.erAvvistRevurdering) {
        return (
            <Alert variant="info">
                <BodyShort size="small">
                    Vedtaket er avslag på behandling og har derfor ingen perioder. Vedtaket vil ikke føre til noe
                    endringer i regnskapet.
                </BodyShort>
            </Alert>
        );
    } else if (resultatBarn.erAvvistRevurdering && resultatBarn.perioder.length === 0) {
        return (
            <Alert variant="info">
                <BodyShort size="small">
                    Ingen perioder har slått ut til FF. Det vil derfor ikke fattes noe vedtak for revurderingsbarnet.
                </BodyShort>
            </Alert>
        );
    }
    return (
        <>
            {bleManueltOverstyrtTilÅIkkeFatteVedtak && (
                <Alert variant="info" className="mb-4">
                    <BodyShort size="small">
                        Det ble manuelt overstyrt til å ikke fatte vedtak for revurderingsbarnet.
                    </BodyShort>
                </Alert>
            )}

            <Table size="small">
                <VedtakTableHeader
                    resultatBarn={resultatBarn}
                    avslag={erAllePerioderAvslag}
                    avvistAldersjustering={avvistAldersjustering}
                    resultatUtenBeregning={resultatBarn.resultatUtenBeregning}
                    bareVisResultat={vedtakstype === Vedtakstype.INDEKSREGULERING}
                />
                <VedtakTableBody
                    resultatBarn={resultatBarn}
                    avslag={erAllePerioderAvslag}
                    opphør={erOpphør}
                    anbefalesÅFatteVedtakForRevurderingsbarn={anbefalesÅFatteVedtakForRevurderingsbarn}
                    kanFatteVedtakForRevurderingsbarn={kanFatteVedtakForRevurderingsbarn}
                    bareVisResultat={vedtakstype === Vedtakstype.INDEKSREGULERING}
                />
            </Table>
        </>
    );
};
export default () => {
    return (
        <QueryErrorWrapper>
            <Vedtak />
        </QueryErrorWrapper>
    );
};
