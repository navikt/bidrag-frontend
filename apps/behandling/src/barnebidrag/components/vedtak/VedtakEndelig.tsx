import {
    type FatteVedtakDetaljerFraOmgjortVedtakForRevurderingsbarn,
    type FatteVedtakRevurderingsbarn,
    type ResultatBidragsberegningBarnDto,
    type UgyldigBeregningDto,
    UgyldigBeregningDtoFeiltypeEnum,
    Vedtakstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Heading, HStack, Link, Skeleton, Table, VStack } from "@navikt/ds-react";
import { useIsFetching, useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import InnkrevingIkon from "../../../assets/Innkreving";
import { QueryErrorWrapper } from "../../../common/components/query-error-boundary/QueryErrorWrapper";
import { AdminButtons } from "../../../common/components/vedtak/AdminButtons";
import { FatteVedtakButtons } from "../../../common/components/vedtak/FatteVedtakButtons";
import { OverstyrFatteVedtakRevurderingSwitch } from "../../../common/components/vedtak/OverstyrRevurderingSwitch";
import { ResultatDescription } from "../../../common/components/vedtak/ResultatDescription";
import VedtakWrapper from "../../../common/components/vedtak/VedtakWrapper";
import { BEHANDLING_API_V1 } from "../../../common/constants/api";
import text from "../../../common/constants/texts";
import { useBehandlingProvider } from "../../../common/context/BehandlingContext";
import { QueryKeys, useGetBehandlingV2, useGetBeregningBidrag } from "../../../common/hooks/useApiData";
import { useQueryParams } from "../../../common/hooks/useQueryParams";
import { hentVisningsnavn } from "../../../common/hooks/useVisningsnavn";
import { DateToDDMMYYYYString, DateToMMYYYYString, dateOrNull, deductDays } from "../../../utils/date-utils";
import { formatterBeløpForBeregning } from "../../../utils/number-utils";
import { STEPS } from "../../constants/steps";
import Klagevedtak from "./Klagevedtak";
import {
    ForholdsmessigFordelingVarsel,
    GammelVersjonAvBeregningVarsel,
    NesteIndeksår,
    VedtakProvider,
    VedtakResultatBarn,
    VedtakTableBody,
    VedtakTableHeader,
} from "./VedtakCommon";

const VedtakEndelig = () => {
    const { behandlingId, activeStep, lesemodus } = useBehandlingProvider();
    const { erVedtakFattet, kanBehandlesINyLøsning } = useGetBehandlingV2();
    const queryClient = useQueryClient();
    const { data: beregning, isError: isBeregningError } = useGetBeregningBidrag(true);
    const lastetFørstegang = useRef(false);
    const [fatteVedtakRevurderingsbarn, setFatteVedtakRevurderingsbarn] = React.useState<FatteVedtakRevurderingsbarn>();
    const [erRevurderingsbarnOverstyringUgyldig, setErRevurderingsbarnOverstyringUgyldig] = React.useState(false);
    const isFetching = useIsFetching({ queryKey: ["beregning_barnebidrag"] }) > 0;

    const kanViseFatteVedtakKnapp =
        !beregning?.feil && beregning?.resultat && beregning.resultat.kanFatteVedtak && !beregning?.ugyldigBeregning;

    const refreshBeregningVedOverstyring = useMutation({
        mutationKey: ["refresh_beregning_revurderingsbarn"],
        mutationFn: async (skalFatteVedtakForRevurderingsbarn: boolean) => {
            const response = await BEHANDLING_API_V1.api.beregnBarnebidrag(Number(behandlingId), {
                endeligBeregning: true,
                skalFatteVedtakForRevurderingsbarn,
            });

            const ugyldigBeregning =
                response.data.ugyldigBeregning != null ||
                response.data.resultatBarn.some((barn) => barn.ugyldigBeregning);

            return { resultat: response.data, ugyldigBeregning };
        },
        onSuccess: (nyBeregning) => {
            queryClient.setQueryData(QueryKeys.beregnBarnebidrag(true), nyBeregning);
        },
    });
    useEffect(() => {
        if (lastetFørstegang.current) {
            queryClient.refetchQueries({ queryKey: QueryKeys.behandlingV2(behandlingId) });
            queryClient.refetchQueries({
                queryKey: QueryKeys.beregnBarnebidrag(true),
            });
        }
        lastetFørstegang.current = true;
    }, [activeStep]);
    if (
        beregning?.resultat?.ugyldigBeregning &&
        beregning.resultat.ugyldigBeregning.feiltype === UgyldigBeregningDtoFeiltypeEnum.UFULSTENDING_GRUNNLAG_FF
    ) {
        return <Klagevedtak endeligVedtak />;
    }
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
            {kanViseFatteVedtakKnapp && !isFetching && (
                <OverstyrFatteVedtakRevurderingSwitch
                    onChange={setFatteVedtakRevurderingsbarn}
                    onValidationChange={setErRevurderingsbarnOverstyringUgyldig}
                    onBeregningToggle={(skalFatteVedtakForRevurderingsbarn) => {
                        refreshBeregningVedOverstyring.mutate(skalFatteVedtakForRevurderingsbarn);
                    }}
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
                    fatteVedtakRevurderingsbarn={fatteVedtakRevurderingsbarn}
                    erRevurderingsbarnOverstyringUgyldig={erRevurderingsbarnOverstyringUgyldig}
                    disabled={!kanBehandlesINyLøsning || !beregning?.resultat?.kanFatteVedtak}
                />
            )}
            <AdminButtons />
        </VedtakProvider>
    );
};

