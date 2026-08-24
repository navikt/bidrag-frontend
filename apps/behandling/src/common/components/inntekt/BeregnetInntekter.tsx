import { Rolletype, Stonadstype, TypeBehandling } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, RolleTag, RolleTypeAbbreviation } from "@bidrag/common";
import { Box, Heading, Table } from "@navikt/ds-react";
import { hasValue } from "../../../utils/array-utils";
import { DateToDDMMYYYYString, dateOrNull, deductDays } from "../../../utils/date-utils";
import text from "../../constants/texts";
import { InntektTableType, inntekterTablesViewRules } from "../../helpers/inntektFormHelpers";
import { useGetBehandlingV2 } from "../../hooks/useApiData";
import { useInntektTableProvider } from "./InntektTableContext";

export const columnWitdhRules = {
    [TypeBehandling.BIDRAG]: {
        [Rolletype.BM]: {
            [InntektTableType.SKATTEPLIKTIG]: "w-[138px]",
            [InntektTableType.BARNETILLEGG]: "w-[122px]",
            [InntektTableType.UTVIDET_BARNETRYGD]: "w-[112px]",
            [InntektTableType.SMÅBARNSTILLEGG]: "w-[110px]",
            [InntektTableType.KONTANTSTØTTE]: "w-[140px]",
            [InntektTableType.TOTAL_INNTEKTER]: "w-[92px]",
        },
        [Rolletype.BP]: {
            [InntektTableType.SKATTEPLIKTIG]: "w-[150px]",
            [InntektTableType.BARNETILLEGG]: "w-[150px]",
            [InntektTableType.TOTAL_INNTEKTER]: "w-[150px]",
        },
        [Rolletype.BA]: {
            [InntektTableType.SKATTEPLIKTIG]: "w-[150px]",
            [InntektTableType.TOTAL_INNTEKTER]: "w-[150px]",
        },
    },
    [TypeBehandling.SAeRBIDRAG]: {
        [Rolletype.BM]: {
            [InntektTableType.SKATTEPLIKTIG]: "w-[138px]",
            [InntektTableType.BARNETILLEGG]: "w-[122px]",
            [InntektTableType.UTVIDET_BARNETRYGD]: "w-[112px]",
            [InntektTableType.SMÅBARNSTILLEGG]: "w-[110px]",
            [InntektTableType.KONTANTSTØTTE]: "w-[140px]",
            [InntektTableType.TOTAL_INNTEKTER]: "w-[92px]",
        },
        [Rolletype.BP]: {
            [InntektTableType.SKATTEPLIKTIG]: "w-[150px]",
            [InntektTableType.BARNETILLEGG]: "w-[150px]",
            [InntektTableType.TOTAL_INNTEKTER]: "w-[150px]",
        },
        [Rolletype.BA]: {
            [InntektTableType.SKATTEPLIKTIG]: "w-[150px]",
            [InntektTableType.TOTAL_INNTEKTER]: "w-[150px]",
        },
    },
    [TypeBehandling.FORSKUDD]: {
        [Rolletype.BM]: {
            [InntektTableType.SKATTEPLIKTIG]: "w-[138px]",
            [InntektTableType.BARNETILLEGG]: "w-[122px]",
            [InntektTableType.UTVIDET_BARNETRYGD]: "w-[112px]",
            [InntektTableType.SMÅBARNSTILLEGG]: "w-[94px]",
            [InntektTableType.KONTANTSTØTTE]: "w-[132px]",
            [InntektTableType.TOTAL_INNTEKTER]: "w-[92px]",
        },
    },
};
export const BeregnetInntekter = () => {
    const { rolle } = useInntektTableProvider();
    const { inntekterV2, type } = useGetBehandlingV2();

    const behandlingViewRules = inntekterTablesViewRules[type][rolle.rolletype] as InntektTableType[];
    const behandlingColumnWitdhRules = columnWitdhRules[type][rolle.rolletype] as {
        [_key in InntektTableType]: string;
    };

    const beregnetInntekter = inntekterV2.find((inntekt) => inntekt.gjelder.id === rolle.id);
    const beregnetInntekterForRolle = beregnetInntekter.inntekter.beregnetInntekt?.inntekter?.filter((inntekt) =>
        rolle.rolletype === Rolletype.BA ? inntekt.inntektGjelderBarn == null : inntekt.inntektGjelderBarn != null,
    );

    if (
        !beregnetInntekterForRolle ||
        beregnetInntekterForRolle.length === 0 ||
        beregnetInntekterForRolle.every((v) => v.summertInntektListe.length === 0)
    ) {
        return null;
    }
    return (
        <Box padding="space-16" background="neutral-soft" key={`beregnet-inntekter-${rolle.id}`} className="w-full">
            <Heading level="2" size="small" spacing>
                {text.title.beregnetTotalt}
            </Heading>
            <div className="grid gap-y-[24px]">
                {beregnetInntekterForRolle.map((inntektPerBarn, index) => (
                    <div
                        className="grid gap-y-2"
                        key={`${rolle.id}-${index}-${inntektPerBarn.inntektGjelderBarn?.ident}`}
                    >
                        {inntektPerBarn.inntektGjelderBarn &&
                            rolle.rolletype !== Rolletype.BA &&
                            beregnetInntekterForRolle.length > 1 && (
                                <div className="grid grid-cols-[max-content_max-content_auto] p-2 bg-[white] border-0 border-[var(--ax-border-neutral)]">
                                    <div className="w-8 mr-2 h-max">
                                        <RolleTag
                                            rolleType={RolleTypeAbbreviation.BA}
                                            ident={inntektPerBarn.inntektGjelderBarn.ident}
                                            stønad18År={
                                                inntektPerBarn.inntektGjelderBarn.stønadstype ===
                                                Stonadstype.BIDRAG18AAR
                                            }
                                        />
                                    </div>
                                    <PersonNavnIdent
                                        ident={inntektPerBarn.inntektGjelderBarn.ident}
                                        stønad18År={
                                            inntektPerBarn.inntektGjelderBarn.stønadstype === Stonadstype.BIDRAG18AAR
                                        }
                                    />
                                </div>
                            )}
                        <div
                            className="overflow-x-auto whitespace-nowrap"
                            key={`table-${index}-${inntektPerBarn.inntektGjelderBarn?.ident}`}
                        >
                            <Table size="small" className="table-fixed bg-[white] w-fit">
                                <Table.Header>
                                    <Table.Row className="align-baseline  text-wrap">
                                        <Table.HeaderCell textSize="small" scope="col" className="w-47 ">
                                            {text.label.fraOgMed} - {text.label.tilOgMed}
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                            textSize="small"
                                            scope="col"
                                            align="right"
                                            className={behandlingColumnWitdhRules[InntektTableType.SKATTEPLIKTIG]}
                                        >
                                            {text.label.skattepliktigeInntekter}
                                        </Table.HeaderCell>
                                        {hasValue(behandlingViewRules, InntektTableType.BARNETILLEGG) && (
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="right"
                                                className={behandlingColumnWitdhRules[InntektTableType.BARNETILLEGG]}
                                            >
                                                {text.label.barnetillegg}
                                            </Table.HeaderCell>
                                        )}
                                        {hasValue(behandlingViewRules, InntektTableType.UTVIDET_BARNETRYGD) && (
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="right"
                                                className={
                                                    behandlingColumnWitdhRules[InntektTableType.UTVIDET_BARNETRYGD]
                                                }
                                            >
                                                {text.label.utvidetBarnetrygd}
                                            </Table.HeaderCell>
                                        )}
                                        {hasValue(behandlingViewRules, InntektTableType.SMÅBARNSTILLEGG) && (
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="right"
                                                className={behandlingColumnWitdhRules[InntektTableType.SMÅBARNSTILLEGG]}
                                            >
                                                {text.label.småbarnstillegg}
                                            </Table.HeaderCell>
                                        )}
                                        {hasValue(behandlingViewRules, InntektTableType.KONTANTSTØTTE) && (
                                            <Table.HeaderCell
                                                textSize="small"
                                                scope="col"
                                                align="right"
                                                className={behandlingColumnWitdhRules[InntektTableType.KONTANTSTØTTE]}
                                            >
                                                {text.label.kontantstøtte}
                                            </Table.HeaderCell>
                                        )}
                                        <Table.HeaderCell
                                            textSize="small"
                                            scope="col"
                                            align="right"
                                            className={behandlingColumnWitdhRules[InntektTableType.TOTAL_INNTEKTER]}
                                        >
                                            {text.label.totalt}
                                        </Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {inntektPerBarn.summertInntektListe.map((delberegningSumInntekt, index) => (
                                        <Table.Row
                                            key={`body-${delberegningSumInntekt}-${index}`}
                                            className="align-top"
                                        >
                                            <Table.DataCell textSize="small">
                                                {DateToDDMMYYYYString(dateOrNull(delberegningSumInntekt.periode.fom))} -{" "}
                                                {delberegningSumInntekt.periode.til
                                                    ? DateToDDMMYYYYString(
                                                          deductDays(dateOrNull(delberegningSumInntekt.periode.til), 1),
                                                      )
                                                    : null}
                                            </Table.DataCell>

                                            <Table.DataCell textSize="small" align="right">
                                                {delberegningSumInntekt.skattepliktigInntekt?.toLocaleString("nb-NO") ??
                                                    0}
                                            </Table.DataCell>
                                            {hasValue(behandlingViewRules, InntektTableType.BARNETILLEGG) && (
                                                <Table.DataCell textSize="small" align="right">
                                                    {delberegningSumInntekt.barnetillegg?.toLocaleString("nb-NO") ?? 0}
                                                </Table.DataCell>
                                            )}
                                            {hasValue(behandlingViewRules, InntektTableType.UTVIDET_BARNETRYGD) && (
                                                <Table.DataCell textSize="small" align="right">
                                                    {delberegningSumInntekt.utvidetBarnetrygd?.toLocaleString(
                                                        "nb-NO",
                                                    ) ?? 0}
                                                </Table.DataCell>
                                            )}
                                            {hasValue(behandlingViewRules, InntektTableType.SMÅBARNSTILLEGG) && (
                                                <Table.DataCell textSize="small" align="right">
                                                    {delberegningSumInntekt.småbarnstillegg?.toLocaleString("nb-NO") ??
                                                        0}
                                                </Table.DataCell>
                                            )}
                                            {hasValue(behandlingViewRules, InntektTableType.KONTANTSTØTTE) && (
                                                <Table.DataCell textSize="small" align="right">
                                                    {delberegningSumInntekt.kontantstøtte?.toLocaleString("nb-NO") ?? 0}
                                                </Table.DataCell>
                                            )}
                                            <Table.DataCell textSize="small" align="right">
                                                {delberegningSumInntekt.totalinntekt.toLocaleString("nb-NO")}
                                            </Table.DataCell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    </div>
                ))}
            </div>
        </Box>
    );
};
