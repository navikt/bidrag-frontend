import { useEffect, useState } from "react";
import { Controller, type FieldPath, type FieldValues, type PathValue, type UseFormReturn } from "react-hook-form";
import ReellMottakerValgGruppe, {
    type ReellMottakerValg,
    type ReellMottakerValgregel,
} from "../../components/ReellMottakerValgGruppe";

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
    const erPåkrevd = regel !== "valgfri";
    const kunSamhandler = regel === "kun-samhandler";
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
    const [lagretSamhandler, setLagretSamhandler] = useState<{ ident: string; navn: string } | null>(() =>
        reellMottakerType === "annen_person" && reellMottaker && reellMottakerNavn
            ? { ident: String(reellMottaker), navn: String(reellMottakerNavn) }
            : null,
    );

    const valg: ReellMottakerValg =
        reellMottakerType === "barnet_selv"
            ? { type: "barnet_selv", ident: barnIdent, navn: barnNavn }
            : reellMottakerType === "annen_person"
              ? {
                    type: "samhandler",
                    ident: reellMottaker ? String(reellMottaker) : undefined,
                    navn: reellMottakerNavn ? String(reellMottakerNavn) : undefined,
                }
              : {};

    const oppdaterValg = (nyttValg: ReellMottakerValg) => {
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

        setDynamiskFeltVerdi(
            reellMottakerTypePath,
            nyttValg.type === "samhandler" ? "annen_person" : (nyttValg.type ?? "ingen"),
            { shouldValidate: true, shouldDirty: true, shouldTouch: true },
        );
        setDynamiskFeltVerdi(reellMottakerPath, nyttValg.ident ?? "", {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        setDynamiskFeltVerdi(reellMottakerNavnPath, nyttValg.navn ?? "", {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        form.trigger(reellMottakerTypePath);
    };

    useEffect(() => {
        if (!kunSamhandler || reellMottakerType !== "barnet_selv") {
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
    }, [form, kunSamhandler, reellMottakerNavnPath, reellMottakerPath, reellMottakerType, reellMottakerTypePath]);

    useEffect(() => {
        if (!erPåkrevd) {
            return;
        }
        if (reellMottakerType && reellMottakerType !== "ingen") {
            return;
        }

        if (kunSamhandler) {
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
        erPåkrevd,
        kunSamhandler,
        reellMottakerNavnPath,
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
                    feil={fieldState.error?.message}
                />
            )}
        />
    );
}
