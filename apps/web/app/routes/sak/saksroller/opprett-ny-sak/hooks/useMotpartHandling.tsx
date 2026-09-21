import type { PersonDto } from "@bidrag/api/PersonApi";
import type { UseFormReturn } from "react-hook-form";
import type { ForelderMedBarnSkjemaData, ForelderPartRolle, ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";
import { useSaksrolleroversikt } from "../saksrolleroversiktContext";
import { hentMotsattRolle } from "../utils";

type MotpartHandlingResult = {
    settMotpartUkjent: () => void;
    leggTilMotpartManuell: (person: PersonDto) => void;
};

/**
 * Hook for håndtering av motpart (sett ukjent, legg til manuelt)
 *
 * Brukes i:
 * - ForelderMedBarnFlyt
 * - ForelderUtenBarnFlyt
 *
 * @param form - React Hook Form instance
 * @param onMotpartChanged - Callback som kjøres når motpart endres (optional)
 *
 * @example
 * ```typescript
 * const { settMotpartUkjent, leggTilMotpartManuell } = useMotpartHandling(form, () => {
 *     console.log("Motpart ble endret!");
 * });
 * ```
 */
export function useMotpartHandling(
    form: UseFormReturn<ForelderMedBarnSkjemaData> | UseFormReturn<ForelderUtenBarnSkjemaData>,
    onMotpartChanged?: () => void,
): MotpartHandlingResult {
    const { partISaken } = useSaksrolleroversikt();
    // partISaken er normalt alltid satt når skjemaet vises, men typen er nullable i konteksten
    const motsattRolle = partISaken ? hentMotsattRolle(partISaken.rolle as ForelderPartRolle) : undefined;

    const settMotpartUkjent = () => {
        form.setValue("motpart", {
            ident: "",
            navn: "",
            erKjent: false,
            rolle: motsattRolle,
            diskresjonskode: undefined,
        });

        onMotpartChanged?.();
    };

    const leggTilMotpartManuell = (person: PersonDto) => {
        form.setValue("motpart", {
            ident: person.ident,
            navn: person.visningsnavn,
            erKjent: true,
            rolle: motsattRolle,
            diskresjonskode: person.diskresjonskode,
        });

        onMotpartChanged?.();
    };

    return {
        settMotpartUkjent,
        leggTilMotpartManuell,
    };
}
