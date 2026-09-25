import { Box } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import { Controller, type FieldPath, type FieldValues, type PathValue, type UseFormReturn } from "react-hook-form";
import ReellMottakerValgGruppe, { type ReellMottakerValgregel } from "../../components/ReellMottakerValgGruppe";
import {
    fraReellMottakerValg,
    initialiserReellMottaker,
    type ReellMottakerRegel,
    reellMottakerValgregel,
    tilReellMottakerValg,
} from "../reell-mottaker-regel";

type Props<TFieldValues extends FieldValues> = {
    form: UseFormReturn<TFieldValues>;
    fieldPath: string;
    barnIdent: string;
    barnNavn: string;
    regel: ReellMottakerValgregel;
};

export default function ReellMottakerInline<TFieldValues extends FieldValues>({
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
        value: string,
        options?: Parameters<typeof form.setValue>[2],
    ) => form.setValue(path, value as PathValue<TFieldValues, FieldPath<TFieldValues>>, options);

    const reellMottakerType = form.watch(reellMottakerTypePath);
    const reellMottaker = form.watch(reellMottakerPath);
    const reellMottakerNavn = form.watch(reellMottakerNavnPath);
    const reellMottakerFeil = form.getFieldState(reellMottakerPath, form.formState).error?.message;
    const skjemaverdi = {
        reellMottakerType:
            reellMottakerType === "ingen" || reellMottakerType === "barnet_selv" || reellMottakerType === "annen_person"
                ? reellMottakerType
                : undefined,
        reellMottaker: typeof reellMottaker === "string" ? reellMottaker : undefined,
        reellMottakerNavn: typeof reellMottakerNavn === "string" ? reellMottakerNavn : undefined,
    };
    const [lagretSamhandler, setLagretSamhandler] = useState<{ ident: string; navn: string } | null>(() =>
        reellMottakerType === "annen_person" && reellMottaker && reellMottakerNavn
            ? { ident: String(reellMottaker), navn: String(reellMottakerNavn) }
            : null,
    );

    const valg = tilReellMottakerValg(skjemaverdi, { ident: barnIdent, navn: barnNavn });

    const settSkjemaverdi = (
        nyVerdi: ReturnType<typeof fraReellMottakerValg>,
        options: Parameters<typeof form.setValue>[2],
    ) => {
        setDynamiskFeltVerdi(reellMottakerTypePath, nyVerdi.reellMottakerType ?? "ingen", options);
        setDynamiskFeltVerdi(reellMottakerPath, nyVerdi.reellMottaker ?? "", options);
        setDynamiskFeltVerdi(reellMottakerNavnPath, nyVerdi.reellMottakerNavn ?? "", options);
    };

    const oppdaterValg = (nyttValg: Parameters<typeof fraReellMottakerValg>[0]) => {
        if (
            reellMottakerType === "annen_person" &&
            reellMottaker &&
            reellMottakerNavn &&
            nyttValg.type !== "samhandler"
        ) {
            setLagretSamhandler({ ident: String(reellMottaker), navn: String(reellMottakerNavn) });
        }

        if (nyttValg.type === "samhandler" && nyttValg.ident && nyttValg.navn) {
            setLagretSamhandler({ ident: nyttValg.ident, navn: nyttValg.navn });
        }

        settSkjemaverdi(fraReellMottakerValg(nyttValg), {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        form.trigger(reellMottakerTypePath);
    };

    useEffect(() => {
        const initialisert = initialiserReellMottaker(skjemaverdi, regel, {
            ident: barnIdent,
            navn: barnNavn,
        });
        if (
            initialisert.reellMottakerType === skjemaverdi.reellMottakerType &&
            (initialisert.reellMottaker ?? "") === (skjemaverdi.reellMottaker ?? "") &&
            (initialisert.reellMottakerNavn ?? "") === (skjemaverdi.reellMottakerNavn ?? "")
        ) {
            return;
        }

        settSkjemaverdi(initialisert, {
            shouldValidate: true,
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
}: {
    form: UseFormReturn<TFieldValues>;
    barn: { ident: string; navn: string; erMyndig: boolean };
    barnIndex: number;
    regel: ReellMottakerRegel;
}) {
    if (regel.type === "skjult" || barnIndex === -1) {
        return null;
    }
    return (
        <Box marginBlock="space-4 space-0" paddingBlock="space-4 space-0">
            <ReellMottakerInline
                form={form}
                fieldPath={`valgteBarn.${barnIndex}`}
                barnIdent={barn.ident}
                barnNavn={barn.navn}
                regel={reellMottakerValgregel(regel, barn.erMyndig)}
            />
        </Box>
    );
}
