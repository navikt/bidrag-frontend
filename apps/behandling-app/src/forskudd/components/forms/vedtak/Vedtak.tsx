import { type ResultatBeregningBarnDto, type ResultatRolle, Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import { dateToDDMMYYYYString, PersonNavnIdent, RolleTag, RolleTypeAbbreviation } from "@bidrag/common";
import { Alert, Heading, Table } from "@navikt/ds-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { VedtakProvider } from "../../../../barnebidrag/components/vedtak/VedtakCommon";
import { QueryErrorWrapper } from "../../../../common/components/query-error-boundary/QueryErrorWrapper";
import { AdminButtons } from "../../../../common/components/vedtak/AdminButtons";
import { FatteVedtakButtons } from "../../../../common/components/vedtak/FatteVedtakButtons";
import VedtakWrapper from "../../../../common/components/vedtak/VedtakWrapper";
import text from "../../../../common/constants/texts";
import { useBehandlingProvider } from "../../../../common/context/BehandlingContext";
import { QueryKeys, useGetBehandlingV2, useGetBeregningForskudd } from "../../../../common/hooks/useApiData";
import { hentVisningsnavn } from "../../../../common/hooks/useVisningsnavn";
import environment from "../../../../environment";
import type { VedtakBeregningResult } from "../../../../types/vedtakTypes";
import { deductDays } from "../../../../utils/date-utils";
import { formatterBeløp } from "../../../../utils/number-utils";
import { STEPS } from "../../../constants/steps";

const Vedtak = () => {
    const { behandlingId, activeStep, lesemodus } = useBehandlingProvider();
    const { erVedtakFattet } = useGetBehandlingV2();
    const queryClient = useQueryClient();
    const beregnetForskudd = queryClient.getQueryData<VedtakBeregningResult>(QueryKeys.beregningForskudd());
    const isBeregningError = queryClient.getQueryState(QueryKeys.beregningForskudd())?.status === "error";

    useEffect(() => {
        if (environment.system.isDevelopment) {
            queryClient.refetchQueries({ queryKey: QueryKeys.behandlingV2(behandlingId) });
            queryClient.refetchQueries({ queryKey: QueryKeys.beregningForskudd() });
        } else {
            queryClient.refetchQueries({ queryKey: QueryKeys.behandlingV2(behandlingId) });
            queryClient.resetQueries({ queryKey: QueryKeys.beregningForskudd() });
        }
    }, [activeStep]);

    return (
        <VedtakProvider className="grid gap-y-8 w-[1100px]">
            {erVedtakFattet && !lesemodus && <Alert variant="warning">Vedtak er fattet for behandling</Alert>}
            <div className="grid gap-y-2">
                <Heading level="2" size="medium">
                    {text.title.vedtak}
                </Heading>
            </div>
            <div className="grid gap-y-2">
                {!beregnetForskudd?.feil && (
                    <Heading level="3" size="small">
                        {text.title.oppsummering}
                    </Heading>
                )}

                <VedtakResultat />
            </div>

            {!beregnetForskudd?.feil && !lesemodus && <FatteVedtakButtons isBeregningError={isBeregningError} />}
            <AdminButtons />
        </VedtakProvider>
    );
};

const VedtakResultat = () => {
    const { data: beregnetForskudd } = useGetBeregningForskudd();
    const { roller, virkningstidspunktV3, vedtakstype } = useGetBehandlingV2();

    return (
        <VedtakWrapper feil={beregnetForskudd.feil} steps={STEPS}>
            {beregnetForskudd.resultat?.map((r, i) => {
                const rolle = roller.find((v) => v.ident === r.barn.ident);
                const erOpphør = vedtakstype === Vedtakstype.OPPHOR || rolle?.harLøpendeForskudd;
                return (
                    <div key={i + r.barn.ident + r.barn.navn} className="mb-8">
                        <VedtakResultatBarn barn={r.barn} />
                        <Table size="small">
                            <VedtakTableHeader avslag={virkningstidspunktV3.erAvslagForAlle} />
                            <VedtakTableBody
                                resultatBarn={r}
                                avslag={virkningstidspunktV3.erAvslagForAlle}
                                opphør={erOpphør}
                            />
                        </Table>
                    </div>
                );
            })}
        </VedtakWrapper>
    );
};

const VedtakTableBody = ({
    resultatBarn,
    avslag,
    opphør,
}: {
    resultatBarn: ResultatBeregningBarnDto;
    avslag: boolean;
    opphør: boolean;
}) => {
    return (
        <Table.Body>
            {resultatBarn.perioder.map((periode) => (
                <>
                    {avslag ? (
                        <Table.Row>
                            <Table.DataCell textSize="small">
                                {dateToDDMMYYYYString(new Date(periode.periode.fom))} -{" "}
                                {periode.periode.til
                                    ? dateToDDMMYYYYString(deductDays(new Date(periode.periode.til), 1))
                                    : ""}
                            </Table.DataCell>
                            <Table.DataCell textSize="small">
                                {opphør ? text.label.opphør : text.label.avslag}
                            </Table.DataCell>
                            <Table.DataCell textSize="small">{periode.resultatkodeVisningsnavn}</Table.DataCell>
                        </Table.Row>
                    ) : (
                        <Table.Row>
                            <Table.DataCell textSize="small">
                                {dateToDDMMYYYYString(new Date(periode.periode.fom))} -{" "}
                                {periode.periode.til
                                    ? dateToDDMMYYYYString(deductDays(new Date(periode.periode.til), 1))
                                    : ""}
                            </Table.DataCell>

                            <Table.DataCell textSize="small">{formatterBeløp(periode.inntekt)}</Table.DataCell>

                            <Table.DataCell textSize="small">{hentVisningsnavn(periode.sivilstand)}</Table.DataCell>

                            <Table.DataCell textSize="small">{periode.antallBarnIHusstanden}</Table.DataCell>
                            <Table.DataCell textSize="small">{formatterBeløp(periode.beløp)}</Table.DataCell>
                            <Table.DataCell textSize="small">{periode.resultatkodeVisningsnavn}</Table.DataCell>
                        </Table.Row>
                    )}
                </>
            ))}
        </Table.Body>
    );
};

const VedtakResultatBarn = ({ barn }: { barn: ResultatRolle }) => (
    <div className="my-4 flex items-center gap-x-2">
        <RolleTag rolleType={RolleTypeAbbreviation.BA} ident={barn.ident} />
        <PersonNavnIdent ident={barn.ident} navn={barn.navn} variant="compact" />
    </div>
);
const VedtakTableHeader = ({ avslag = false }: { avslag: boolean }) => (
    <Table.Header>
        {avslag ? (
            <Table.Row>
                <Table.HeaderCell textSize="small" scope="col">
                    {text.label.periode}
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col">
                    {text.label.resultat}
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col">
                    {text.label.årsak}
                </Table.HeaderCell>
            </Table.Row>
        ) : (
            <Table.Row>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "200px" }}>
                    {text.label.periode}
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "150px" }}>
                    {text.label.inntekt}
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "200px" }}>
                    {text.label.sivilstandBM}
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "150px" }}>
                    {text.label.antallBarn}
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "100px" }}>
                    {text.label.forskudd}
                </Table.HeaderCell>
                <Table.HeaderCell textSize="small" scope="col" style={{ width: "250px" }}>
                    {text.label.resultat}
                </Table.HeaderCell>
            </Table.Row>
        )}
    </Table.Header>
);
export default () => {
    return (
        <QueryErrorWrapper>
            <Vedtak />
        </QueryErrorWrapper>
    );
};
