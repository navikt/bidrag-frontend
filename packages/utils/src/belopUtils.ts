export function formaterBelop(beløp: number | null | undefined): string {
    if (beløp == null) return "–";
    return new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(beløp);
}

export function sumNullable(...values: (number | null | undefined)[]): number {
    return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}
