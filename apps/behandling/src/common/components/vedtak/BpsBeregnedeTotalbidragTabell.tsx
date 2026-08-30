import { type BeregnetBidragBarnDto, TypeBehandling } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavn } from "@bidrag/common";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { BodyShort, Heading, HelpText, Link, Table } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";
import React from "react";
import { VedtakLenke } from "../../../barnebidrag/components/vedtak/VedtakCommon";
import { DateToMMYYYYString } from "../../../utils/date-utils";
import { formatterBeløp, formatterBeløpForBeregning, formatterProsent } from "../../../utils/number-utils";
import { useGetBehandlingV2, useGetBeregningSærbidrag } from "../../hooks/useApiData";
import SakLenke from "../SakLenke";
import { CalculationTabell } from "./CalculationTable";
export interface BeregnetBidragPerBarnDtoInternal {
    beregnetBidragPerBarn: BeregnetBidragBarnDto;
    personidentBarn: string;
    personnavn: string;
}

export type BeregnetBidragPerBarnDtoAdjusted = BeregnetBidragPerBarnDtoInternal & {
    erSøknadsbarn?: boolean;
    privatAvtale?: boolean;
    erBidragIkkeTilFordeling?: boolean;
    erUtenlandskbidrag?: boolean;
};
export const BpsBeregnedeTotalbidragTabellSærbidrag = () => {
    const { data: beregnetSærbidrag } = useGetBeregningSærbidrag();

    const delberegning = beregnetSærbidrag.resultat.delberegningBidragspliktigesBeregnedeTotalBidrag;

    return (
        <BpsBeregnedeTotalbidragTabell
            beregning={
                delberegning.beregnetBidragPerBarnListe.map((barn) => ({
                    ...barn,
                    barn: { ident: barn.personidentBarn, navn: "" },
                })) as unknown as BeregnetBidragPerBarnDtoAdjusted[]
            }
            bidragspliktigesBeregnedeTotalbidrag={delberegning.bidragspliktigesBeregnedeTotalbidrag}
        />
    );
};

