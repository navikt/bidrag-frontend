import type { z } from "zod";
import type { ReellMottakerFelterSchema } from "../sakvisning-schema";
import type { ReellMottakerValg, ReellMottakerValgregel } from "./ReellMottakerValgGruppe";

export type ReellMottakerSkjemaverdi = z.infer<typeof ReellMottakerFelterSchema>;

type Barn = {
    ident: string;
    navn: string;
};

export type ReellMottakerValideringsgrunn = "myndig-barn" | "ukjent-bidragsmottaker" | "alltid";

export type ReellMottakerFeil = {
    felt: "reellMottakerType" | "reellMottaker";
    melding: string;
};

export function tilReellMottakerValg(verdi: ReellMottakerSkjemaverdi): ReellMottakerValg {
    return { type: verdi.reellMottakerType, ident: verdi.reellMottaker, navn: verdi.reellMottakerNavn };
}

export function fraReellMottakerValg(valg: ReellMottakerValg): ReellMottakerSkjemaverdi {
    return { reellMottakerType: valg.type, reellMottaker: valg.ident, reellMottakerNavn: valg.navn };
}

/** Startvalg når regelen krever reell mottaker. Beholder valget når det allerede oppfyller regelen. */
export function initialiserValg(valg: ReellMottakerValg, regel: ReellMottakerValgregel, barn: Barn): ReellMottakerValg {
    if (regel === "valgfri") {
        return valg;
    }

    if (regel === "kun-samhandler") {
        return valg.type === "samhandler" ? valg : { type: "samhandler" };
    }

    return valg.type ? valg : { type: "barnet_selv", ident: barn.ident, navn: barn.navn };
}

export function initialiserReellMottaker(
    verdi: ReellMottakerSkjemaverdi,
    regel: ReellMottakerValgregel,
    barn: Barn,
): ReellMottakerSkjemaverdi {
    const valg = tilReellMottakerValg(verdi);
    const initialisert = initialiserValg(valg, regel, barn);
    return initialisert === valg ? verdi : fraReellMottakerValg(initialisert);
}

export function validerReellMottaker(
    verdi: ReellMottakerSkjemaverdi,
    grunn: ReellMottakerValideringsgrunn | null,
): ReellMottakerFeil[] {
    if (!grunn) {
        return [];
    }

    const feil: ReellMottakerFeil[] = [];

    if (!verdi.reellMottakerType) {
        const melding =
            grunn === "myndig-barn"
                ? "Reell mottaker må registreres for barn over 18 år"
                : grunn === "ukjent-bidragsmottaker"
                  ? "Reell mottaker må registreres når bidragsmottaker er ukjent"
                  : "Reell mottaker må registreres for hvert barn";

        feil.push({ felt: "reellMottakerType", melding });
    }

    if (verdi.reellMottakerType === "samhandler" && !verdi.reellMottaker?.trim()) {
        feil.push({ felt: "reellMottaker", melding: "Du må registrere reell mottaker" });
    }

    return feil;
}
