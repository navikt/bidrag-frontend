import { Inntektsrapportering, Kilde, Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, RolleTag, RolleTypeAbbreviation } from "@bidrag/common";
import { Box, Heading, Table } from "@navikt/ds-react";
import React from "react";
import elementId from "../../constants/elementIds";
import text from "../../constants/texts";
import { useGetBehandlingV2 } from "../../hooks/useApiData";
import type { InntektFormPeriode } from "../../types/inntektFormValues";
import LeggTilPeriodeButton from "../formFields/FormLeggTilPeriode";
import { ExpandableContent } from "./ExpandableContent";
import { EditOrSaveButton, InntektTabel, KildeIcon, Periode, TaMed, Totalt } from "./InntektTable";
import { useInntektTableProvider } from "./InntektTableContext";
import { Opplysninger } from "./Opplysninger";

export const Kontantstøtte = () => {
    const { gjelderRolleId } = useInntektTableProvider();
    const { inntekterV2: inntektRoller } = useGetBehandlingV2();
    const inntektRolle = inntektRoller.find((rolle) => rolle.gjelder.id === gjelderRolleId);
    const barna = inntektRolle?.inntekter?.kontantstøtte;

    return (
        <Box background="neutral-soft" className="grid gap-y-2 px-4 py-2 w-full">
            <Heading level="2" size="small" id={elementId.seksjon_inntekt_kontantstøtte}>
                {text.title.kontantstøtte}
            </Heading>
            <Opplysninger fieldName={`kontantstøtte.${gjelderRolleId}.${gjelderRolleId}`} />
            <div className="grid gap-y-[24px]">
                {barna.map((barn) => (
                    <div className="grid gap-y-2" key={barn.gjelderBarn.id}>
                        {barna.length > 1 && (
                            <div className="grid grid-cols-[max-content_max-content_auto] p-2 bg-[white] border border-[var(--ax-border-neutral)]">
                                <div className="w-8 mr-2 h-max">
                                    <RolleTag
                                        rolleType={RolleTypeAbbreviation.BA}
                                        ident={barn.gjelderBarn.ident}
                                        stønad18År={barn.gjelderBarn.stønadstype === Stonadstype.BIDRAG18AAR}
                                    />
                                </div>
                                <PersonNavnIdent ident={barn.gjelderBarn.ident} />
                            </div>
                        )}
                        <InntektTabel fieldName={`kontantstøtte.${gjelderRolleId}.${barn.gjelderBarn.id}` as const}>
                            {({
                                controlledFields,
                                onSaveRow,
                                handleOnSelect,
                                onEditRow,
                                addPeriod,
                            }: {
                                controlledFields: InntektFormPeriode[];
                                onSaveRow: (index: number) => void;
                                handleOnSelect: (value: boolean, index: number) => void;
                                onEditRow: (index: number) => void;
                                addPeriod: (periode: InntektFormPeriode) => void;
                            }) => (
                                <div className="grid gap-y-2">
                                    {controlledFields.length > 0 && (
                                        <div className="overflow-x-auto whitespace-nowrap">
                                            <Table size="small" className="table-fixed table bg-[white] w-fit">
                                                <Table.Header>
                                                    <Table.Row className="align-baseline">
                                                        <Table.HeaderCell
                                                            textSize="small"
                                                            scope="col"
                                                            align="center"
                                                            className="w-[74px]"
                                                        >
                                                            {text.label.taMed}
                                                        </Table.HeaderCell>
                                                        <Table.HeaderCell
                                                            textSize="small"
                                                            scope="col"
                                                            className="w-[134px]"
                                                        >
                                                            {text.label.fraOgMed}
                                                        </Table.HeaderCell>
                                                        <Table.HeaderCell
                                                            textSize="small"
                                                            scope="col"
                                                            className="w-[134px]"
                                                        >
                                                            {text.label.tilOgMed}
                                                        </Table.HeaderCell>
                                                        <Table.HeaderCell
                                                            textSize="small"
                                                            scope="col"
                                                            align="center"
                                                            className="w-[374px]"
                                                        >
                                                            {text.label.kilde}
                                                        </Table.HeaderCell>
                                                        <Table.HeaderCell
                                                            textSize="small"
                                                            scope="col"
                                                            align="right"
                                                            className="w-[100px]"
                                                        >
                                                            {text.label.beløp}
                                                        </Table.HeaderCell>
                                                        <Table.HeaderCell
                                                            scope="col"
                                                            className="w-[56px]"
                                                        ></Table.HeaderCell>
                                                        <Table.HeaderCell
                                                            scope="col"
                                                            className="w-[56px]"
                                                        ></Table.HeaderCell>
                                                    </Table.Row>
                                                </Table.Header>
                                                <Table.Body>
                                                    {controlledFields.map((item, index) => (
                                                        <Table.ExpandableRow
                                                            key={item?.id + "-" + item.gjelderRolleId}
                                                            content={<ExpandableContent item={item} />}
                                                            togglePlacement="right"
                                                            className="align-top"
                                                            expansionDisabled={item.kilde === Kilde.MANUELL}
                                                        >
                                                            <Table.DataCell>
                                                                <TaMed
                                                                    fieldName={`kontantstøtte.${gjelderRolleId}.${barn.gjelderBarn.id}`}
                                                                    index={index}
                                                                    handleOnSelect={handleOnSelect}
                                                                />
                                                            </Table.DataCell>
                                                            <Table.DataCell textSize="small">
                                                                <Periode
                                                                    index={index}
                                                                    label={text.label.fraOgMed}
                                                                    fieldName={`kontantstøtte.${gjelderRolleId}.${barn.gjelderBarn.id}`}
                                                                    field="datoFom"
                                                                    item={item}
                                                                />
                                                            </Table.DataCell>
                                                            <Table.DataCell textSize="small">
                                                                <Periode
                                                                    index={index}
                                                                    label={text.label.tilOgMed}
                                                                    fieldName={`kontantstøtte.${gjelderRolleId}.${barn.gjelderBarn.id}`}
                                                                    field="datoTom"
                                                                    item={item}
                                                                />
                                                            </Table.DataCell>
                                                            <Table.DataCell>
                                                                <KildeIcon kilde={item.kilde} />
                                                            </Table.DataCell>
                                                            <Table.DataCell textSize="small">
                                                                <Totalt
                                                                    item={item}
                                                                    field={`kontantstøtte.${gjelderRolleId}.${barn.gjelderBarn.id}.${index}`}
                                                                />
                                                            </Table.DataCell>
                                                            <Table.DataCell>
                                                                <EditOrSaveButton
                                                                    index={index}
                                                                    item={item}
                                                                    onEditRow={onEditRow}
                                                                    onSaveRow={onSaveRow}
                                                                />
                                                            </Table.DataCell>
                                                        </Table.ExpandableRow>
                                                    ))}
                                                </Table.Body>
                                            </Table>
                                        </div>
                                    )}

                                    <LeggTilPeriodeButton
                                        addPeriode={() =>
                                            addPeriod({
                                                gjelderRolleId,
                                                gjelderBarnId: barn.gjelderBarn.id,
                                                datoFom: null,
                                                datoTom: null,
                                                beløp: 0,
                                                rapporteringstype: Inntektsrapportering.KONTANTSTOTTE,
                                                taMed: true,
                                                kilde: Kilde.MANUELL,
                                                inntektsposter: [],
                                                inntektstyper: [],
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </InntektTabel>
                    </div>
                ))}
            </div>
        </Box>
    );
};
