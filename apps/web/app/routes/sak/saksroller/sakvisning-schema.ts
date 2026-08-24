import { z } from "zod";

export const MYNDYG_BARN_ALDER = 18;

export const RolleTypeSchema = z.enum(["BP", "BM", "BA", "RM"]);

export const DiskresjonskodeSchema = z.enum(["SPSF", "SPFO", "URIK", "MILI", "PEND", "SVAL", "P19"]);

export const RollehistorikkSchema = z.object({
    fodselsnummer: z.string().optional(),
    type: z.string().optional(),
    reellMottaker: z.string().optional(),
    typeEndring: z.string().optional(),
    opprettetAv: z.string().optional(),
    opprettetDato: z.date().optional(),
});

export const RolleSchema = z.object({
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

export const BarnRolleSchema = RolleSchema.extend({
    reellMottakerType: z.enum(["barnet_selv", "samhandler"]).optional(),
    reellMottakerNavn: z.string().optional(),
});

function harRegistrertBidragsmottaker(roller: Rolle[]): boolean {
    return roller.some((r) => r.type === "BM" && r.fodselsnummer && r.fodselsnummer.trim() !== "");
}

function trengerReellMottaker(barnRolle: z.infer<typeof BarnRolleSchema>, harBM: boolean): boolean {
    return barnRolle.erMyndig === true || !harBM;
}

export const SakRedigeringSchema = z
    .object({
        saksnummer: z.string(),
        roller: z.array(RolleSchema),
    })
    .superRefine((data, ctx) => {
        const harBM = harRegistrertBidragsmottaker(data.roller);

        data.roller.forEach((rolle, index) => {
            if (rolle.type !== "BA") {
                return;
            }

            const barnRolle = rolle as z.infer<typeof BarnRolleSchema>;
            if (trengerReellMottaker(barnRolle, harBM) && !barnRolle.reellMottaker) {
                ctx.addIssue({
                    code: "custom",
                    path: ["roller", index, "reellMottaker"],
                    message: barnRolle.erMyndig
                        ? "Reell mottaker må registreres for barn over 18 år"
                        : "Reell mottaker må registreres når bidragsmottaker er ukjent",
                });
            }
        });
    });

export type SakRedigeringData = z.infer<typeof SakRedigeringSchema>;
export type RolleType = z.infer<typeof RolleTypeSchema>;
export type Rolle = z.infer<typeof RolleSchema>;
export type BarnRolle = z.infer<typeof BarnRolleSchema>;
export type Rollehistorikk = z.infer<typeof RollehistorikkSchema>;
export type Diskresjonskode = z.infer<typeof DiskresjonskodeSchema>;

export function erBarn(rolle: Rolle): boolean {
    return rolle.type === "BA";
}

export function erForelder(rolle: Rolle): boolean {
    return rolle.type === "BP" || rolle.type === "BM";
}

export function getRolleNavn(rolleType: RolleType): string {
    const rolleNavnMap: Record<RolleType, string> = {
        BP: "Bidragspliktig",
        BM: "Bidragsmottaker",
        BA: "Barn",
        RM: "Reell mottaker",
    };
    return rolleNavnMap[rolleType];
}
