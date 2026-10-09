import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";

type Barn = BarnMedAlder;

/** Barnet uten reell mottaker, for barn som velges på nytt. */
export function utenReellMottaker(barn: Barn): Barn {
    return { ...barn, reellMottakerType: undefined, reellMottaker: undefined, reellMottakerNavn: undefined };
}

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
    const eksisterendeValg = bytterKurv ? nåværendeBarn.filter((barn) => barn.manuellLagtTil) : nåværendeBarn;
    const forblirValgt = eksisterendeValg.filter(
        (barn) => !identerIPar.includes(barn.ident) || valgteIdenter.includes(barn.ident),
    );
    const nyeBarn = kurv.barn
        .filter(
            (barn) => valgteIdenter.includes(barn.ident) && !eksisterendeValg.some((valg) => valg.ident === barn.ident),
        )
        .map((barn) => ({ ...utenReellMottaker(barn), manuellLagtTil: barn.manuellLagtTil ?? false }));

    return {
        kurv,
        aktivKurv,
        valgteBarn: [...forblirValgt, ...nyeBarn],
    };
}
