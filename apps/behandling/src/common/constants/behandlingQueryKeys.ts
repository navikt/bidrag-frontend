import type { UnderholdDto, UnderholdskostnadValideringsfeil } from "@bidrag/api/BidragBehandlingApiV1";

export default {
    tab: "tab",
    steg: "steg",
    lesemodus: "lesemodus",
};

export const toUnderholdskostnadTabQueryParameterForUnderhold = (
    underhold?: UnderholdDto | UnderholdskostnadValideringsfeil,
) => {
    return toUnderholdskostnadTabQueryParameter(
        underhold?.gjelderBarn?.id,
        underhold?.id,
        underhold?.gjelderBarn?.medIBehandlingen,
    );
};

export const toUnderholdskostnadTabQueryParameter = (
    gjelderBarnId?: number,
    underholdskostnadId?: number,
    medIBehandlingen = false,
) => {
    if (medIBehandlingen) {
        return `underholdskostnaderMedIBehandling-${gjelderBarnId}-${underholdskostnadId}`;
    }
    return "underholdskostnaderAndreBarn";
};
