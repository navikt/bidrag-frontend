import type { z } from "zod";
import type { ReellMottakerFelterSchema } from "../sakvisning-schema";
import type { ReellMottakerValg, ReellMottakerValgregel } from "./ReellMottakerValgGruppe";

export type ReellMottakerSkjemaverdi = z.infer<typeof ReellMottakerFelterSchema>;

export type ReellMottakerValideringsgrunn = "myndig-barn" | "ukjent-bidragsmottaker" | "alltid";

export type ReellMottakerFeil = {
    felt: "reellMottakerType" | "reellMottaker" | "reellMottakerEntitetstype";
    melding: string;
};

export type ReellMottakerSammenligning = {
    type?: string;
    ident?: string;
    mottakertype?: ReellMottakerValg["mottakertype"];
    verge?: boolean;
};

/** Verge kan bare registreres når reell mottaker er en annen person enn barnet, som i Bisys. */
export function erPersonSomReellMottaker(valg: ReellMottakerValg): boolean {
    return valg.type === "samhandler" && Boolean(valg.ident) && valg.mottakertype === "PERSON";
}

export function kanBekrefteReellMottaker(
    valg: ReellMottakerValg,
    regel: ReellMottakerValgregel | undefined,
    allowUnchangedLegacyType = false,
): boolean {
    if (regel === "kun-samhandler") {
        return (
            (valg.type === "samhandler" && Boolean(valg.ident?.trim()) && valg.mottakertype === "SAMHANDLER") ||
            (allowUnchangedLegacyType &&
                valg.type === "samhandler" &&
                Boolean(valg.ident?.trim()) &&
                valg.mottakertype === undefined)
        );
    }
    if (valg.type === "samhandler") {
        return Boolean(valg.ident);
    }
    const påkrevd = regel !== undefined && regel !== "valgfri";
    return !påkrevd || (valg.type === "barnet_selv" && Boolean(valg.ident));
}

export function validerReellMottaker(
    verdi: ReellMottakerSkjemaverdi,
    grunn: ReellMottakerValideringsgrunn | null,
    allowUnchangedLegacyType = false,
    barnIdent?: string,
): ReellMottakerFeil[] {
    const feil: ReellMottakerFeil[] = [];
    const reellMottakerIdent = verdi.reellMottaker?.trim();
    const barnetsIdent = barnIdent?.trim();
    const barnetErFeilaktigMerketSamhandler =
        verdi.reellMottakerType === "barnet_selv" && verdi.reellMottakerEntitetstype === "SAMHANDLER";
    const erTillattKunSamhandler = kanBekrefteReellMottaker(
        {
            type: verdi.reellMottakerType,
            ident: verdi.reellMottaker,
            mottakertype: verdi.reellMottakerType === "barnet_selv" ? "PERSON" : verdi.reellMottakerEntitetstype,
        },
        "kun-samhandler",
        allowUnchangedLegacyType,
    );

    if (barnetErFeilaktigMerketSamhandler) {
        feil.push({
            felt: "reellMottakerEntitetstype",
            melding: "Barnet selv kan ikke ha mottakertype samhandler",
        });
    }
    if (barnetsIdent && verdi.reellMottakerType === "barnet_selv" && reellMottakerIdent !== barnetsIdent) {
        feil.push({
            felt: "reellMottaker",
            melding: "Når barnet selv er reell mottaker, må barnets identitet være valgt",
        });
    }
    if (barnetsIdent && verdi.reellMottakerType === "samhandler" && reellMottakerIdent === barnetsIdent) {
        feil.push({ felt: "reellMottaker", melding: "Barnet kan ikke velges som sin egen reelle mottaker" });
    }

    if (!grunn) {
        return feil;
    }

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

    if (
        grunn === "alltid" &&
        verdi.reellMottaker?.trim() &&
        !erTillattKunSamhandler &&
        !barnetErFeilaktigMerketSamhandler
    ) {
        feil.push({
            felt: "reellMottakerEntitetstype",
            melding: "Reell mottaker må være en registrert samhandler",
        });
    }

    return feil;
}

export function erSammeMottakerUtenType(
    current: ReellMottakerSammenligning,
    original: ReellMottakerSammenligning,
): boolean {
    return (
        current.type === "samhandler" &&
        original.type === "samhandler" &&
        Boolean(current.ident?.trim()) &&
        current.ident === original.ident &&
        current.mottakertype === undefined &&
        original.mottakertype === undefined
    );
}

export function erUendretMottakerUtenType(
    current: ReellMottakerSammenligning,
    original: ReellMottakerSammenligning,
): boolean {
    return erSammeMottakerUtenType(current, original) && (current.verge ?? false) === (original.verge ?? false);
}