export const BpsBeregnedeTotalbidragTabell = ({
    beregning,
    bidragspliktigesBeregnedeTotalbidrag,
    title = "BP's beregnede totalbidrag for andre barn",
}: {
    beregning: BeregnetBidragPerBarnDtoAdjusted[];
    bidragspliktigesBeregnedeTotalbidrag: number;
    title?: string;
}) => {
    const visReduksjonAvUFeature = useFlag("beregning.bidrag_reduksjon_underholdskostnad");
    const { type } = useGetBehandlingV2();

    if (type !== TypeBehandling.SAeRBIDRAG && beregning.every((b) => b.erSøknadsbarn || b.privatAvtale)) return null;
    const visReduksjonAvU =
        type === TypeBehandling.SAeRBIDRAG || (type === TypeBehandling.BIDRAG && visReduksjonAvUFeature);
    const beregningUtenPrivatAvtale = beregning.filter((b) => !b.privatAvtale);
    const inneholderVedtaksid = beregningUtenPrivatAvtale.some((b) => b.beregnetBidragPerBarn.vedtaksid);
    function renderTable() {
        return (
            <Table
                size="small"
                zebraStripes
                className={
                    type === TypeBehandling.SAeRBIDRAG
                        ? // eslint-disable-next-line no-useless-escape
                          "table-auto pb-[5px] border-collapse text-left border-spacing-2 w-full [&_.navds-table__data-cell]:p-0 [&_.navds-table__data-cell]:pl-2 [&_.navds-table__data-cell]:pr-2 "
                        : undefined
                }
            >
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell textSize="small" align="left"></Table.HeaderCell>
                        <Table.HeaderCell textSize="small" align="left">
                            {"Barn"}
                        </Table.HeaderCell>
                        <Table.HeaderCell textSize="small" align="left">
                            {"Saksnummer"}
                        </Table.HeaderCell>
                        {inneholderVedtaksid && (
                            <Table.HeaderCell textSize="small" align="left">
                                {"Vedtak"}
                            </Table.HeaderCell>
                        )}
                        <Table.HeaderCell textSize="small" align="right">
                            {"Løpende bidrag"}
                        </Table.HeaderCell>
                        <Table.HeaderCell textSize="small" align="right" className="pl-4">
                            <div className="inline-block align-middle">Samvær</div>
                            <HelpText wrapperClassName="inline-block align-middle" className="size-4" placement="top">
                                Samværsfradraget beregnet etter dagens sats
                            </HelpText>
                        </Table.HeaderCell>
                        {visReduksjonAvU && (
                            <Table.HeaderCell textSize="small" align="right" className="pl-4">
                                <div className="inline-block align-middle whitespace-pre-wrap w-[110px]">
                                    Reduksjon av BPs andel av U
                                </div>

                                <HelpText
                                    wrapperClassName="inline-block align-middle"
                                    className="size-4"
                                    placement="left"
                                >
                                    Reduksjon av BPs andel av U er differansen mellom det beregnede bidraget og det
                                    faktiske bidraget i forrige vedtak.
                                </HelpText>
                            </Table.HeaderCell>
                        )}
                        <Table.HeaderCell textSize="small" align="right">
                            Sum
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {beregning
                        .filter((b) => !b.privatAvtale)
                        .map(({ beregnetBidragPerBarn: row, personidentBarn, personnavn }, rowIndex) => {
                            const erVedtakKildeBBM =
                                row.erVedtakKildeBBM === undefined || row.erVedtakKildeBBM === true;
                            return (
                                <React.Fragment key={rowIndex}>
                                    <Table.ExpandableRow
                                        className="cursor-pointer"
                                        expandOnRowClick
                                        content={
                                            <CalculationTabell
                                                zebraStripes={false}
                                                className={`${row.bidragJustertForNettoBarnetilleggBP ? "w-[610px]" : "w-[250px]"} [&_Table.DataCell]:w-full [&_.navds-table__row]:bg-inherit`}
                                                title="Reduksjon av BPs andel av U"
                                                data={[
                                                    {
                                                        label: "BPs andel av U",
                                                        result: formatterBeløpForBeregning(
                                                            erVedtakKildeBBM
                                                                ? row.beregnetBeløp
                                                                : row.bruttoBidragEtterBarnetilleggBM,
                                                            true,
                                                        ),
                                                    },
                                                    {
                                                        label: (
                                                            <div className="leading-tight">
                                                                <span>Beregnet bidrag </span>
                                                                {!erVedtakKildeBBM &&
                                                                    row.bidragJustertForNettoBarnetilleggBP && (
                                                                        <BodyShort as="span" size="small">
                                                                            (justert opp til BPs netto barnetillegg)
                                                                        </BodyShort>
                                                                    )}
                                                            </div>
                                                        ),
                                                        result: (
                                                            <div className="flex flex-row justify-end gap-1">
                                                                <div>-</div>
                                                                {formatterBeløpForBeregning(
                                                                    erVedtakKildeBBM
                                                                        ? row.faktiskBeløp
                                                                        : row.bruttoBidragEtterBarnetilleggBP,
                                                                    true,
                                                                )}
                                                            </div>
                                                        ),
                                                    },
                                                ]}
                                                result={{
                                                    label: "Resultat",
                                                    value: formatterBeløpForBeregning(
                                                        row.reduksjonUnderholdskostnad,
                                                        true,
                                                    ),
                                                }}
                                            />
                                        }
                                    >
                                        <Table.DataCell align="left" textSize="small">
                                            <PersonNavn ident={personidentBarn} navn={personnavn} />
                                        </Table.DataCell>
                                        <Table.DataCell align="left" textSize="small">
                                            <SakLenke saksnummer={row.saksnummer} />
                                        </Table.DataCell>
                                        {inneholderVedtaksid && (
                                            <Table.DataCell align="left" textSize="small">
                                                {row.vedtaksid && (
                                                    <VedtakLenke visText vedtaksid={row.vedtaksid} label="Vedtak" />
                                                )}
                                            </Table.DataCell>
                                        )}
                                        <Table.DataCell align="right">
                                            {formatterBeløpForBeregning(row.løpendeBeløp, true)}
                                        </Table.DataCell>
                                        <Table.DataCell align="right" textSize="small">
                                            {formatterBeløpForBeregning(row.samværsfradrag, true)}
                                        </Table.DataCell>
                                        {visReduksjonAvU && (
                                            <Table.DataCell align="right" textSize="small">
                                                {formatterBeløpForBeregning(row.reduksjonUnderholdskostnad, true)}
                                            </Table.DataCell>
                                        )}
                                        <Table.DataCell align="right" textSize="small">
                                            {formatterBeløpForBeregning(row.beregnetBidrag, true)}
                                        </Table.DataCell>
                                    </Table.ExpandableRow>
                                </React.Fragment>
                            );
                        })}
                    <Table.Row className="!bg-inherit">
                        <Table.DataCell
                            colSpan={(!visReduksjonAvU ? 5 : 6) + (inneholderVedtaksid ? 1 : 0)}
                            align="right"
                            textSize="small"
                            className="font-ax-bold"
                        >
                            {"Beregnet totalbidrag:"}
                        </Table.DataCell>
                        <Table.DataCell colSpan={1} align="right" textSize="small">
                            {formatterBeløpForBeregning(bidragspliktigesBeregnedeTotalbidrag, true)}
                        </Table.DataCell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
    }

    return (
        <div>
            <div>
                <Heading size="xsmall" className="inline-block align-middle">
                    {type === TypeBehandling.SAeRBIDRAG ? "BP's beregnede totalbidrag" : title}
                </Heading>
                {type === TypeBehandling.SAeRBIDRAG && (
                    <Link
                        className="pl-2 align-middle"
                        inlineText
                        href="https://lovdata.no/nav/rundskriv/r55-02/KAPITTEL_4-2-3-2-2#KAPITTEL_4-2-3-2-2"
                    >
                        {"Rundskriv"} <ExternalLinkIcon aria-hidden />
                    </Link>
                )}
                {renderTable()}
            </div>
        </div>
    );
};

export function BpsBeregnedeTotalBidragPerioderTabell({ beregning }: { beregning: BeregnetBidragBarnDto[] }) {
    const visReduksjonAvUFeature = useFlag("beregning.bidrag_reduksjon_underholdskostnad");
    return (
        <Table size="small" zebraStripes>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell textSize="small" align="left" className="w-[25%]">
                        {"Periode"}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" align="right">
                        {"Løpende bidrag"}
                    </Table.HeaderCell>
                    <Table.HeaderCell textSize="small" align="right">
                        <div className="inline-block align-middle">Samvær</div>
                        <HelpText wrapperClassName="inline-block align-middle" className="size-4" placement="top">
                            Samværsfradraget beregnet etter dagens sats
                        </HelpText>
                    </Table.HeaderCell>
                    {visReduksjonAvUFeature && (
                        <Table.HeaderCell textSize="small" align="right">
                            <div className="inline-block align-middle whitespace-pre-wrap w-[110px]">
                                Reduksjon av BPs andel av U
                            </div>

                            <HelpText wrapperClassName="inline-block align-middle" placement="left">
                                Reduksjon av BPs andel av U er differansen mellom det beregnede bidraget og det faktiske
                                bidraget i forrige vedtak.
                            </HelpText>
                        </Table.HeaderCell>
                    )}
                    <Table.HeaderCell textSize="small" align="right">
                        Sum
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {beregning.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        <Table.Row className="cursor-pointer">
                            {" "}
                            <Table.DataCell align="left" textSize="small">
                                {DateToMMYYYYString(new Date(row.periode.fom))} -{" "}
                                {row.periode.til ? DateToMMYYYYString(new Date(row.periode.til)) : ""}
                            </Table.DataCell>
                            <Table.DataCell align="right">
                                {formatterBeløpForBeregning(row.løpendeBeløp, true)}
                            </Table.DataCell>
                            <Table.DataCell align="right" textSize="small">
                                {formatterBeløpForBeregning(row.samværsfradrag, true)}
                            </Table.DataCell>
                            {visReduksjonAvUFeature && (
                                <Table.DataCell align="right" textSize="small">
                                    {formatterBeløpForBeregning(row.reduksjonUnderholdskostnad, true)}
                                </Table.DataCell>
                            )}
                            <Table.DataCell align="right" textSize="small">
                                {formatterBeløpForBeregning(row.beregnetBidrag, true)}
                            </Table.DataCell>
                        </Table.Row>
                    </React.Fragment>
                ))}
            </Table.Body>
        </Table>
    );
}
export const BpsPrivatAvtalerTabell = ({
    beregning,
    sumBidragPrivatAvtale,
}: {
    beregning: BeregnetBidragPerBarnDtoAdjusted[];
    sumBidragPrivatAvtale: number;
}) => {
    const { type } = useGetBehandlingV2();

    if (type !== TypeBehandling.SAeRBIDRAG && !beregning.some((b) => b.privatAvtale)) return null;
    const privatAvtaler = beregning.filter((b) => b.privatAvtale && !b.erBidragIkkeTilFordeling);
    if (privatAvtaler.length === 0) return null;

    function renderTablePrivatAvtale() {
        return (
            <Table
                size="small"
                zebraStripes
                className={
                    type === TypeBehandling.SAeRBIDRAG
                        ? // eslint-disable-next-line no-useless-escape
                          "table-auto pb-[5px] border-collapse text-left border-spacing-2 w-full [&_.navds-table__data-cell]:p-0 [&_.navds-table__data-cell]:pl-2 [&_.navds-table__data-cell]:pr-2 "
                        : undefined
                }
            >
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell textSize="small" align="left">
                            {"Barn"}
                        </Table.HeaderCell>
                        <Table.HeaderCell textSize="small" align="right">
                            {"Indeksprosent"}
                        </Table.HeaderCell>
                        <Table.HeaderCell textSize="small" align="right">
                            {"Avtalebeløp"}
                        </Table.HeaderCell>
                        <Table.HeaderCell textSize="small" align="right">
                            {"Samvær"}
                        </Table.HeaderCell>
                        <Table.HeaderCell textSize="small" align="right" style={{ width: "20%" }}>
                            {"Beløp"}
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {privatAvtaler.map(({ beregnetBidragPerBarn: row, personidentBarn }, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                            <Table.Row className="cursor-pointer">
                                <Table.DataCell align="left" textSize="small">
                                    <PersonNavn ident={personidentBarn} />
                                </Table.DataCell>
                                <Table.DataCell align="right" textSize="small">
                                    {formatterProsent(row.indeksreguleringFaktor)}
                                </Table.DataCell>
                                <Table.DataCell align="right" textSize="small">
                                    {formatterBeløpForBeregning(row.løpendeBeløp)}
                                </Table.DataCell>
                                <Table.DataCell align="right" textSize="small">
                                    {formatterBeløpForBeregning(row.samværsfradrag)}
                                </Table.DataCell>
                                <Table.DataCell align="right" textSize="small">
                                    {formatterBeløpForBeregning(row.beregnetBidrag, true)}
                                </Table.DataCell>
                            </Table.Row>
                        </React.Fragment>
                    ))}
                    <Table.Row className="!bg-inherit">
                        <Table.DataCell colSpan={5} align="right" textSize="small">
                            <div className="flex flex-row gap-[28px] justify-end">
                                <strong>{"Sum:"}</strong>
                                {"    "} {formatterBeløpForBeregning(sumBidragPrivatAvtale, true)}
                            </div>
                        </Table.DataCell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
    }

    return (
        <div>
            <div>
                <Heading size="xsmall" className="inline-block align-middle">
                    {"BP's private avtaler"}
                </Heading>

                {renderTablePrivatAvtale()}
            </div>
        </div>
    );
};

export const BpsPrivatAvtalerTabellIkkeTilFordeling = ({
    beregning,
    sumBidrag,
}: {
    beregning: BeregnetBidragPerBarnDtoAdjusted[];
    sumBidrag: number;
}) => {
    const { type } = useGetBehandlingV2();

    if (type !== TypeBehandling.SAeRBIDRAG && !beregning.some((b) => b.erBidragIkkeTilFordeling)) return null;
    const bidragIkkeTilFordeling = beregning.filter((b) => b.erBidragIkkeTilFordeling);
    if (bidragIkkeTilFordeling.length === 0) return null;
    const løperIUtlandskValuta = bidragIkkeTilFordeling.some((b) => b.beregnetBidragPerBarn.valutakode !== "NOK");
    const inneholderUtenlandsk = bidragIkkeTilFordeling.some((b) => b.erUtenlandskbidrag);
    const finnesIndeksregulering = bidragIkkeTilFordeling.some(
        (b) => b.beregnetBidragPerBarn.indeksreguleringFaktor > 0,
    );

    function renderTablePrivatAvtale() {
        return (
            <Table
                size="small"
                zebraStripes
                className={
                    type === TypeBehandling.SAeRBIDRAG
                        ? // eslint-disable-next-line no-useless-escape
                          "table-auto pb-[5px] border-collapse text-left border-spacing-2 w-full [&_.navds-table__data-cell]:p-0 [&_.navds-table__data-cell]:pl-2 [&_.navds-table__data-cell]:pr-2 "
                        : undefined
                }
            >
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell textSize="small" align="left">
                            {"Barn"}
                        </Table.HeaderCell>
                        {finnesIndeksregulering && (
                            <Table.HeaderCell textSize="small" align="right">
                                {"Indeks"}
                            </Table.HeaderCell>
                        )}
                        {inneholderUtenlandsk && (
                            <Table.HeaderCell textSize="small" align="right">
                                {"Avtalebeløp"}
                            </Table.HeaderCell>
                        )}

                        {løperIUtlandskValuta && (
                            <Table.HeaderCell textSize="small" align="right">
                                {"Valutakurs"}
                            </Table.HeaderCell>
                        )}
                        {løperIUtlandskValuta && (
                            <Table.HeaderCell textSize="small" align="right" className="w-[145px]">
                                {"Avtalebeløp (NOK)"}
                            </Table.HeaderCell>
                        )}
                        {inneholderUtenlandsk && (
                            <Table.HeaderCell textSize="small" align="right">
                                {"Samvær"}
                            </Table.HeaderCell>
                        )}
                        <Table.HeaderCell textSize="small" align="right" style={{ width: "20%" }}>
                            {"Beløp"}
                        </Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {bidragIkkeTilFordeling.map(
                        ({ beregnetBidragPerBarn: row, personidentBarn, personnavn }, rowIndex) => (
                            <React.Fragment key={rowIndex}>
                                <Table.Row className="cursor-pointer">
                                    <Table.DataCell align="left" textSize="small">
                                        <PersonNavn ident={personidentBarn} navn={personnavn} />
                                    </Table.DataCell>
                                    {finnesIndeksregulering && (
                                        <Table.DataCell align="right" textSize="small">
                                            {row.indeksreguleringFaktor
                                                ? formatterProsent(row.indeksreguleringFaktor)
                                                : "-"}
                                        </Table.DataCell>
                                    )}
                                    {inneholderUtenlandsk && (
                                        <Table.DataCell align="right" textSize="small">
                                            {row.valutakode === "NOK"
                                                ? formatterBeløp(row.løpendeBeløp)
                                                : `${formatterBeløp(row.løpendeBeløp)} (${row.valutakode})`}
                                        </Table.DataCell>
                                    )}
                                    {løperIUtlandskValuta && (
                                        <Table.DataCell align="right" textSize="small">
                                            {formatterBeløp(row.valutakurs)}
                                        </Table.DataCell>
                                    )}
                                    {løperIUtlandskValuta && (
                                        <Table.DataCell align="right" textSize="small">
                                            {formatterBeløp(row.beregnetBeløp)}
                                        </Table.DataCell>
                                    )}

                                    {inneholderUtenlandsk && (
                                        <Table.DataCell align="right" textSize="small">
                                            {formatterBeløpForBeregning(row.samværsfradrag)}
                                        </Table.DataCell>
                                    )}

                                    <Table.DataCell align="right" textSize="small">
                                        {formatterBeløpForBeregning(row.beregnetBidrag, true)}
                                    </Table.DataCell>
                                </Table.Row>
                            </React.Fragment>
                        ),
                    )}
                    <Table.Row className="!bg-inherit">
                        <Table.DataCell colSpan={7} align="right" textSize="small">
                            <div className="flex flex-row gap-[28px] justify-end">
                                <strong>{"Sum:"}</strong>
                                {"    "} {formatterBeløpForBeregning(sumBidrag, true)}
                            </div>
                        </Table.DataCell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
    }

    return (
        <div>
            <div>
                <Heading size="xsmall" className="inline-block align-middle">
                    {"BP's bidrag som ikke kan fordeles"}
                </Heading>

                {renderTablePrivatAvtale()}
            </div>
        </div>
    );
};
