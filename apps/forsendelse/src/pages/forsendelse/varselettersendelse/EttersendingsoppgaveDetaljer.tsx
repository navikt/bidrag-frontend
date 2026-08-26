import { dateToDDMMYYYYString } from "@bidrag/common";
import { FloppydiskIcon, PencilIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, HStack, Label, Table, TextField } from "@navikt/ds-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { useHentJournalInngående } from "../../../hooks/useDokumentApi";
import { useHentForsendelseQuery } from "../../../hooks/useForsendelseApi";
import { useOppdaterVarselEttersendelse } from "../../../hooks/varselEnderselseApi";
import type { IForsendelseFormProps } from "../context/DokumenterFormContext";
import { ettersendingsformPrefiks, VarselForJournalpostSelect } from "./OpprettEttersendingsoppgaveButton";

type VarselDetaljerProps = {
    redigerbar: boolean;
};
export function VarselDetaljer() {
    const [endreDetaljer, setEndreDetaljer] = useState<boolean>(false);
    const forsendelse = useHentForsendelseQuery();
    const { getValues, setValue, reset, setError } = useFormContext<IForsendelseFormProps>();
    const oppdaterVarselEttersendelseFn = useOppdaterVarselEttersendelse();
    const inngåendeJournalposter = useHentJournalInngående();

    function onSave() {
        const tittel = getValues(`${ettersendingsformPrefiks}.tittel`);
        const journalpostId = getValues(`${ettersendingsformPrefiks}.journalpostId`);
        const innsendingsfristDager = getValues(`${ettersendingsformPrefiks}.innsendingsfristDager`);
        if (tittel.trim().length === 0) {
            setError(`${ettersendingsformPrefiks}.tittel`, {
                message: "Tittel kan ikke være tom",
            });
            return;
        }
        if (tittel.trim().length > 250) {
            setError(`${ettersendingsformPrefiks}.tittel`, { message: "Tittel kan ikke være lengre enn 250 tegn" });
            return;
        }
        if (innsendingsfristDager > 28) {
            setError(`${ettersendingsformPrefiks}.innsendingsfristDager`, {
                message: "Frist kan ikke være mer enn 28 dager",
            });
            return;
        }
        const originalJournalpost = inngåendeJournalposter.find(
            (jp) => jp.journalpostId === getValues(`${ettersendingsformPrefiks}.journalpostId`),
        );
        oppdaterVarselEttersendelseFn
            .mutateAsync({
                forsendelseId: Number(forsendelse.forsendelseId.replace("BIF-", "")),
                tittel: tittel,
                ettersendelseForJournalpostId: journalpostId,
                skjemaId: originalJournalpost?.brevkode?.kode ?? forsendelse.ettersendingsoppgave?.skjemaId,
                innsendingsfristDager: innsendingsfristDager,
            })
            .then(() => {
                setEndreDetaljer(false);

                setValue(`${ettersendingsformPrefiks}.tittel`, tittel);
                setValue(`${ettersendingsformPrefiks}.innsendingsfristDager`, innsendingsfristDager);
                setValue(`${ettersendingsformPrefiks}.journalpostId`, journalpostId);
                reset(undefined, { keepValues: true });
            });
    }
    return (
        <HStack gap={"space-2"}>
            <Table
                size="small"
                className="w-fit [&_.navds-table\_\_data-cell]:border-none [&_.navds-table\_\_header-cell]:border-none [&_.navds-table\_\_data-cell]:pl-0"
            >
                <Table.Body>
                    <VarselTittel redigerbar={endreDetaljer} />
                    <VarselFrist redigerbar={endreDetaljer} />
                    <VarselForJournalpost redigerbar={endreDetaljer} />
                </Table.Body>
            </Table>
            <div className="self-start">
                <EditOrSaveButton
                    index={-1}
                    editableRow={endreDetaljer}
                    onSaveRow={onSave}
                    onEditRow={() => setEndreDetaljer(true)}
                />
            </div>
        </HStack>
    );
}
const EditOrSaveButton = ({
    index,
    editableRow,
    onSaveRow,
    onEditRow,
}: {
    index: number;
    editableRow: boolean;
    onSaveRow: (index: number) => void;
    onEditRow: (index: number) => void;
}) => {
    return editableRow ? (
        <Button
            type="button"
            onClick={() => onSaveRow(index)}
            icon={<FloppydiskIcon aria-hidden />}
            variant="tertiary"
            size="xsmall"
        >
            Lagre
        </Button>
    ) : (
        <Button
            type="button"
            onClick={() => onEditRow(index)}
            icon={<PencilIcon aria-hidden />}
            variant="tertiary"
            size="xsmall"
        >
            Rediger
        </Button>
    );
};

