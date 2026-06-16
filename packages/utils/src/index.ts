export function formatKroner(beløp: number): string {
    return new Intl.NumberFormat("nb-NO", {
        style: "currency",
        currency: "NOK",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(beløp);
}

export function formatNumber(tall: number): string {
    return new Intl.NumberFormat("nb-NO").format(tall);
}

export function formatDato(isoString: string): string {
    return new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(isoString));
}

export function formatDatoTid(isoString: string): string {
    return new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(isoString));
}

export function isNonEmpty<T>(arr: T[] | undefined | null): arr is [T, ...T[]] {
    return Array.isArray(arr) && arr.length > 0;
}
