import { z } from "zod";
import { type SakParter, type Saksfeil, type Sakstype, validerSak } from "./saksregler";

const RolleTypeSchema = z.enum(["BP", "BM", "BA", "RM"]);

export const DiskresjonskodeSchema = z.enum(["SPSF", "SPFO", "URIK", "MILI", "PEND", "SVAL", "P19"]);

const RollehistorikkSchema = z.object({
    fodselsnummer: z.string().optional(),
    type: z.string().optional(),
    reellMottaker: z.string().optional(),
    typeEndring: z.string().optional(),
    opprettetAv: z.string().optional(),
    opprettetDato: z.date().optional(),
});

const RolleSchema = z.object({
    fodselsnummer: z.string(),
    type: RolleTypeSchema,
    objektnummer: z.string(),
    reellMottager: z.string().optional(),
    reellMottaker: z.string().optional(),
    reellMottakerType: z.string().optional(),
    reellMottakerNavn: z.string().optional(),
    mottagerErVerge: z.boolean(),
    samhandlerIdent: z.string().optional(),
    foedselsnummer: z.string().optional(),
    rolleType: RolleTypeSchema,
    navn: z.string().optional(),
    fødselsdato: z.string().optional(),
    diskresjonskode: DiskresjonskodeSchema.optional(),
    rollehistorikk: z.array(RollehistorikkSchema).optional(),
    alder: z.number().optional(),
    erMyndig: z.boolean().optional(),
});

/** Reell mottaker slik den lagres i skjemaet, både i rollebildet og i opprett. `undefined` betyr ingen. */
export const ReellMottakerFelterSchema = z.object({
    reellMottakerType: z.enum(["barnet_selv", "samhandler"]).optional(),
    reellMottaker: z.string().optional(),
    reellMottakerNavn: z.string().optional(),
});

const BarnRolleSchema = RolleSchema.extend(ReellMottakerFelterSchema.shape);

const SakRedigeringObjektSchema = z.object({
    saksnummer: z.string(),
    roller: z.array(RolleSchema),
});

function tilSakParter(roller: Rolle[]): SakParter {
    const ident = (type: RolleType) => roller.find((r) => r.type === type && r.fodselsnummer?.trim())?.fodselsnummer;
    const bm = ident("BM");
    return {
        bp: ident("BP"),
        bm,
        bidragsmottakerErUkjent: !bm,
        barn: roller
            .filter(erBarn)
            .map((barn) => ({ ...(barn as BarnRolle), ident: barn.fodselsnummer, erMyndig: barn.erMyndig === true })),
    };
}

function feltsti(roller: Rolle[], feil: Saksfeil): (string | number)[] {
    if (feil.gjelder === "barn") {
        const indeks = roller.flatMap((rolle, i) => (erBarn(rolle) ? [i] : []))[feil.indeks];
        return indeks === undefined ? ["roller", "root"] : ["roller", indeks, "reellMottaker"];
    }
    if (feil.gjelder === "barnliste") return ["roller", "root"];
    const indeks = roller.findIndex((r) => r.type === feil.gjelder);
    return indeks >= 0 ? ["roller", indeks, "fodselsnummer"] : ["roller", "root"];
}

/** Skjema for endring av roller. Reglene er de samme som når saken opprettes, gitt sakens faste sakstype. */
export function lagSakRedigeringSchema(sakstype: Sakstype) {
    return SakRedigeringObjektSchema.superRefine((data, ctx) => {
        for (const feil of validerSak(tilSakParter(data.roller), sakstype)) {
            ctx.addIssue({ code: "custom", path: feltsti(data.roller, feil), message: feil.melding });
        }
    });
}

export type SakRedigeringData = z.infer<typeof SakRedigeringObjektSchema>;
export type RolleType = z.infer<typeof RolleTypeSchema>;
export type Rolle = z.infer<typeof RolleSchema>;
export type BarnRolle = z.infer<typeof BarnRolleSchema>;
export type Rollehistorikk = z.infer<typeof RollehistorikkSchema>;
export type Diskresjonskode = z.infer<typeof DiskresjonskodeSchema>;

export function erBarn(rolle: Rolle): boolean {
    return rolle.type === "BA";
}
