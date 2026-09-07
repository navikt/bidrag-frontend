export type MaybeRouteId = string | number | null | undefined;

export const nullSafeNumber = (number?: string | number | null): number | null => {
    if (number === null || number === undefined) {
        return null;
    }
    if (typeof number === "number") {
        return number;
    }

    const value = typeof number === "string" ? number.trim() : String(number);
    if ("" === value) {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

export const numberAsString = (number?: string | number | null): string | null => {
    if (number === null || number === undefined) {
        return null;
    }
    if (typeof number === "string") {
        return number;
    }

    return typeof number === "number" ? number.toString() : String(number);
};
