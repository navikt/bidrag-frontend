export function skalRapportereEndring(harEndringer: boolean, hopperOverTilbakestilling: boolean): boolean {
    return !hopperOverTilbakestilling || harEndringer;
}
