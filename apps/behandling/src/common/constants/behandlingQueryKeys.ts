import type { UnderholdDto, UnderholdskostnadValideringsfeil } from "@bidrag/api/BidragBehandlingApiV1";

export default {
    tab: "tab",
    steg: "steg",
    lesemodus: "lesemodus",
    // Brukt til å synkronisere `selectedSaksnummer` (se BarnebidragSideMenu) når man navigerer inn
    // på et steg for en spesifikk rolle - f.eks. fra en feilmelding i ErrorSummary/VedtakWrapper.
    // Sendes direkte som saksnummer fra kilden (VedtakWrapper har allerede rollen/saksnummeret
    // tilgjengelig), slik at sidemenyen slipper å slå opp rollen basert på `tab`-verdien (som
    // varierer i format per steg).
    saksnummer: "saksnummer",
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
