import type { ReellMottakerValg, ReellMottakerValgregel } from "./ReellMottakerValgGruppe";
import type { ReellMottakerSkjemaverdi } from "./reell-mottaker-regler";
import { erPersonSomReellMottaker } from "./reell-mottaker-regler";

type Barn = {
    ident: string;
    navn: string;
};

export function tilReellMottakerValg(verdi: ReellMottakerSkjemaverdi): ReellMottakerValg {
    return {
        type: verdi.reellMottakerType,
        ident: verdi.reellMottaker,
        navn: verdi.reellMottakerNavn,
        mottakertype: verdi.reellMottakerType === "barnet_selv" ? "PERSON" : verdi.reellMottakerEntitetstype,
        verge: verdi.reellMottakerErVerge,
    };
}

export function fraReellMottakerValg(valg: ReellMottakerValg): ReellMottakerSkjemaverdi {
    const mottakertype = valg.type === "barnet_selv" ? "PERSON" : valg.mottakertype;
    const kanBevareUkjentVerge = valg.type === "samhandler" && valg.mottakertype === undefined;
    return {
        reellMottakerType: valg.type,
        reellMottaker: valg.ident,
        ...(mottakertype ? { reellMottakerEntitetstype: mottakertype } : {}),
        reellMottakerNavn: valg.navn,
        ...((erPersonSomReellMottaker(valg) || kanBevareUkjentVerge) && valg.verge !== undefined
            ? { reellMottakerErVerge: valg.verge }
            : {}),
    };
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

export const MANGLER_REELL_MOTTAKER_MELDING = "Velg eller søk opp en reell mottaker før du legger til.";

export function initialiserReellMottaker(
    verdi: ReellMottakerSkjemaverdi,
    regel: ReellMottakerValgregel,
    barn: Barn,
): ReellMottakerSkjemaverdi {
    const valg = tilReellMottakerValg(verdi);
    const initialisert = initialiserValg(valg, regel, barn);
    return initialisert === valg ? verdi : fraReellMottakerValg(initialisert);
}
