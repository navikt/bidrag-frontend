import { SecuritySessionUtils } from "@bidrag/common";
import { useQuery } from "@tanstack/react-query";
import { useFlag, useUnleashClient } from "@unleash/proxy-client-react";
import { useEffect } from "react";
import { useParams } from "react-router";

export default function useFeatureToogle() {
    const enhet = new URLSearchParams(window.location.search).get("enhet");
    const { saksnummer } = useParams<{
        saksnummer?: string;
    }>();
    const enableFatteVedtak = useFlag("behandling.fattevedtak_klage");
    const enableAdmin = useFlag("behandling.admin");
    const enableOpphørsdato = useFlag("behandling.opphorsdato");
    const enableBidragV2 = useFlag("behandling.v2_endring");
    const utvikler = useFlag("bidrag.utvikler");
    const vedtaksperre = useFlag("vedtakssperre");
    const enableBehandlingVesntremeny = useFlag("behandling_vesntremeny");
    const bidragFlereBarn = useFlag("behandling.behandle_bidrag_flere_barn");
    const bidragBeregningV2 = useFlag("behandling.bidrag_beregning_v2");
    const tilgangOppretteFF = useFlag("behandling.opprette_ff");
    const nyToolbar = useFlag("frontend.toolbar");
    const nyBehandlingHeader = useFlag("frontend.behandling_ny_header");

    const client = useUnleashClient();
    const { data: userId } = useQuery({
        queryKey: ["user"],
        queryFn: async () => SecuritySessionUtils.hentSaksbehandlerId(),
        staleTime: Infinity,
    });

    useEffect(() => {
        client.updateContext({
            userId,
            properties: {
                enhet,
                saksnummer,
            },
        });
    }, [userId]);

    useEffect(() => {
        console.debug(
            "enableFatteVedtak",
            enableFatteVedtak,
            "enableAdmin",
            enableAdmin,
            "enableOpphørsdato",
            enableOpphørsdato,
            "enableBidragV2",
            enableBidragV2,
        );
    }, [enableFatteVedtak, enableAdmin]);
    return {
        nyToolbar,
        nyBehandlingHeader: nyBehandlingHeader,
        tilgangOppretteFF,
        bidragBeregningV2: bidragBeregningV2,
        bidragFlereBarn: bidragFlereBarn,
        vedtaksperre: vedtaksperre,
        isAdminEnabled: enableAdmin,
        isDeveloper: utvikler,
        isFatteVedtakEnabled: enableFatteVedtak,
        isOpphørsdatoEnabled: enableOpphørsdato,
        isBidragV2Enabled: enableBidragV2,
        isbehandlingVesntremenyEnabled: enableBehandlingVesntremeny,
    };
}
