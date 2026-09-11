// biome-ignore  lint/complexity/noStaticOnlyClass: Hjelpefunksjoner for string validering.
export class StringUtils {
    static isEmpty(str?: string | null): boolean {
        return isStringEmpty(str);
    }
}

export function removeNonPrintableCharachters(value?: string): string {
    return value?.replace(/\p{C}/gu, "") ?? "";
}

export function isStringEmpty(str?: string | null): boolean {
    return str == null || !str || str.length === 0 || str.trim().length === 0;
}

export function capitalize(str?: string | null, capitalizeWords: boolean = true, toLowercase: boolean = true): string {
    if (isStringEmpty(str)) return "";
    const s = str as string;

    if (s?.length === 1) return s;
    const lowercase = toLowercase ? s.toLocaleLowerCase() : s;
    if (capitalizeWords) {
        return lowercase
            .split("-")
            .map((word) => capitalize(word, false, false))
            .join("-")
            .split(" ")
            .map((word) => capitalize(word, false, false))
            .join(" ");
    }
    return lowercase?.substring(0, 1).toUpperCase() + lowercase?.substring(1);
}
