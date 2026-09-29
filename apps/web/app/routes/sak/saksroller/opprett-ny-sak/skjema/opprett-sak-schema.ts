import { z } from "zod";
import { type SakParter, type Sakstype, validerSak } from "../../felles/saksregler";
// Samme forretningsregler gjelder for nye og eksisterende saker, så disse gjenbrukes fra
// sakvisning i stedet for å dupliseres.
import {
    DiskresjonskodeSchema,
    MAKS_ALDER_BARN,
    MYNDYG_BARN_ALDER,
    ReellMottakerFelterSchema,
} from "../../felles/sakvisning-schema";
import { tilForelderrolle } from "../parter/part-utils";

export { DiskresjonskodeSchema, MAKS_ALDER_BARN, MYNDYG_BARN_ALDER };

// ==================== BASE SCHEMAS ====================

const ArbeidsfordelingSchema = z.enum(["BBF", "EEN", "EFS", "FRS", "INH", "OPS"]);
export const PartRolleSchema = z.enum(["bidragspliktig", "bidragsmottaker", "barn_over_18", "barn_under_18"]);
const ForelderPartRolleSchema = z.enum(["bidragspliktig", "bidragsmottaker"]);
const PartISakenSchema = z.object({
    ident: z.string(),
    navn: z.string(),
    rolle: PartRolleSchema,
    diskresjonskode: DiskresjonskodeSchema.optional(),
    erKjent: z.boolean().optional(),
});

export const BarnMedAlderSchema = z.object({
    ident: z.string().length(11, "Fødselsnummer må være 11 siffer"),
    navn: z.string().min(1, "Navn er påkrevd"),
    fødselsdato: z.string().optional(),
    alder: z.number().min(0).max(130),
    erMyndig: z.boolean(),
    ...ReellMottakerFelterSchema.shape,
    manuellLagtTil: z.boolean().optional(),
    diskresjonskode: DiskresjonskodeSchema.optional(),
});

const MotpartSchema = z.object({
    ident: z.string().optional(),
    navn: z.string().optional(),
    erKjent: z.boolean().optional(),
    rolle: ForelderPartRolleSchema.optional(),
    diskresjonskode: DiskresjonskodeSchema.optional(),
});

const ForelderPartSchema = MotpartSchema.omit({ rolle: true });
const BarnebidragForelderRolleSchema = ForelderPartSchema.extend({
    type: z.enum(["BP", "BM"]),
});
const EnPartMedBarnRolleSchema = ForelderPartSchema.extend({
    type: z.enum(["BP", "BM"]),
});

/**
 * Samme skjema uansett om saken startes fra en forelder eller fra barnet. Alle parter kan endres.
 * `erKjent` på BP og BM: `undefined` er ikke avklart, `false` er registrert som ukjent.
 * 🔴 Saken kan opprettes uten barn når bidragsmottaker er kjent.
 */
export const BarnebidragSkjemaSchema = z
    .object({
        roller: z.array(BarnebidragForelderRolleSchema),
        valgteBarn: z.array(BarnMedAlderSchema),
        kategori: z.enum(["Nasjonal", "Utland"]),
    })
    .superRefine((data, ctx) => {
        validerForeldre(data, ctx);
        leggTilSaksfeil(data, "Barnebidrag", ctx);
    });

type BarnebidragSkjemaInput = {
    roller: BarnebidragForelderRolle[];
    valgteBarn: BarnMedAlder[];
};

type Rolletype = "BP" | "BM";

/** Rollen av en type med feilstien til den. Rekkefølgen i `roller` kan variere. */
function rolleFelt<T extends { type: Rolletype }>(roller: T[], type: Rolletype) {
    const indeks = roller.findIndex((rolle) => rolle.type === type);
    const path = ["roller", Math.max(indeks, 0)];
    return { type, rolle: roller[indeks] as T | undefined, path, identPath: [...path, "ident"] };
}

function leggTilFeil(ctx: z.RefinementCtx, path: (string | number)[], message: string) {
    ctx.addIssue({ code: "custom", path, message });
}

function validerForeldre(data: BarnebidragSkjemaInput, ctx: z.RefinementCtx) {
    for (const type of ["BP", "BM"] as const) {
        const { rolle, identPath } = rolleFelt(data.roller, type);
        if (rolle?.erKjent === undefined) {
            leggTilFeil(ctx, identPath, `Du må registrere ${tilForelderrolle(type)} eller velge ukjent`);
        }
    }
}

