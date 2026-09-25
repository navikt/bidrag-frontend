import type { ReellMottakerValg, ReellMottakerValgregel } from "./components/ReellMottakerValgGruppe";

export type ReellMottakerRegel =
    | { type: "skjult" }
    | { type: "etter-barn"; bidragsmottakerErUkjent: boolean }
    | { type: "alltid-samhandler" };

export type ReellMottakerSkjemaverdi = {
    reellMottakerType?: "ingen" | "barnet_selv" | "annen_person" | null;
    reellMottaker?: string | null;
    reellMottakerNavn?: string | null;
};

type Barn = {
    ident: string;
    navn: string;
};

export type ReellMottakerValideringsgrunn = "myndig-barn" | "ukjent-bidragsmottaker" | "alltid";

export type ReellMottakerFeil = {
    felt: "reellMottakerType" | "reellMottaker";
    melding: string;
};

/** Rollebildet: oppfostringsbidrag krever samhandler. Ellers avgjør barnets alder og om BM har ident. */
export function reellMottakerRegelForSak(
    erOppfostringsbidrag: boolean,
    bidragsmottakerIdent: string | undefined,
): Exclude<ReellMottakerRegel, { type: "skjult" }> {
    return erOppfostringsbidrag
        ? { type: "alltid-samhandler" }
        : { type: "etter-barn", bidragsmottakerErUkjent: !bidragsmottakerIdent };
}

export function reellMottakerValgregel(
    regel: Exclude<ReellMottakerRegel, { type: "skjult" }>,
    erMyndig: boolean,
): ReellMottakerValgregel {
    if (regel.type === "alltid-samhandler") {
        return "kun-samhandler";
    }

    return erMyndig || regel.bidragsmottakerErUkjent ? "påkrevd" : "valgfri";
}

export function tilReellMottakerValg(verdi: ReellMottakerSkjemaverdi, barn: Barn): ReellMottakerValg {
    if (verdi.reellMottakerType === "barnet_selv") {
        return { type: "barnet_selv", ident: barn.ident, navn: barn.navn };
    }

    if (verdi.reellMottakerType === "annen_person") {
        return {
            type: "samhandler",
            ident: verdi.reellMottaker || undefined,
            navn: verdi.reellMottakerNavn || undefined,
        };
    }

    return {};
}

export function fraReellMottakerValg(valg: ReellMottakerValg): ReellMottakerSkjemaverdi {
    return {
        reellMottakerType: valg.type === "samhandler" ? "annen_person" : (valg.type ?? "ingen"),
        reellMottaker: valg.ident ?? "",
        reellMottakerNavn: valg.navn ?? "",
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

export function initialiserReellMottaker(
    verdi: ReellMottakerSkjemaverdi,
    regel: ReellMottakerValgregel,
    barn: Barn,
): ReellMottakerSkjemaverdi {
    const valg = tilReellMottakerValg(verdi, barn);
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

    if (!verdi.reellMottakerType || verdi.reellMottakerType === "ingen") {
        const melding =
            grunn === "myndig-barn"
                ? "Reell mottaker må registreres for barn over 18 år"
                : grunn === "ukjent-bidragsmottaker"
                  ? "Reell mottaker må registreres når bidragsmottaker er ukjent"
                  : "Reell mottaker må registreres for hvert barn";

        feil.push({ felt: "reellMottakerType", melding });
    }

    if (verdi.reellMottakerType === "annen_person" && !verdi.reellMottaker?.trim()) {
        feil.push({ felt: "reellMottaker", melding: "Du må registrere reell mottaker" });
    }

    return feil;
}
