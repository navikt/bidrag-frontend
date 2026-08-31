import type { DokumentMalDetaljer } from "@bidrag/api/BidragForsendelseApi";
import { AutoSuggest, removeNonPrintableCharachters } from "@bidrag/common";
import { Heading, Radio, RadioGroup, Table, Textarea } from "@navikt/ds-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import DokumentvalgTittel from "../../docs/DokumentvalgTittel.mdx";
import useFeatureToogle from "../../hooks/useFeatureToggle";
import InfoKnapp from "../InfoKnapp";

interface TableRowData {
    malId: string;
    tittel: string;
    beskrivelse: string;
    alternativeTitler: string[];
    type: "UTGÅENDE" | "NOTAT";
}

const harAlternativeTitler = (row: TableRowData) => row.alternativeTitler && row.alternativeTitler.length > 0;
const erFritekstbrev = (row: TableRowData) => row.malId === "BI01S02";
export interface DokumentFormProps {
    malId: string;
    tittel: string;
    type: "UTGÅENDE" | "NOTAT";
}

interface DokumentValgProps {
    malDetaljer: Record<string, DokumentMalDetaljer>;
    showLegend?: boolean;
}
export default function DokumentValg({ malDetaljer, showLegend }: DokumentValgProps) {
    const [editableTitles, setEditableTitles] = useState(new Map());
    const {
        register,
        setValue,
        getValues,
        formState: { errors },
    } = useFormContext<{
        dokument: DokumentFormProps;
    }>();

    const dokument = useWatch({ name: "dokument" });

    const alleBrev: TableRowData[] = Object.keys(malDetaljer).map((key) => ({
        malId: key,
        tittel: malDetaljer[key].tittel,
        beskrivelse: malDetaljer[key].beskrivelse,
        alternativeTitler: malDetaljer[key].alternativeTitler,
        type: malDetaljer[key].type,
    }));

    function updateValues(malId?: string) {
        const dokument = alleBrev.find((d) => d.malId === malId);
        if (dokument) {
            const defaultTittel = harAlternativeTitler(dokument) || erFritekstbrev(dokument) ? null : dokument.tittel;
            const tittel = editableTitles.get(malId) ?? defaultTittel;
            setValue("dokument", {
                malId,
                tittel,
                type: dokument.type,
            });
        }
    }

    function onTitleChange(malId: string, title: string) {
        const titleNoPrintable = removeNonPrintableCharachters(title);
        setEditableTitles((prevValue) => prevValue.set(malId, titleNoPrintable));
        if (getValues("dokument.malId") === malId) {
            setValue("dokument.tittel", titleNoPrintable);
        }
    }
    const methods = register("dokument", {
        validate: (dok) => {
            if (dok?.malId == null) return "Dokument må velges";
            if (dok?.tittel == null || dok.tittel.trim().length === 0) return "Tittel på dokumentet kan ikke være tom";
            return true;
        },
    });
    return (
        <div className="w-100">
            <RadioGroup
                legend={showLegend && <Heading size="small">Velg dokument</Heading>}
                {...methods}
                value={dokument?.malId ?? ""}
                error={errors?.dokument?.message}
                onBlur={(e) => {
                    methods.onBlur(e);
                    // @ts-expect-error
                    const malId = e.target.value;
                    updateValues(malId);
                }}
                onChange={(malId) => {
                    methods.onChange({ target: { value: malId } });
                    updateValues(malId);
                }}
            >
                <DokumentValgTable rows={alleBrev} onTitleChange={onTitleChange} />
            </RadioGroup>
        </div>
    );
}

interface IDokumentValgTableProps {
    rows: TableRowData[];
    onTitleChange: (malId: string, tittel: string) => void;
}
function DokumentValgTable({ rows, onTitleChange }: IDokumentValgTableProps) {
    return (
        <Table size="small">
            <DokumentValgTableHeader />
            <DokumentValgTableRows rows={rows} onTitleChange={onTitleChange} />
        </Table>
    );
}

export function DokumentValgTableHeader() {
    const { visDokumentmalKode } = useFeatureToogle();
    return (
        <Table.Header>
            <Table.Row>
                <Table.HeaderCell></Table.HeaderCell>
                {visDokumentmalKode && <Table.HeaderCell>Mal</Table.HeaderCell>}
                <Table.HeaderCell>
                    <div className="flex flex-row gap-1 items-center">
                        <div>Tittel</div>
                        <InfoKnapp>
                            <DokumentvalgTittel />
                        </InfoKnapp>
                    </div>
                </Table.HeaderCell>
            </Table.Row>
        </Table.Header>
    );
}

interface DokumentValgTableProps {
    rows: TableRowData[];
    onTitleChange: (malId: string, tittel: string) => void;
}
function DokumentValgTableRows({ rows, onTitleChange }: DokumentValgTableProps) {
    const { visDokumentmalKode } = useFeatureToogle();
    return (
        <Table.Body>
            {rows.map((row) => (
                <Table.Row key={row.malId}>
                    <Table.DataCell width={"1%"}>
                        <Radio size="small" value={row.malId}>
                            {""}
                        </Radio>
                    </Table.DataCell>
                    {visDokumentmalKode && <Table.DataCell width="1%">{row.malId}</Table.DataCell>}
                    <Table.DataCell width="100%">
                        <EditableTitle row={row} onTitleChange={(value) => onTitleChange(row.malId, value)} />
                    </Table.DataCell>
                </Table.Row>
            ))}
        </Table.Body>
    );
}
interface EditableTitleProps {
    row: TableRowData;
    onTitleChange: (tittel: string) => void;
}
function EditableTitle({ row, onTitleChange }: EditableTitleProps) {
    const { malId, tittel, beskrivelse } = row;
    const harAnnenTittel = tittel !== beskrivelse;
    function shouldBeEditable() {
        const MALID_TITTLE_REDIGERBAR = ["BI01X02", "BI01X01", "BI01P11", "BI01S02"];
        return MALID_TITTLE_REDIGERBAR.includes(malId);
    }

    function erFritekstbrev() {
        return row.malId === "BI01S02";
    }

    if (!shouldBeEditable()) {
        return (
            <div>
                {beskrivelse}
                {harAnnenTittel && <div>{tittel}</div>}
            </div>
        );
    }

    if (harAlternativeTitler(row) || erFritekstbrev()) {
        return <EditableAndSelectableTitle row={row} onTitleChange={onTitleChange} />;
    }
    return (
        <Textarea
            maxRows={2}
            minRows={1}
            label="Tittel"
            defaultValue={tittel}
            size="small"
            hideLabel
            onChange={(e) => onTitleChange(e.target.value)}
        />
    );
}
interface EditableAndSelectableTitleProps {
    row: TableRowData;
    onTitleChange: (tittel: string) => void;
}
function EditableAndSelectableTitle({ onTitleChange, row }: EditableAndSelectableTitleProps) {
    return (
        <AutoSuggest
            options={row.alternativeTitler ?? []}
            placeholder={`${row.tittel} (skriv inn tittel)`}
            label={""}
            onChange={onTitleChange}
            sortOptions={false}
        />
    );
}
