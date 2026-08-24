import type {
    PrivatAvtaleAndreBarnDtoV2,
    PrivatAvtaleBarnDtoV2,
    PrivatAvtaleDtoV3,
    PrivatAvtalePeriodeDto,
    Stonadstype,
} from "@bidrag/api/BidragBehandlingApiV1";

import type {
    PrivatAvtaleFormValue,
    PrivatAvtaleFormValues,
    PrivatAvtaleFormValuesPerBarn,
    PrivatAvtalePeriode,
} from "../../../types/privatAvtaleFormValues";

export const createInitialValues = (privatAvtale: PrivatAvtaleDtoV3): PrivatAvtaleFormValues => {
    const paSøknadsbarn: PrivatAvtaleFormValue[] = privatAvtale.søknadsbarn.map((rolle) => {
        return {
            gjelderBarn: {
                id: rolle.gjelderBarn.id,
                ident: rolle.gjelderBarn.ident,
                navn: rolle.gjelderBarn.navn,
                fødselsdato: rolle.gjelderBarn.fødselsdato,
                stønadstype: rolle.gjelderBarn.stønadstype,
            },
            harLøpendeBidrag: true,
            saksnummer: undefined,
            begrunnelse: rolle.begrunnelse ?? "",
            privatAvtale: rolle.privatAvtale ? createPrivatAvtaleInitialValues(rolle.privatAvtale) : null,
        };
    });

    const paAndreBarn = privatAvtale.andreBarn.barn.map((rolle) => {
        return {
            gjelderBarn: {
                id: rolle.gjelderBarn.id,
                ident: rolle.gjelderBarn.ident,
                navn: rolle.gjelderBarn.navn,
                fødselsdato: rolle.gjelderBarn.fødselsdato,
                kilde: rolle.gjelderBarn.kilde,
                stønadstype: rolle.gjelderBarn.stønadstype,
            },
            harLøpendeBidrag: false,
            saksnummer: rolle.saksnummer,
            enhet: rolle.enhet,
            lagtTilManuelt: true,
            privatAvtale: rolle.privatAvtale ? createPrivatAvtaleInitialValues(rolle.privatAvtale) : null,
        };
    });
    return {
        roller: paSøknadsbarn,
        andreBarn: paAndreBarn,
        andreBarnBegrunnelse: privatAvtale.andreBarn.begrunnelse,
    };
};
export const transformPrivatAvtalePeriode = (periode: PrivatAvtalePeriodeDto): PrivatAvtalePeriode => ({
    id: periode.id,
    fom: periode.periode.fom,
    tom: periode.periode.tom ?? null,
    beløp: periode.beløp,
    samværsklasse: periode.samværsklasse ?? "",
    valutakode: periode.valutakode ?? "",
});

export const createPrivatAvtaleInitialValues = (privatAvtale: PrivatAvtaleBarnDtoV2): PrivatAvtaleFormValuesPerBarn => {
    return {
        avtaleId: privatAvtale.id,
        skalIndeksreguleres: privatAvtale.skalIndeksreguleres,
        avtaleDato: privatAvtale.avtaleDato ?? null,
        avtaleType: privatAvtale.avtaleType ?? "",
        gjelderUtland: !!privatAvtale?.gjelderUtland,
        perioder: privatAvtale.perioder.map(transformPrivatAvtalePeriode),
    };
};

export const sjekkSammeBarnFinnesMedStønadstype = (
    gjelderBarn: string,
    stønadstype: Stonadstype,
    barn: PrivatAvtaleAndreBarnDtoV2[],
) => {
    return barn.some(
        (barn) =>
            barn.gjelderBarn.ident === gjelderBarn &&
            (barn.gjelderBarn.stønadstype === null ||
                stønadstype === null ||
                barn.gjelderBarn.stønadstype === stønadstype),
    );
};