export const VedtakLenke = ({ vedtaksid, visText = false }: { vedtaksid?: number; visText?: boolean | string }) => {
    const { saksnummer } = useGetBehandlingV2();
    const enhet = useQueryParams().get("enhet");
    const sessionState = useQueryParams().get("sessionState");

    if (!vedtaksid) return null;
    return (
        <Link
            className="ml-auto"
            href={`/sak/${saksnummer}/vedtak/${vedtaksid}/?steg=vedtak&enhet=${enhet}&sessionState=${sessionState}`}
            target="_blank"
            rel="noreferrer"
        >
            {typeof visText === "boolean" && visText
                ? "Grunnlag fra vedtak"
                : typeof visText === "string"
                  ? visText
                  : ""}{" "}
            <ExternalLinkIcon aria-hidden />
        </Link>
    );
};

const GrunnlagFraVedtakButton = () => {
    const { grunnlagFraVedtaksid } = useGetBehandlingV2();

    return <VedtakLenke vedtaksid={grunnlagFraVedtaksid} visText />;
};
const VedtakUgyldigBeregning = ({ resultat }: { resultat: UgyldigBeregningDto }) => {
    if (!resultat) return null;
    return (
        <Alert variant="warning" size="small" className="mb-2 w-full">
            <Heading size="small">Kan ikke fatte vedtak</Heading>
            <BodyShort size="small" className="w-max">
                {resultat.begrunnelse}
            </BodyShort>
            <BodyShort spacing className="mt-2">
                <BodyShort size="small">Gjelder følgende vedtak:</BodyShort>
                <HStack gap="space-2" className="justify-self-start">
                    <BodyShort size="small">
                        {resultat.vedtaksliste.map((v) => {
                            return (
                                <div className="flex flex-row gap-2">
                                    <div>
                                        Vedtak med virkningstidspunkt{" "}
                                        {DateToMMYYYYString(dateOrNull(v.virkningstidspunkt))}
                                    </div>
                                    <VedtakLenke vedtaksid={v.vedtaksid} visText={false} />
                                </div>
                            );
                        })}
                    </BodyShort>
                </HStack>
            </BodyShort>
        </Alert>
    );
};

const VedtakResultat = () => {
    const { data: beregning } = useGetBeregningBidrag(true);
    const revurderingsbarnVedtakDetaljer = beregning.resultat?.fatteVedtakDetaljerFraOmgjortVedtak;

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
                        <BeregningTabellBarn
                            resultatBarn={r}
                            bleManueltOverstyrtTilÅIkkeFatteVedtak={
                                r.erAvvistRevurdering &&
                                beregning.resultat?.manueltOverstyrtFatteVedtakRevurderingsbarnBegrunnelse != null
                            }
                        />
                    </div>
                );
            })}
            <RevurderingsbarnVedtakInfo
                kanFatteVedtakForRevurderingsbarn={beregning.resultat?.kanFatteVedtakForRevurderingsbarn}
                revurderingsbarnVedtakDetaljer={revurderingsbarnVedtakDetaljer}
                resultatBarn={beregning.resultat?.resultatBarn}
            />
        </VedtakWrapper>
    );
};

