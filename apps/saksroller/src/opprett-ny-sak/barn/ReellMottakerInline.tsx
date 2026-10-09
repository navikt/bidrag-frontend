import { Box } from "@navikt/ds-react";
import { useEffect } from "react";
import { Controller, type FieldPath, type FieldValues, type PathValue, type UseFormReturn } from "react-hook-form";
import ReellMottakerValgGruppe, {
    type ReellMottakerValg,
    type ReellMottakerValgregel,
    useLagretSamhandler,
} from "../../felles/reell-mottaker/ReellMottakerValgGruppe";
import {
    fraReellMottakerValg,
    initialiserReellMottaker,
    type ReellMottakerSkjemaverdi,
    tilReellMottakerValg,
} from "../../felles/reell-mottaker/reell-mottaker-valg";
import { type ReellMottakerRegel, reellMottakerValgregel } from "../../felles/saksregler";

type Props<TFieldValues extends FieldValues> = {
    form: UseFormReturn<TFieldValues>;
    fieldPath: string;
    barnIdent: string;
    barnNavn: string;
    regel: ReellMottakerValgregel;
};

function ReellMottakerInline<TFieldValues extends FieldValues>({
    form,
    fieldPath,
    barnIdent,
    barnNavn,
    regel,
}: Props<TFieldValues>) {
    const reellMottakerTypePath = `${fieldPath}.reellMottakerType` as FieldPath<TFieldValues>;
    const reellMottakerPath = `${fieldPath}.reellMottaker` as FieldPath<TFieldValues>;
    const reellMottakerNavnPath = `${fieldPath}.reellMottakerNavn` as FieldPath<TFieldValues>;
    const setDynamiskFeltVerdi = (
        path: FieldPath<TFieldValues>,
        value: string | undefined,
        options?: Parameters<typeof form.setValue>[2],
    ) => form.setValue(path, value as PathValue<TFieldValues, FieldPath<TFieldValues>>, options);

    const reellMottakerType = form.watch(reellMottakerTypePath);
    const reellMottaker = form.watch(reellMottakerPath);
    const reellMottakerNavn = form.watch(reellMottakerNavnPath);
    const skjemaverdi: ReellMottakerSkjemaverdi = { reellMottakerType, reellMottaker, reellMottakerNavn };
    const reellMottakerFeil = form.getFieldState(reellMottakerPath, form.formState).error?.message;
    const valg = tilReellMottakerValg(skjemaverdi);
    const { lagretSamhandler, huskSamhandler } = useLagretSamhandler(valg);

    const settSkjemaverdi = (nyVerdi: ReellMottakerSkjemaverdi, options: Parameters<typeof form.setValue>[2]) => {
        setDynamiskFeltVerdi(reellMottakerTypePath, nyVerdi.reellMottakerType, options);
        setDynamiskFeltVerdi(reellMottakerPath, nyVerdi.reellMottaker, options);
        setDynamiskFeltVerdi(reellMottakerNavnPath, nyVerdi.reellMottakerNavn, options);
    };

    const oppdaterValg = (nyttValg: ReellMottakerValg) => {
        huskSamhandler(valg, nyttValg);
        settSkjemaverdi(fraReellMottakerValg(nyttValg), {
            shouldValidate: form.formState.isSubmitted,
            shouldDirty: true,
            shouldTouch: true,
        });
        if (form.formState.isSubmitted) form.trigger(reellMottakerTypePath);
    };

    useEffect(() => {
        const initialisert = initialiserReellMottaker(skjemaverdi, regel, {
            ident: barnIdent,
            navn: barnNavn,
        });
        if (
            initialisert.reellMottakerType === skjemaverdi.reellMottakerType &&
            initialisert.reellMottaker === skjemaverdi.reellMottaker &&
            initialisert.reellMottakerNavn === skjemaverdi.reellMottakerNavn
        ) {
            return;
        }

        settSkjemaverdi(initialisert, {
            shouldValidate: form.formState.isSubmitted,
            shouldDirty: true,
            shouldTouch: true,
        });
    }, [
        barnIdent,
        barnNavn,
        form,
        regel,
        reellMottaker,
        reellMottakerNavnPath,
        reellMottakerNavn,
        reellMottakerPath,
        reellMottakerType,
        reellMottakerTypePath,
    ]);

    return (
        <Controller
            name={reellMottakerTypePath}
            control={form.control}
            render={({ fieldState }) => (
                <ReellMottakerValgGruppe
                    barnNavn={barnNavn}
                    barnIdent={barnIdent}
                    valg={valg}
                    lagretSamhandler={lagretSamhandler}
                    onValg={oppdaterValg}
                    regel={regel}
                    feil={fieldState.error?.message ?? reellMottakerFeil}
                />
            )}
        />
    );
}

/** Reell mottaker for et valgt barn i `valgteBarn`, eller ingenting når regelen skjuler valget. */
export function BarnReellMottaker<TFieldValues extends FieldValues>({
    form,
    barn,
    barnIndex,
    regel,
    valgt,
}: {
    form: UseFormReturn<TFieldValues>;
    barn: { ident: string; navn: string; erMyndig: boolean };
    barnIndex: number;
    regel: ReellMottakerRegel;
    valgt: boolean;
}) {
    const valgregel = reellMottakerValgregel(regel, barn.erMyndig);
    if (!valgregel) {
        return null;
    }
    if (!valgt || barnIndex === -1) {
        return (
            <Box marginBlock="space-4 space-0" paddingBlock="space-4 space-0">
                <ReellMottakerValgGruppe
                    barnNavn={barn.navn}
                    barnIdent={barn.ident}
                    valg={{}}
                    lagretSamhandler={null}
                    onValg={() => {}}
                    regel={valgregel}
                    disabled
                />
            </Box>
        );
    }
    return (
        <Box marginBlock="space-4 space-0" paddingBlock="space-4 space-0">
            <ReellMottakerInline
                form={form}
                fieldPath={`valgteBarn.${barnIndex}`}
                barnIdent={barn.ident}
                barnNavn={barn.navn}
                regel={valgregel}
            />
        </Box>
    );
}
