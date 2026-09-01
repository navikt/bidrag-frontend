import { formaterBelop } from "@bidrag/utils/belopUtils";
import { formaterDato } from "@bidrag/utils/datoUtils";

export const tekstEllerStrek = (verdi?: string | null): string => {
    if (!verdi?.trim()) return "-";
    return verdi;
};

export const belopEllerStrek = (belop?: number | null): string => {
    if (belop === null || belop === undefined) return "-";
    return formaterBelop(belop);
};

export const datoEllerStrek = (dato?: string | null): string => {
    if (!dato) return "-";
    return formaterDato(dato);
};
