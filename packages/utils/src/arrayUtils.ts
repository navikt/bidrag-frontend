export function includesSomeElement(array1: string[], array2: string[]): boolean {
    return !!array1.find((i) => array2.includes(i));
}

export function unikeVerdier(values: (string | null | undefined)[]): string[] {
    return [...new Set(values.filter(Boolean) as string[])].sort();
}