function BeregningTabellBarn({
    resultatBarn,
    bleManueltOverstyrtTilÅIkkeFatteVedtak,
}: {
    resultatBarn: ResultatBidragsberegningBarnDto;
    bleManueltOverstyrtTilÅIkkeFatteVedtak: boolean;
}) {
    const { isFetching, isLoading, data: beregning } = useGetBeregningBidrag(true);
    const isRefreshingBeregning = useIsMutating({ mutationKey: ["refresh_beregning_revurderingsbarn"] }) > 0;

    const { roller } = useGetBehandlingV2();
    if ((isFetching && !isLoading) || isRefreshingBeregning) {
        return (
            <VStack gap="space-2" className="w-full">
                <BodyShort size="small">Beregner</BodyShort>
                <Skeleton variant="rectangle" width="100%" height={20} />
                <Skeleton variant="rectangle" width="100%" height={20} />
                <Skeleton variant="rectangle" width="100%" height={20} />
            </VStack>
        );
    }
    const endeligVedtak = resultatBarn.delvedtak.filter((d) => !d.delvedtak && !d.omgjøringsvedtak);
    const harPerioder = endeligVedtak.some((d) => d.perioder.length > 0);
    if (resultatBarn.erAvvisning) {
        return (
            <Alert variant="info">
                <BodyShort size="small">
                    Vedtaket er avslag på behandling og har derfor ingen perioder. Vedtaket vil ikke føre til noe
                    endringer i regnskapet.
                </BodyShort>
            </Alert>
        );
    } else if (resultatBarn.erAvvistRevurdering && (endeligVedtak.length === 0 || !harPerioder)) {
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

            <VStack gap="space-4">
                {endeligVedtak.map((delvedtak, i) => {
                    const avvistAldersjustering = delvedtak.perioder.every(
                        (p) => p.aldersjusteringDetaljer != null && p.aldersjusteringDetaljer?.aldersjustert === false,
                    );

                    const vedtakstype = delvedtak.type;

                    const manuellAldersjustering = delvedtak.perioder.some(
                        (p) => p?.klageOmgjøringDetaljer?.manuellAldersjustering,
                    );
                    const rolle = roller.find((v) => v.ident === resultatBarn.barn.ident);

                    const erOpphør = vedtakstype === Vedtakstype.OPPHOR || rolle?.harLøpendeBidrag === true;
                    return (
                        <VStack>
                            <ResultatTabell
                                key={`${i}Delvedtak ${hentVisningsnavn(vedtakstype)}`}
                                erAvslag={delvedtak.perioder.every((p) => p.erDirekteAvslag)}
                                avvistAldersjustering={avvistAldersjustering}
                                beregnet={
                                    delvedtak.beregnet ||
                                    (delvedtak.type !== Vedtakstype.INNKREVING && delvedtak.type !== Vedtakstype.OPPHOR)
                                }
                                manuellAldersjustering={manuellAldersjustering}
                                resultatBarn={{
                                    ...resultatBarn,
                                    kanFatteVedtakForRevurderingsbarn:
                                        beregning.resultat?.kanFatteVedtakForRevurderingsbarn,
                                    perioder: delvedtak.perioder,
                                    resultatUtenBeregning: delvedtak.type === Vedtakstype.INDEKSREGULERING,
                                }}
                                erOpphor={erOpphør}
                            />
                            {resultatBarn.innkrevesFraDato && (
                                <BodyShort size="small">
                                    <HStack gap="space-2" className="items-center">
                                        <InnkrevingIkon />
                                        <div>Innkreves: </div>
                                        <div>
                                            {resultatBarn.innkrevesFraPerioder
                                                .map(
                                                    (periode) =>
                                                        `${DateToDDMMYYYYString(dateOrNull(periode.fom))} - ${periode.til != null ? DateToDDMMYYYYString(deductDays(dateOrNull(periode.til), 1)) : ""}`,
                                                )
                                                .join(", ")}
                                        </div>
                                    </HStack>
                                </BodyShort>
                            )}
                        </VStack>
                    );
                })}
            </VStack>
        </>
    );
}

