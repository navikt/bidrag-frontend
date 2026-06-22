export function removePlaceholder(stringWithPlaceholders: string, ...args: string[]): string {
    return args.reduce((s, v) => s.replace("{}", v), stringWithPlaceholders);
}

export function capitalizeFirstLetterAndLowercaseRest(str) {
    if (typeof str !== "string" || str.length === 0) {
        return "";
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalizeFirstLetter(str) {
    if (typeof str !== "string" || str.length === 0) {
        return str; // Handle empty strings or non-string inputs
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}
