import {formatISO, parseISO} from "date-fns";

/**
 * Formaterer dato til norsk format
 */
export function formaterDato(dato?: string | null): string {
    if (!dato) return "-";
    return new Date(dato).toLocaleDateString("nb-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function sisteDagiMnd(dato: string): string | null {
    if (!dato || dato.length === 0) return null;
    const datoObj = new Date(dato);
    const sisteDag = new Date(datoObj.getFullYear(), datoObj.getMonth() + 1, 0);
    return formaterDato(sisteDag.toISOString());
}

export function toQueryParam(date: Date): string {
    return formatISO(date, {representation: "date"});
}

export function parseDateQueryParam(value: string | null): Date | undefined {
    if (!value) return undefined;
    return parseISO(value);
}

export function sortByDateAsc(a?: string | null, b?: string | null): number {
    // Manglende datoer sorteres sist, uavhengig av sorteringsretning
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;

    const timeA = Date.parse(a);
    const timeB = Date.parse(b);

    // Handle invalid date strings safely
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
        return 0;
    }
    return timeA - timeB;
}

export function sisteDagFramTilDato(dato: string): string | null {
    if (!dato || dato.length === 0) return null;
    const datoObj = new Date(dato);
    datoObj.setDate(datoObj.getDate() - 1);
    return formaterDato(datoObj.toISOString());
}
