export function formaterBelop(beløp: number | null | undefined): string {
    if (beløp == null) return "–";
    return new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(beløp);
}
