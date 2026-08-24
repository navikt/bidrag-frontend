import {
    type BehandlingDtoV2,
    TypeArsakstype,
    type VirkningstidspunktBarnDtoV2,
} from "@bidrag/api/BidragBehandlingApiV1";
import { lastDayOfMonth } from "@bidrag/common";
import { addMonths } from "date-fns";
import {
    addMonthsIgnoreDay,
    dateOrNull,
    deductMonths,
    firstDayOfMonth,
    isAfterDate,
    minOfDates,
} from "../../utils/date-utils";

export const getSoktFraOrMottatDato = (soktFraDato: Date, mottatDato: Date) => {
    return isAfterDate(soktFraDato, mottatDato) ? soktFraDato : mottatDato;
};
export const aarsakToVirkningstidspunktMapper = (
    aarsak: TypeArsakstype | string,
    behandling: BehandlingDtoV2,
    selectedVirkningstidspunkt: VirkningstidspunktBarnDtoV2,
) => {
    const nyVirkningstidspunkt = mapÅrsakTilVirkningstidspunkt(aarsak, behandling, selectedVirkningstidspunkt);
    const opprinneligVirkningstidspunkt = dateOrNull(selectedVirkningstidspunkt.opprinneligVirkningstidspunkt);

    if (opprinneligVirkningstidspunkt != null && nyVirkningstidspunkt != null) {
        return minOfDates(opprinneligVirkningstidspunkt, nyVirkningstidspunkt);
    }
    return nyVirkningstidspunkt;
};
export const mapÅrsakTilVirkningstidspunkt = (
    aarsak: TypeArsakstype | string,
    behandling: BehandlingDtoV2,
    selectedVirkningstidspunkt: VirkningstidspunktBarnDtoV2,
) => {
    const soktFraDato = new Date(behandling.søktFomDato);
    const mottatDato = new Date(behandling.mottattdato);
    const barnsFødselsdato = selectedVirkningstidspunkt.rolle.fødselsdato;
    const mottatOrSoktFraDato = getSoktFraOrMottatDato(soktFraDato, mottatDato);
    const treMaanederTilbakeFraMottatDato = deductMonths(firstDayOfMonth(mottatDato), 3);
    const treMaanederTilbake = isAfterDate(soktFraDato, treMaanederTilbakeFraMottatDato)
        ? firstDayOfMonth(soktFraDato)
        : treMaanederTilbakeFraMottatDato;

    switch (aarsak) {
        case TypeArsakstype.MANEDETTERBETALTFORFALTBIDRAG:
            return null;
        case TypeArsakstype.FRAMANEDENETTERIPAVENTEAVBIDRAGSSAK:
            return firstDayOfMonth(addMonths(mottatOrSoktFraDato, 1));
        case TypeArsakstype.FRAMANEDENETTERFYLTE18AR:
            return barnsFødselsdato && isAfterDate(new Date(barnsFødselsdato), soktFraDato)
                ? firstDayOfMonth(addMonthsIgnoreDay(new Date(barnsFødselsdato), 1))
                : firstDayOfMonth(soktFraDato);
        case TypeArsakstype.FRABARNETSFODSEL:
            return barnsFødselsdato && isAfterDate(new Date(barnsFødselsdato), soktFraDato)
                ? firstDayOfMonth(new Date(barnsFødselsdato))
                : firstDayOfMonth(soktFraDato);
        // Fra kravfremsettelse
        case TypeArsakstype.FRA_KRAVFREMSETTELSE:
            return firstDayOfMonth(mottatOrSoktFraDato);
        // 3 måneder tilbake
        case TypeArsakstype.TREMANEDERTILBAKE:
            return isAfterDate(new Date(), soktFraDato) ? treMaanederTilbake : null;
        // Fra søknadstidspunkt
        case TypeArsakstype.FRASOKNADSTIDSPUNKT:
            return firstDayOfMonth(soktFraDato);
        default:
            return soktFraDato;
    }
};
export const getFomAndTomForMonthPickerV2 = (virkningstidspunkt: Date | string) => {
    const virkningstidspunktIsInFuture = isAfterDate(
        firstDayOfMonth(new Date(virkningstidspunkt)),
        firstDayOfMonth(new Date()),
    );
    const fom = firstDayOfMonth(new Date(virkningstidspunkt));
    const tom = virkningstidspunktIsInFuture
        ? lastDayOfMonth(new Date(virkningstidspunkt))
        : lastDayOfMonth(new Date());
    return [fom, tom];
};

export const getFomAndTomForMonthPicker = (virkningstidspunkt: Date | string, beregnTilDato?: Date) => {
    const lastDayOfPreviousMonth = lastDayOfMonth(deductMonths(firstDayOfMonth(new Date()), 1));
    const lastDayOfAMonthBeforeBeregnTil = beregnTilDato && lastDayOfMonth(deductMonths(beregnTilDato, 1));
    const fom = firstDayOfMonth(new Date(virkningstidspunkt));
    const tom = lastDayOfAMonthBeforeBeregnTil ? lastDayOfAMonthBeforeBeregnTil : lastDayOfPreviousMonth;

    return [fom, tom];
};

export const getEitherFirstDayOfFoedselsOrVirkingsdatoMonth = (
    barnsFoedselsDato: Date | string,
    virkningsOrSoktFraDato: Date,
) => {
    const date =
        barnsFoedselsDato && isAfterDate(barnsFoedselsDato, virkningsOrSoktFraDato)
            ? new Date(barnsFoedselsDato)
            : virkningsOrSoktFraDato;

    return firstDayOfMonth(date);
};
