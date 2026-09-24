import type { Barnkurv, ForelderMedBarnSkjemaData } from "../opprett-sak-schema";

type Barn = ForelderMedBarnSkjemaData["valgteBarn"][number];

export function beregnBarnkurvValg(
    barnkurver: Barnkurv[],
    nåværendeBarn: Barn[],
    valgteIdenter: string[],
    kurvId: string,
) {
    const kurv = barnkurver.find((k) => k.id === kurvId);
    if (!kurv) {
        return undefined;
    }

    const identerIPar = kurv.barn.map((barn) => barn.ident);
    const aktivKurv = barnkurver.find((barnkurv) =>
        barnkurv.barn.some((barn) =>
            nåværendeBarn.some((valgtBarn) => !valgtBarn.manuellLagtTil && valgtBarn.ident === barn.ident),
        ),
    );
    const bytterKurv = valgteIdenter.length > 0 && aktivKurv !== undefined && aktivKurv.id !== kurvId;
    const eksisterendeValg = bytterKurv ? [] : nåværendeBarn;
    const forblirValgt = eksisterendeValg.filter(
        (barn) => !identerIPar.includes(barn.ident) || valgteIdenter.includes(barn.ident),
    );
    const nyeBarn = kurv.barn
        .filter((barn) => valgteIdenter.includes(barn.ident) && !eksisterendeValg.some((valg) => valg.ident === barn.ident))
        .map((barn) => ({
            ...barn,
            reellMottakerType: "ingen" as const,
            reellMottaker: "",
            reellMottakerNavn: "",
            manuellLagtTil: false,
        }));

    return {
        kurv,
        aktivKurv,
        valgteBarn: [...forblirValgt, ...nyeBarn],
    };
}

export function lagMotpartFraBarnkurv(
    kurv: Barnkurv,
    motpartRolle: ForelderMedBarnSkjemaData["motpart"]["rolle"],
) {
    const erMotpartUkjent = kurv.id.toLowerCase().includes("ukjent");
    if (!erMotpartUkjent && kurv.motpart) {
        return {
            ident: kurv.motpart.ident,
            navn: kurv.motpart.visningsnavn ?? kurv.id,
            erKjent: true,
            rolle: motpartRolle,
            diskresjonskode: kurv.motpart.diskresjonskode,
        };
    }

    return {
        ident: "",
        navn: "",
        erKjent: false,
        rolle: motpartRolle,
        diskresjonskode: undefined,
    };
}