const RevurderingsbarnVedtakInfo = ({
    kanFatteVedtakForRevurderingsbarn,
    revurderingsbarnVedtakDetaljer,
    resultatBarn,
}: {
    kanFatteVedtakForRevurderingsbarn?: boolean;
    revurderingsbarnVedtakDetaljer?: FatteVedtakDetaljerFraOmgjortVedtakForRevurderingsbarn | null;
    resultatBarn?: ResultatBidragsberegningBarnDto[];
}) => {
    const isFetching = useIsFetching({ queryKey: ["beregning_barnebidrag"] }) > 0;

    const begrunnelseFraTidligereVedtak =
        revurderingsbarnVedtakDetaljer?.fatteVedtakRevurderingsbarn?.manueltOverstyrtForslagBegrunnelse;
    const bleFattetVedtakForRevurderingsbarn =
        revurderingsbarnVedtakDetaljer?.bleFattetVedtakForRevurderingsbarn === true;
    const bleIkkeFattetVedtakForRevurderingsbarn =
        revurderingsbarnVedtakDetaljer?.bleFattetVedtakForRevurderingsbarn === false;
    const harRevurderingsbarn = resultatBarn?.some((barn) => barn.barn.erRevurderingsbarn) ?? false;

    const visIkkeFatteVedtakInfo = harRevurderingsbarn && bleIkkeFattetVedtakForRevurderingsbarn;
    const visTidligereVedtakInfo = harRevurderingsbarn && bleFattetVedtakForRevurderingsbarn;

    if ((!visIkkeFatteVedtakInfo && !visTidligereVedtakInfo) || isFetching) {
        return null;
    }

    return (
        <Alert variant="info" size="small">
            <BodyShort size="small">
                {visIkkeFatteVedtakInfo
                    ? kanFatteVedtakForRevurderingsbarn === false
                        ? "I påklaget/omgjort vedtak ble det ikke fattet vedtak for revurderingsbarn. Det vil derfor ikke bli fattet vedtak for revurderingsbarn."
                        : "I påklaget/omgjort vedtak ble det ikke fattet vedtak for revurderingsbarn."
                    : kanFatteVedtakForRevurderingsbarn
                      ? "I påklaget/omgjort vedtak ble det fattet vedtak for revurderingsbarn."
                      : "I påklaget/omgjort vedtak ble det fattet vedtak for revurderingsbarn. Det vil derfor bli fattet vedtak for revurderingsbarn."}
            </BodyShort>
            {begrunnelseFraTidligereVedtak && (
                <BodyShort size="small" className="mt-2">
                    Begrunnelse: {begrunnelseFraTidligereVedtak}
                </BodyShort>
            )}
        </Alert>
    );
};

type ResultatTabellProps = {
    erAvslag: boolean;
    erOpphor?: boolean;
    avvistAldersjustering: boolean;
    resultatBarn: ResultatBidragsberegningBarnDto & {
        kanFatteVedtakForRevurderingsbarn?: boolean;
    };
    beregnet?: boolean;
    manuellAldersjustering?: boolean;
};

const ResultatTabell = ({
    erAvslag,
    avvistAldersjustering,
    resultatBarn,
    erOpphor,
    beregnet,
    manuellAldersjustering,
}: ResultatTabellProps) => {
    return (
        <Table size="small">
            <VedtakTableHeader
                resultatBarn={resultatBarn}
                avslag={erAvslag}
                avvistAldersjustering={avvistAldersjustering}
                resultatUtenBeregning={resultatBarn.resultatUtenBeregning}
                bareVisResultat={!beregnet}
                orkestrertVedtak
                manuellAldersjustering={manuellAldersjustering}
            />
            <VedtakTableBody
                resultatBarn={resultatBarn}
                avslag={erAvslag}
                orkestrertVedtak
                anbefalesÅFatteVedtakForRevurderingsbarn={resultatBarn.kanFatteVedtakForRevurderingsbarn}
                kanFatteVedtakForRevurderingsbarn={resultatBarn.kanFatteVedtakForRevurderingsbarn}
                opphør={erOpphor}
                bareVisResultat={!beregnet}
                manuellAldersjustering={manuellAldersjustering}
            />
        </Table>
    );
};

export default () => {
    return (
        <QueryErrorWrapper>
            <VedtakEndelig />
        </QueryErrorWrapper>
    );
};
