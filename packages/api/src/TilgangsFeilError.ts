export class TilgangsFeilError extends Error {
    constructor(message: string = "Du har ikke tilgang til denne ressursen") {
        super(message);
        this.name = "TilgangsFeilError";
    }
}
