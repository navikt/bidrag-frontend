export function capitalizeFirstLetter(s: string) {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function removeNonPrintableCharachters(s: string) {
    // eslint-disable-next-line no-control-regex
    return s?.replace(/[\x00-\x1F]/g, "");
}

export function convertStringToNumber(value: string | number): number {
    if (typeof value === "string") {
        const result = parseInt(value, 10);
        return isNaN(result) ? 0 : result;
    }
    return value;
}
