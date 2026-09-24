import { describe, expect, it } from "vitest";
import { utledForelderUtenBarnParter, utledForelderUtenBarnStatus } from "./forelder-uten-barn-visningsmodell";

describe("utledForelderUtenBarnParter", () => {
    it("behandler manglende bidragsmottaker som ukjent når parten er bidragspliktig", () => {
        const partISaken = {
            ident: "11111111111",
            navn: "Bidragspliktig",
            rolle: "bidragspliktig" as const,
            erKjent: true,
        };
        const motpart = {
            erKjent: false,
            rolle: "bidragsmottaker" as const,
        };

        expect(utledForelderUtenBarnParter(partISaken, motpart)).toMatchObject({
            erBidragspliktig: true,
            erBidragsmottaker: false,
            bidragsmottakerErUkjent: true,
            bidragsmottaker: motpart,
            bidragspliktig: partISaken,
            normalisertMotpart: {
                ident: "",
                navn: "",
                rolle: "bidragsmottaker",
                erKjent: false,
            },
        });
    });

    it("bruker parten som kjent bidragsmottaker", () => {
        const partISaken = {
            ident: "11111111111",
            navn: "Bidragsmottaker",
            rolle: "bidragsmottaker" as const,
            erKjent: true,
        };
        const motpart = {
            ident: "22222222222",
            navn: "Bidragspliktig",
            erKjent: true,
            rolle: "bidragspliktig" as const,
        };

        expect(utledForelderUtenBarnParter(partISaken, motpart)).toMatchObject({
            erBidragspliktig: false,
            erBidragsmottaker: true,
            bidragsmottakerErUkjent: false,
            bidragsmottaker: partISaken,
            bidragspliktig: motpart,
        });
    });
});

describe("utledForelderUtenBarnStatus", () => {
    it("blokkerer submit mens tilgang for ukjent bidragsmottaker ikke er avklart", () => {
        const status = utledForelderUtenBarnStatus({
            antallValgteBarn: 1,
            erBidragsmottaker: false,
            bidragsmottakerErUkjent: true,
            sjekkerTilgangUtenBm: true,
            kanOppretteSakUtenBm: undefined,
            harEksisterendeSak: false,
            lasterEksisterendeSak: false,
            lasterEnhet: false,
        });

        expect(status.submitBlokkert).toBe(true);
        expect(status.kanIkkeOppretteSakUtenBm).toBe(false);
    });

    it("viser tilgangsfeil og blokkerer submit når tilgang mangler", () => {
        const status = utledForelderUtenBarnStatus({
            antallValgteBarn: 1,
            erBidragsmottaker: false,
            bidragsmottakerErUkjent: true,
            sjekkerTilgangUtenBm: false,
            kanOppretteSakUtenBm: false,
            harEksisterendeSak: false,
            lasterEksisterendeSak: false,
            lasterEnhet: false,
        });

        expect(status.kanIkkeOppretteSakUtenBm).toBe(true);
        expect(status.submitBlokkert).toBe(true);
        expect(status.visUfullstendigRelasjon).toBe(true);
    });

    it("tillater submit når tilgang for ukjent bidragsmottaker er bekreftet", () => {
        const status = utledForelderUtenBarnStatus({
            antallValgteBarn: 1,
            erBidragsmottaker: false,
            bidragsmottakerErUkjent: true,
            sjekkerTilgangUtenBm: false,
            kanOppretteSakUtenBm: true,
            harEksisterendeSak: false,
            lasterEksisterendeSak: false,
            lasterEnhet: false,
        });

        expect(status.submitBlokkert).toBe(false);
        expect(status.kanIkkeOppretteSakUtenBm).toBe(false);
    });
});
