import { Alert, BodyShort, Box, HGrid, HStack, Radio, RadioGroup, Tag } from "@navikt/ds-react";
import { useEffect } from "react";
import { Controller, type FieldPath, type FieldValues, type PathValue, type UseFormReturn } from "react-hook-form";
import FunnetPersonInfo from "../../components/FunnetPersonInfo";
import ReellMottakerSøk from "../../components/ReellMottakerSøk";

type Props<TFieldValues extends FieldValues> = {
    form: UseFormReturn<TFieldValues>;
    fieldPath: string;
    barnIdent: string;
    barnNavn: string;
    isRequired: boolean;
    kunSamhandlerSomReellMottaker?: boolean;
};

export default function ReellMottakerInline<TFieldValues extends FieldValues>({
    form,
    fieldPath,
    barnIdent,
    barnNavn,
    isRequired,
    kunSamhandlerSomReellMottaker = false,
}: Props<TFieldValues>) {
    const reellMottakerTypePath = `${fieldPath}.reellMottakerType` as FieldPath<TFieldValues>;
    const reellMottakerPath = `${fieldPath}.reellMottaker` as FieldPath<TFieldValues>;
    const reellMottakerNavnPath = `${fieldPath}.reellMottakerNavn` as FieldPath<TFieldValues>;
    const kunSamhandlerFeilmelding =
        "Barnet selv kan ikke velges som reell mottaker i oppfostringsbidrag. Velg samhandler (kommune).";

    const setDynamiskFeltVerdi = (
        path: FieldPath<TFieldValues>,
        value: string,
        options?: Parameters<typeof form.setValue>[2],
    ) => form.setValue(path, value as PathValue<TFieldValues, FieldPath<TFieldValues>>, options);

    const reellMottakerType = form.watch(reellMottakerTypePath);
    const reellMottaker = form.watch(reellMottakerPath);
    const reellMottakerNavn = form.watch(reellMottakerNavnPath);

    useEffect(() => {
        if (!kunSamhandlerSomReellMottaker || reellMottakerType !== "barnet_selv") {
            return;
        }

        setDynamiskFeltVerdi(reellMottakerTypePath, "annen_person", {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        setDynamiskFeltVerdi(reellMottakerPath, "", {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        setDynamiskFeltVerdi(reellMottakerNavnPath, "", {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
    }, [
        form,
        kunSamhandlerFeilmelding,
        kunSamhandlerSomReellMottaker,
        reellMottakerNavnPath,
        reellMottakerPath,
        reellMottakerType,
        reellMottakerTypePath,
    ]);

    useEffect(() => {
        if (!isRequired) {
            return;
        }
        if (reellMottakerType && reellMottakerType !== "ingen") {
            return;
        }

        if (kunSamhandlerSomReellMottaker) {
            setDynamiskFeltVerdi(reellMottakerTypePath, "annen_person", {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            });
            setDynamiskFeltVerdi(reellMottakerPath, "", {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            });
            setDynamiskFeltVerdi(reellMottakerNavnPath, "", {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            });
            return;
        }

        setDynamiskFeltVerdi(reellMottakerTypePath, "barnet_selv", {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        setDynamiskFeltVerdi(reellMottakerPath, barnIdent, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        setDynamiskFeltVerdi(reellMottakerNavnPath, barnNavn, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
    }, [
        barnIdent,
        barnNavn,
        form,
        isRequired,
        kunSamhandlerSomReellMottaker,
        reellMottakerNavnPath,
        reellMottakerPath,
        reellMottakerType,
        reellMottakerTypePath,
    ]);

    return (
        <Controller
            name={reellMottakerTypePath}
            control={form.control}
            render={({ field, fieldState }) => (
                <RadioGroup
                    size="small"
                    legend={
                        <HStack align="center" justify="space-between" gap="space-8">
                            <BodyShort size="small" weight="semibold" textColor="default">
                                Reell mottaker
                            </BodyShort>
                            {isRequired ? (
                                <Tag size="xsmall" variant="warning">
                                    Påkrevd
                                </Tag>
                            ) : (
                                <BodyShort size="small" textColor="subtle">
                                    (valgfritt)
                                </BodyShort>
                            )}
                        </HStack>
                    }
                    value={field.value ?? "ingen"}
                    onChange={(value) => {
                        if (kunSamhandlerSomReellMottaker && value === "barnet_selv") {
                            setDynamiskFeltVerdi(reellMottakerTypePath, "annen_person", { shouldValidate: true });
                            setDynamiskFeltVerdi(reellMottakerPath, "", { shouldValidate: true });
                            setDynamiskFeltVerdi(reellMottakerNavnPath, "", { shouldValidate: true });
                            form.trigger(reellMottakerTypePath);
                            return;
                        }

                        field.onChange(value);
                        if (value === "barnet_selv") {
                            setDynamiskFeltVerdi(reellMottakerPath, barnIdent, { shouldValidate: true });
                            setDynamiskFeltVerdi(reellMottakerNavnPath, barnNavn, { shouldValidate: true });
                        } else if (value === "annen_person") {
                            setDynamiskFeltVerdi(reellMottakerPath, "", { shouldValidate: true });
                            setDynamiskFeltVerdi(reellMottakerNavnPath, "", { shouldValidate: true });
                        } else if (value === "ingen") {
                            setDynamiskFeltVerdi(reellMottakerPath, "", { shouldValidate: true });
                            setDynamiskFeltVerdi(reellMottakerNavnPath, "", { shouldValidate: true });
                        }
                        form.trigger(reellMottakerTypePath);
                    }}
                    error={fieldState.error?.message}
                >
                    <HGrid columns={{ xs: 1, sm: 3 }} gap="space-4" width="max-content">
                        <Radio value="ingen" disabled={isRequired}>
                            Ingen
                        </Radio>
                        <Radio disabled={kunSamhandlerSomReellMottaker} value="barnet_selv">
                            Barnet selv
                        </Radio>
                        <Radio value="annen_person">Søk samhandler</Radio>
                    </HGrid>
                    {kunSamhandlerSomReellMottaker && (
                        <Box asChild marginBlock="space-8 space-0">
                            <Alert variant="warning" size="small">
                                {kunSamhandlerFeilmelding}
                            </Alert>
                        </Box>
                    )}
                    {reellMottakerType === "annen_person" && (
                        <Box marginBlock="space-8 space-0" className="-mx-2">
                            <ReellMottakerSøk
                                valgtSamhandlerId={reellMottaker}
                                onVelg={(ident, navn) => {
                                    setDynamiskFeltVerdi(reellMottakerPath, ident, { shouldValidate: true });
                                    setDynamiskFeltVerdi(reellMottakerNavnPath, navn ?? "", { shouldValidate: true });
                                }}
                            />
                        </Box>
                    )}
                    {reellMottaker && reellMottakerType !== "barnet_selv" && (
                        <FunnetPersonInfo
                            label="Reell mottaker:"
                            navn={reellMottakerNavn || ""}
                            ident={reellMottaker}
                        />
                    )}
                </RadioGroup>
            )}
        />
    );
}
