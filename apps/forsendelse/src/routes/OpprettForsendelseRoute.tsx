import type { Engangsbeloptype, SoktAvType, Stonadstype, Vedtakstype } from "@bidrag/api/BidragForsendelseApi";
import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import { SessionProvider } from "../pages/forsendelse/context/SessionContext";
import Opprettforsendelse from "../pages/opprettforsendelse";

export const handle = { rendersOwnHeader: true };

/** Oppretter ny forsendelse i sakskontekst (`/sak/:saksnummer/forsendelse`). */
export default function OpprettForsendelseRoute() {
    const { saksnummer, forsendelseId } = useParams<{ saksnummer?: string; forsendelseId?: string }>();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        document.title = `Forsendelse - ${saksnummer}`;
    }, [saksnummer]);

    return (
        <SessionProvider
            forsendelseId={forsendelseId}
            saksnummer={saksnummer}
            sessionId={searchParams.get("sessionState")}
            enhet={searchParams.get("enhet")}
        >
            <Opprettforsendelse
                barnObjNr={searchParams.getAll("barn_obj_nr") ?? []}
                vedtakType={searchParams.get("vedtakType") as Vedtakstype}
                erFattetBeregnet={(() => {
                    const param = searchParams.get("erFattetBeregnet");
                    return param === null ? null : param === "true";
                })()}
                erVedtakIkkeTilbakekreving={searchParams.get("erVedtakIkkeTilbakekreving") === "true"}
                soknadId={searchParams.get("soknadId")}
                soknadType={searchParams.get("soknadType")}
                behandlingId={searchParams.get("behandlingId")}
                vedtakId={searchParams.get("vedtakId")}
                soknadFra={searchParams.get("soknadFra") as SoktAvType}
                behandlingType={searchParams.get("behandlingType")}
                engangsBelopType={searchParams.get("engangsbelopType") as Engangsbeloptype}
                stonadType={searchParams.get("stonadType") as Stonadstype}
            />
        </SessionProvider>
    );
}
