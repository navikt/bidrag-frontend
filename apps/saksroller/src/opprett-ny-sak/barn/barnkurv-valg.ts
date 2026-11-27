import type { Barnkurv, BarnMedAlder } from "../skjema/opprett-sak-schema";

type Barn = BarnMedAlder;

export function finnLåstKurvId(barnkurver: Barnkurv[], valgteBarn: Barn[], aktivKurvId: string | null) {
    if (!aktivKurvId || !valgteBarn.some((barn) => barn.manuellLagtTil)) return null;
    const harValgteRegistrerteBarn = barnkurver.some(
        (kurv) => kurv.id === aktivKurvId && harRegistrerteBarnIKurv(kurv, valgteBarn),
    );
    return harValgteRegistrerteBarn ? aktivKurvId : null;
}

export function harRegistrerteBarnIKurv(kurv: Barnkurv, valgteBarn: Barn[]): boolean {
    return kurv.barn.some((barn) =>
        valgteBarn.some((valgtBarn) => !valgtBarn.manuellLagtTil && valgtBarn.ident === barn.ident),
    );
}

/** `null` betyr tomt valg, `undefined` betyr at forelderen skal beholdes. */
export function finnKurvbytte(kurv: Barnkurv, aktivKurv: Barnkurv | undefined, valgteBarn: Barn[]) {
    if (valgteBarn.length === 0) return null;
    if (harRegistrerteBarnIKurv(kurv, valgteBarn) && aktivKurv?.id !== kurv.id) return kurv;
    return undefined;
}

export function begrensTilSisteValg(nyeValg: Barn[], forrigeValg: Barn[]) {
    if (nyeValg.length <= 1) return nyeValg;
    return nyeValg.filter((barn) => !forrigeValg.some((forrige) => forrige.ident === barn.ident)).slice(-1);
}

export function begrensTilSisteIdent(valgteIdenter: string[], forrigeValg: Barn[], låstIdent?: string | null) {
    if (valgteIdenter.length <= 1) return valgteIdenter;
    if (låstIdent && valgteIdenter.includes(låstIdent)) return [låstIdent];
    return valgteIdenter.filter((ident) => !forrigeValg.some((barn) => barn.ident === ident)).slice(-1);
}

/** Barnet uten reell mottaker, for barn som velges på nytt. */
export function utenReellMottaker(barn: Barn): Barn {
    return {
        ...barn,
        reellMottakerType: undefined,
        reellMottaker: undefined,
        reellMottakerNavn: undefined,
        reellMottakerErVerge: undefined,
    };
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
    const aktivKurv = barnkurver.find((barnkurv) => harRegistrerteBarnIKurv(barnkurv, nåværendeBarn));
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
