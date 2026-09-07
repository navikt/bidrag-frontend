import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { type Sakskategori, useSaksrolleroversikt } from "../saksrolleroversiktContext";

type FormWithKategori = FieldValues & {
    kategori: Sakskategori;
};

export default function useSyncKategori<T extends FormWithKategori>(form: UseFormReturn<T>) {
    const { sakskategori, partISaken } = useSaksrolleroversikt();

    useEffect(() => {
        // Path<T>-resolusjon fungerer ikke for et generisk T, så vi caster til den konkrete formen her
        const kategoriForm = form as unknown as UseFormReturn<FormWithKategori>;
        const currentKategori = kategoriForm.getValues("kategori");
        if (currentKategori !== sakskategori) {
            kategoriForm.setValue("kategori", sakskategori, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
        }
    }, [form, sakskategori, partISaken]);

    return sakskategori;
}