type SkjemaMedParter = {
    roller: Array<{ type: Rolletype; ident?: string; erKjent?: boolean }>;
    valgteBarn?: BarnMedAlder[];
};

function tilSakParter({ roller, valgteBarn = [] }: SkjemaMedParter): SakParter {
    const kjentIdent = (type: Rolletype) => roller.find((rolle) => rolle.type === type && rolle.erKjent)?.ident;
    return {
        bp: kjentIdent("BP"),
        bm: kjentIdent("BM"),
        bidragsmottakerErUkjent: roller.find((rolle) => rolle.type === "BM")?.erKjent === false,
        barn: valgteBarn,
    };
}

function leggTilSaksfeil(data: SkjemaMedParter, sakstype: Sakstype, ctx: z.RefinementCtx) {
    for (const feil of validerSak(tilSakParter(data), sakstype)) {
        const path =
            feil.gjelder === "barn"
                ? ["valgteBarn", feil.indeks, feil.felt]
                : feil.gjelder === "barnliste"
                  ? ["valgteBarn"]
                  : rolleFelt(data.roller, feil.gjelder).identPath;
        leggTilFeil(ctx, path, feil.melding);
    }
}

/** Parten er valgt i skjemaet og ikke satt som ukjent. */
export const erKjentPart = (part: ForelderPart) => part.erKjent === true && !!part.ident?.trim();

export type BarnebidragSkjemaData = z.infer<typeof BarnebidragSkjemaSchema>;
export type ForelderPart = z.infer<typeof ForelderPartSchema>;
export type BarnebidragForelderRolle = z.infer<typeof BarnebidragForelderRolleSchema>;
export type EnPartMedBarnRolle = z.infer<typeof EnPartMedBarnRolleSchema>;

const createSakMedBarnSkjemaSchema = (sakstype: "Oppfostringsbidrag" | "Farskap") =>
    z
        .object({
            arbeidsfordeling: ArbeidsfordelingSchema,
            roller: z.array(EnPartMedBarnRolleSchema),
            valgteBarn: z.array(BarnMedAlderSchema),
            kategori: z.enum(["Nasjonal", "Utland"]),
        })
        .superRefine((data, ctx) => leggTilSaksfeil(data, sakstype, ctx));

export const OppfostringsbidragSkjemaSchema = createSakMedBarnSkjemaSchema("Oppfostringsbidrag");
/** Som oppfostringsbidrag, men uten krav om reell mottaker og med bare ett barn. */
export const FarskapsSkjemaSchema = createSakMedBarnSkjemaSchema("Farskap");

export type FarskapsSkjemaSchemaData = z.infer<typeof FarskapsSkjemaSchema>;

// ==================== EKTEFELLEBIDRAG FLYT ====================

export const EktefellebidragSkjemaSchema = z
    .object({
        arbeidsfordeling: ArbeidsfordelingSchema,
        roller: z.array(
            z.object({
                ident: z.string(),
                navn: z.string(),
                type: z.enum(["BP", "BM"]),
                erKjent: z.literal(true),
                diskresjonskode: DiskresjonskodeSchema.optional(),
            }),
        ),
        kategori: z.enum(["Nasjonal", "Utland"]),
    })
    .superRefine((data, ctx) => leggTilSaksfeil(data, "Ektefellebidrag", ctx));

export type EktefellebidragSkjemaData = z.infer<typeof EktefellebidragSkjemaSchema>;
// ==================== EXPORTED TYPES ====================

export type BarnMedAlder = z.infer<typeof BarnMedAlderSchema>;
export type Motpart = z.infer<typeof MotpartSchema>;
export type PartISaken = z.infer<typeof PartISakenSchema>;
export type PartRolle = z.infer<typeof PartRolleSchema>;
export type ForelderPartRolle = z.infer<typeof ForelderPartRolleSchema>;
export type Diskresjonskode = z.infer<typeof DiskresjonskodeSchema>;

// ==================== HELPER TYPES ====================

export type Barnkurv = {
    id: string; // motpart.ident eller "UKJENT"
    motpart: {
        ident: string;
        visningsnavn: string;
        fødselsdato: string;
        diskresjonskode?: Diskresjonskode;
    } | null;
    forelderrolle:
        | "BARN"
        | "FAR"
        | "MEDMOR"
        | "MOR"
        | "INGEN"
        | "FORELDER"
        | "EKTEFELLE"
        | "MOTPART_TIL_FELLES_BARN"
        | "UKJENT"
        | null;
    barn: BarnMedAlder[];
};
