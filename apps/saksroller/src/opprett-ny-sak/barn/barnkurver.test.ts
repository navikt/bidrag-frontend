import type { MotpartBarnRelasjon, PersonDto } from "@bidrag/api/PersonApi";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { describe, expect, it } from "vitest";
import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";
import { grupperBarnIKurver, slåSammenBarnkurver } from "./barnkurver";

const FAR = genererFnr();
const MOR = genererFnr();
const ANNEN_MOR = genererFnr();
const BARN_1 = genererFnr();
const BARN_2 = genererFnr();
const BARN_3 = genererFnr();

describe("grupperBarnIKurver", () => {
    it("utelater barn over 24 år og barn med ukjent alder", () => {
        const person = (ident: string, fødselsdato?: string) =>
            ({ ident, visningsnavn: ident, fødselsdato }) as PersonDto;
        const relasjon = {
            fellesBarn: [person(BARN_1, "2015-01-01"), person(BARN_2, "1900-01-01"), person(BARN_3)],
        } as MotpartBarnRelasjon;

        expect(grupperBarnIKurver([relasjon])[0]?.barn.map(({ ident }) => ident)).toEqual([BARN_1]);
    });
});

const barn = (ident: string) => ({ ident, navn: ident, alder: 5, erMyndig: false }) as BarnMedAlder;

const kurv = (forelder: string, motpart: string | null, barnIdenter: string[]): Barnkurv => ({
    id: motpart ?? "UKJENT1",
    forelder: { ident: forelder },
    motpart: motpart ? { ident: motpart, visningsnavn: motpart, fødselsdato: "" } : null,
    forelderrolle: null,
    barn: barnIdenter.map(barn),
});

const foreldrepar = (a: string, b: string) => [a, b].sort().join("-");

const identer = (kurver: Barnkurv[]) => kurver.map((k) => ({ id: k.id, barn: k.barn.map((b) => b.ident) }));

describe("slåSammenBarnkurver", () => {
    it("viser hvert barn én gang når ingen barn er lagt til manuelt", () => {
        const resultat = slåSammenBarnkurver(
            [kurv(FAR, MOR, [BARN_1])],
            [kurv(FAR, ANNEN_MOR, [BARN_1, BARN_2])],
            false,
        );

        expect(identer(resultat)).toEqual([
            { id: foreldrepar(FAR, MOR), barn: [BARN_1] },
            { id: foreldrepar(FAR, ANNEN_MOR), barn: [BARN_2] },
        ]);
    });

    it("viser barnet én gang når begge foreldrene har samme felles barn", () => {
        const resultat = slåSammenBarnkurver([], [kurv(FAR, MOR, [BARN_1]), kurv(MOR, FAR, [BARN_1])], true);

        expect(identer(resultat)).toEqual([{ id: foreldrepar(FAR, MOR), barn: [BARN_1] }]);
    });

    it("slår sammen søskenkurver for samme foreldrepar uavhengig av rekkefølge på foreldrene", () => {
        const resultat = slåSammenBarnkurver([], [kurv(FAR, MOR, [BARN_1]), kurv(MOR, FAR, [BARN_2])], true);

        expect(identer(resultat)).toEqual([{ id: foreldrepar(FAR, MOR), barn: [BARN_1, BARN_2] }]);
    });

    it("samler barn uten kjent motpart i kurven UKJENT", () => {
        const resultat = slåSammenBarnkurver([], [kurv(FAR, null, [BARN_1])], true);

        expect(identer(resultat)).toEqual([{ id: "UKJENT", barn: [BARN_1] }]);
    });

    it("ignorerer kurvene fra foreldrene når barn er lagt til manuelt", () => {
        const resultat = slåSammenBarnkurver([kurv(FAR, MOR, [BARN_1])], [kurv(FAR, ANNEN_MOR, [BARN_2])], true);

        expect(identer(resultat)).toEqual([{ id: foreldrepar(FAR, ANNEN_MOR), barn: [BARN_2] }]);
    });
});
