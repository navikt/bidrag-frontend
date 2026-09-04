import { RolleTypeAbbreviation, SakHeader } from "@bidrag/common";
import { Skeleton } from "@navikt/ds-react";
import React from "react";

import { useBarnIBehandlingDetaljer, useHentForsendelseQuery, useHentRoller } from "../../../hooks/useForsendelseApi";
import { useSession } from "../context/SessionContext";

export default function ForsendelseSakHeader() {
    return (
        <React.Suspense fallback={<SakLoadingIndicator />}>
            <ForsendelseSakHeaderContent />
        </React.Suspense>
    );
}
function SakLoadingIndicator() {
    return (
        <div className="flex flex-col gap-[2px]">
            <Skeleton variant="rectangle" width="100%" height={"30px"} />
            <Skeleton variant="rectangle" width="100%" height={"140px"} />
        </div>
    );
}

function ForsendelseSakHeaderContent() {
    const { saksnummer: saksnummerFromSession, forsendelseId } = useSession();
    const forsendelse = useHentForsendelseQuery();
    const roller = useHentRoller();
    const barnIBehandling = useBarnIBehandlingDetaljer();
    const saksnummer = saksnummerFromSession ?? forsendelse?.saksnummer;
    const barnIBehandlingByIdent = new Map(barnIBehandling.map((barn) => [barn.ident, barn]));

    const filtrerteRoller = roller.filter(
        (rolle) =>
            rolle.rolleType !== RolleTypeAbbreviation.BA ||
            barnIBehandling.length === 0 ||
            barnIBehandlingByIdent.has(rolle.ident),
    );

    const rollerMedStonad = filtrerteRoller.map((rolle) => ({
        ...rolle,
        stønad18År: barnIBehandlingByIdent.get(rolle.ident)?.erBidrag18År ?? false,
    }));

    return (
        <SakHeader
            saksnummer={saksnummer}
            roller={rollerMedStonad}
            skjermbilde={{ navn: "Forsendelse", referanse: forsendelseId }}
        />
    );
}
