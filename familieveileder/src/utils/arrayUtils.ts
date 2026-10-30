/**
 * Sjekker om minst ett element i `array1` også finnes i `array2`.
 */
export function includesSomeElement(array1: string[], array2: string[]): boolean {
    return array1.some((i) => array2.includes(i));
}
