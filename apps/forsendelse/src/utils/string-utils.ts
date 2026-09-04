export function isStringEmpty(str?: string | null): boolean {
    return str === undefined || str === null || str.trim().length === 0;
}
