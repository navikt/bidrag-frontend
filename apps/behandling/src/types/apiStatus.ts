export class FantIkkeVedtakEllerBehandlingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FantIkkeVedtakEllerBehandlingError";
    }
}
