import { useFlag } from "@unleash/proxy-client-react";

/**
 * Feature toggles for behandling.
 *
 * Bruker `useFlag` direkte, på samme måte som ellers i frontenden. Unleash-konteksten
 * (innlogget saksbehandler, saksnummer og enhet) settes sentralt av
 * UnleashContextUpdater i web-appens root, så den skal ikke settes her.
 */
export default function useFeatureToogle() {
    return {
        nyToolbar: useFlag("frontend.toolbar"),
        tilgangOppretteFF: useFlag("behandling.opprette_ff"),
        bidragBeregningV2: useFlag("behandling.bidrag_beregning_v2"),
        bidragFlereBarn: useFlag("behandling.behandle_bidrag_flere_barn"),
        vedtaksperre: useFlag("vedtakssperre"),
        isAdminEnabled: useFlag("behandling.admin"),
        isDeveloper: useFlag("bidrag.utvikler"),
        isFatteVedtakEnabled: useFlag("behandling.fattevedtak_klage"),
        isOpphørsdatoEnabled: useFlag("behandling.opphorsdato"),
        isBidragV2Enabled: useFlag("behandling.v2_endring"),
    };
}
