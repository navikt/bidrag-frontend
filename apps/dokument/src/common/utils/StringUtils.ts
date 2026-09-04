export function capitalizeFirstLetter(s: string) {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function removeNonPrintableCharachters(s: string) {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: fjerner bevisst ikke-utskrivbare kontrolltegn fra strengen
    return s?.replace(/[\u0000-\u001F]/g, "");
}

export function convertStringToNumber(value: string | number): number {
    if (typeof value === "string") {
        const result = parseInt(value, 10);
        return Number.isNaN(result) ? 0 : result;
    }
    return value;
}
