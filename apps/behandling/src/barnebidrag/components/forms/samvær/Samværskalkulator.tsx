import { SamvaerskalkulatorNetterFrekvens } from "@bidrag/api/BidragBehandlingApiV1";
import { CalculatorIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Button, Heading, HelpText, HStack, Modal, Table, VStack } from "@navikt/ds-react";
import { useMutationState } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormControlledSelectField } from "../../../../common/components/formFields/FormControlledSelectField";
import { FormControlledTextField } from "../../../../common/components/formFields/FormControlledTextField";
import { ResultatDescription } from "../../../../common/components/vedtak/ResultatDescription";
import {
    createSamværskalkulatorDefaultvalues,
    mapToSamværskalkulatoDetaljer,
} from "../../../../common/helpers/samværFormHelpers";
import { MutationKeys, useBeregnSamværsklasse } from "../../../../common/hooks/useApiData";
import { useDebounce } from "../../../../common/hooks/useDebounce";
import { hentVisningsnavn } from "../../../../common/hooks/useVisningsnavn";
import type { SamværBarnformvalues } from "../../../../common/types/samværFormValues";

interface SamværskalkulatorProps {
    fieldname: `${string}.perioder.${number}`;
    viewOnly?: boolean;
}
export const SamværskalkulatorForm = ({ fieldname, viewOnly = false }: SamværskalkulatorProps) => {
    const { control, watch, setValue } = useFormContext<SamværBarnformvalues>();

    const beregnSamværsklasseFn = useBeregnSamværsklasse();
    const beregning = useWatch({ control, name: `${fieldname}.beregning` });
    const ferier = useWatch({ control, name: `${fieldname}.beregning.ferier` });
    const samværsklasse = useWatch({ control, name: `${fieldname}.beregning.samværsklasse` });
    const sumGjennomsnittligSamværPerMåned = useWatch({
        control,
        name: `${fieldname}.beregning.gjennomsnittligSamværPerMåned`,
    });

    function beregnSamværsklasse() {
        beregnSamværsklasseFn.mutate(mapToSamværskalkulatoDetaljer({ ...beregning, isSaved: true }), {
            onSuccess: (data) => {
                beregnSamværsklasseFn.reset();
                setValue(`${fieldname}.samværsklasse`, data.samværsklasse);
                setValue(`${fieldname}.beregning.samværsklasse`, data.samværsklasse);
                setValue(`${fieldname}.beregning.gjennomsnittligSamværPerMåned`, data.gjennomsnittligSamværPerMåned);
            },
        });
    }
    const debouncedOnSave = useDebounce(beregnSamværsklasse);

    useEffect(() => {
        if (viewOnly) return;
        const subscription = watch((_, { name, type }) => {
            if (name?.includes("beregning") && type === "change") {
                debouncedOnSave();
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    if (ferier === undefined) return null;
    return (
        <VStack gap={"space-4"}>
            <BodyShort size="small" as="div">
                <HStack justify={"space-between"}>
                    <Heading size="xsmall">Regelmessig samvær</Heading>
                    {!viewOnly && (
                        <Button
                            size="xsmall"
                            variant="tertiary"
                            onClick={() => {
                                setValue(`${fieldname}.beregning`, createSamværskalkulatorDefaultvalues());
                            }}
                        >
                            Nullstill
                        </Button>
                    )}
                </HStack>
                {viewOnly ? (
                    <HStack gap="space-2">
                        <strong>Antall netter: </strong>
                        {beregning.regelmessigSamværNetter} / 14 dager
                    </HStack>
                ) : (
                    <HStack gap="space-1">
                        <FormControlledTextField
                            name={`${fieldname}.beregning.regelmessigSamværNetter`}
                            label={"Antall netter"}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={15}
                            step="0.1"
                        />
                        <BodyShort size="small" className="self-center h-0" as="div">
                            {" "}
                            /14 dager
                        </BodyShort>
                    </HStack>
                )}
            </BodyShort>

            <div>
                <Heading size="xsmall">Ferie</Heading>
                <Table size="small" className="table-fixed table bg-[white] w-full">
                    <Table.Header>
                        <Table.Row className="align-baseline">
                            <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[134px]">
                                {"Ferie"}
                            </Table.HeaderCell>
                            <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[100px]">
                                {"Bidragspliktig"}
                            </Table.HeaderCell>
                            <Table.HeaderCell textSize="small" scope="col" align="left" className="w-[100px]">
                                {"Bidragsmottaker"}
                            </Table.HeaderCell>
                            <Table.HeaderCell scope="col" className="w-[180px]">
                                {"Når"}
                            </Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {Object.entries(ferier).map(([ferietype, _item], index) => (
                            <Table.Row key={ferietype + "_" + index} className="align-top">
                                <Table.DataCell textSize="small">{hentVisningsnavn(ferietype)}</Table.DataCell>
                                <Table.DataCell textSize="small">
                                    {viewOnly ? (
                                        _item.bidragspliktigNetter
                                    ) : (
                                        <FormControlledTextField
                                            name={`${fieldname}.beregning.ferier.${ferietype}.bidragspliktigNetter`}
                                            label={""}
                                            hideLabel
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            step="0.1"
                                        />
                                    )}
                                </Table.DataCell>
                                <Table.DataCell textSize="small">
                                    {viewOnly ? (
                                        _item.bidragsmottakerNetter
                                    ) : (
                                        <FormControlledTextField
                                            name={`${fieldname}.beregning.ferier.${ferietype}.bidragsmottakerNetter`}
                                            label={""}
                                            hideLabel
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            step="0.1"
                                        />
                                    )}
                                </Table.DataCell>
                                <Table.DataCell textSize="small">
                                    {viewOnly ? (
                                        hentVisningsnavn(_item.frekvens)
                                    ) : (
                                        <FerieFrekvens
                                            fieldName={`${fieldname}.beregning.ferier.${ferietype}`}
                                            editableRow={true}
                                            item={_item?.frekvens}
                                        />
                                    )}
                                </Table.DataCell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>
            {samværsklasse && (
                <>
                    <HStack gap={"space-1"} align={"center"}>
                        <ResultatDescription
                            data={[
                                {
                                    label: "Beregning",
                                    textRight: false,
                                    value: beregnSamværsklasseFn.isError
                                        ? "Ukjent"
                                        : `Samværsklasse ${hentVisningsnavn(samværsklasse)} (samvær per måned: ${sumGjennomsnittligSamværPerMåned})`,
                                },
                            ].filter((d) => d)}
                        />
                        {!viewOnly && (
                            <HelpText>
                                Samværsfradraget regnes ut ifra samværsklasser. Det gjennomsnittlige samværet er delt i
                                fire samværsklasser.
                                <br /> <strong>Samværsklasse 0</strong> <br />0 - 1,99 netter/dager per måned
                                <br /> <strong>Samværsklasse 1</strong> <br />2 - 3,99 netter/dager per måned
                                <br />
                                <strong>Samværsklasse 2</strong>
                                <br />4 - 8,99 netter per måned
                                <br /> <strong>Samværsklasse 3</strong> <br />9 - 13,99 netter per måned
                                <br /> <strong>Samværsklasse 4</strong> <br />
                                14 - 15 netter per måned
                            </HelpText>
                        )}
                    </HStack>
                    {beregnSamværsklasseFn.isError && !viewOnly && (
                        <Alert size="small" variant={"error"}>
                            Det skjedde en feil ved beregning av samværsklasse
                        </Alert>
                    )}
                </>
            )}
        </VStack>
    );
};

const FerieFrekvens = ({
    editableRow,
    fieldName,
    item,
}: {
    editableRow: boolean;
    fieldName: `${string}.perioder.${number}.beregning.ferier.${string}`;
    item: SamvaerskalkulatorNetterFrekvens;
}) => {
    const { clearErrors } = useFormContext<SamværBarnformvalues>();

    const options = Object.values(SamvaerskalkulatorNetterFrekvens);

    return editableRow ? (
        <FormControlledSelectField
            name={`${fieldName}.frekvens`}
            className="w-fit"
            label={""}
            options={options.map((value) => ({
                value,
                text: hentVisningsnavn(value),
            }))}
            hideLabel
            onSelect={() => clearErrors(`${fieldName}.frekvens`)}
        />
    ) : (
        <div className="h-8 flex items-center">{hentVisningsnavn(item)}</div>
    );
};

interface SamværskalkulatorButtonProps {
    editableRow: boolean;
    fieldname: `${string}.perioder.${number}`;
}
export const SamværskalkulatorButton = ({ fieldname, editableRow }: SamværskalkulatorButtonProps) => {
    const ref = useRef<HTMLDialogElement>(null);
    const { control, getValues, setValue, setError, getFieldState, clearErrors } =
        useFormContext<SamværBarnformvalues>();
    const beregnSamværsklasseFnStates = useMutationState({
        filters: { mutationKey: MutationKeys.beregnSamværsklasse() },
    });
    const previousBeregning = useRef(getValues(`${fieldname}.beregning`));
    const beregning = useWatch({ control, name: `${fieldname}.beregning` });
    const onSave = () => {
        const regelmessigSamværNetter = getValues(`${fieldname}.beregning.regelmessigSamværNetter`);
        if (regelmessigSamværNetter != null && regelmessigSamværNetter > 15) {
            setError(`${fieldname}.beregning.regelmessigSamværNetter`, {
                type: "notValid",
                message: "Antall netter må være mindre eller lik 15",
            });
        }
        const fieldState = getFieldState(`${fieldname}.beregning`);

        if (!fieldState.error) {
            clearErrors(`${fieldname}.beregning`);
            ref.current?.close();
            setValue(`${fieldname}.beregning.isSaved`, true);
        }
    };

    const closeAndCancel = () => {
        setValue(`${fieldname}.beregning`, previousBeregning.current);
        ref.current?.close();
    };

    if (!editableRow) return null;

    const beregnSamværsklasseFnState = beregnSamværsklasseFnStates
        ? beregnSamværsklasseFnStates[beregnSamværsklasseFnStates.length - 1]
        : undefined;
    return (
        <>
            <Button
                variant="tertiary"
                size="xsmall"
                onClick={() => {
                    ref.current?.showModal();
                    previousBeregning.current = beregning;
                }}
                icon={<CalculatorIcon />}
            >
                Samværskalkulator
            </Button>
            <Modal ref={ref} header={{ heading: "Samværskalkulator" }} className="text-left">
                <Modal.Body>
                    <SamværskalkulatorForm fieldname={fieldname} />
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        size="xsmall"
                        variant="primary"
                        onClick={onSave}
                        disabled={beregnSamværsklasseFnState?.status === "error"}
                    >
                        Lagre
                    </Button>
                    <Button size="xsmall" variant="secondary" onClick={closeAndCancel}>
                        Avbryt
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};