function VarselTittel({ redigerbar }: VarselDetaljerProps) {
    const {
        getValues,
        register,
        formState: { errors },
    } = useFormContext<IForsendelseFormProps>();

    return (
        <Table.Row shadeOnHover={false}>
            <Table.DataCell textSize="small">
                <Label size="small" className="self-left">
                    Tittel:
                </Label>
            </Table.DataCell>
            <Table.DataCell textSize="small">
                {redigerbar ? (
                    <TextField
                        className="w-[300px]"
                        size="small"
                        label=""
                        hideLabel
                        {...register(`${ettersendingsformPrefiks}.tittel`)}
                        error={errors?.ettersendingsoppgave?.tittel?.message}
                    />
                ) : (
                    <BodyShort size="small" className="self-center">
                        {getValues(`${ettersendingsformPrefiks}.tittel`)}
                    </BodyShort>
                )}
            </Table.DataCell>
        </Table.Row>
    );
}

function VarselForJournalpost({ redigerbar }: VarselDetaljerProps) {
    const { getValues } = useFormContext<IForsendelseFormProps>();
    const inngåendeJournalposter = useHentJournalInngående();

    const originalJournalpost = inngåendeJournalposter.find(
        (jp) => jp.journalpostId === getValues(`${ettersendingsformPrefiks}.journalpostId`),
    );

    if (!originalJournalpost) return null;

    return (
        <Table.Row shadeOnHover={false}>
            <Table.DataCell textSize="small" className="self-left">
                <Label size="small" className="self-left">
                    Ettersendelse for søknad:
                </Label>
            </Table.DataCell>
            <Table.DataCell textSize="small">
                {redigerbar ? (
                    <VarselForJournalpostSelect hideLabel prefiks={ettersendingsformPrefiks} />
                ) : (
                    <BodyShort size="small" className="self-center">
                        {originalJournalpost?.innhold} (
                        {dateToDDMMYYYYString(new Date(originalJournalpost?.dokumentDato))})
                    </BodyShort>
                )}
            </Table.DataCell>
        </Table.Row>
    );
}
function VarselFrist({ redigerbar }: VarselDetaljerProps) {
    const {
        getValues,
        register,
        formState: { errors },
    } = useFormContext<IForsendelseFormProps>();

    return (
        <Table.Row shadeOnHover={false}>
            <Table.DataCell textSize="small" className="self-left">
                <Label size="small" className="self-left">
                    Frist for ettersendelse:
                </Label>
            </Table.DataCell>
            <Table.DataCell textSize="small" className="self-left">
                {redigerbar ? (
                    <TextField
                        label="Frist for ettersendelse"
                        hideLabel
                        size="small"
                        {...register(`${ettersendingsformPrefiks}.innsendingsfristDager`)}
                        error={errors?.ettersendingsoppgave?.innsendingsfristDager?.message}
                    />
                ) : (
                    <BodyShort size="small" className="self-center">
                        {getValues(`${ettersendingsformPrefiks}.innsendingsfristDager`)} dager
                    </BodyShort>
                )}
            </Table.DataCell>
        </Table.Row>
    );
}
