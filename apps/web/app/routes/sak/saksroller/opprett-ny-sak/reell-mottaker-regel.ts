import type { ReellMottakerValgregel } from "../components/ReellMottakerValgGruppe";

export type ReellMottakerRegel =
    | { type: "skjult" }
    | { type: "etter-barn"; bidragsmottakerErUkjent: boolean }
    | { type: "alltid-samhandler" };

export function reellMottakerValgregel(
    regel: Exclude<ReellMottakerRegel, { type: "skjult" }>,
    erMyndig: boolean,
): ReellMottakerValgregel {
    if (regel.type === "alltid-samhandler") {
        return "kun-samhandler";
    }

    return erMyndig || regel.bidragsmottakerErUkjent ? "påkrevd" : "valgfri";
}
