import { NyOpprettSakFlytContext } from "@bidrag/common";
import { useFlag } from "@unleash/proxy-client-react";
import { lazy, type PropsWithChildren } from "react";

const OpprettSakFlytInnbygget = lazy(() => import("./OpprettSakFlytInnbygget"));

/** Gir behandling og dokument den nye opprett-sak-flyten når `bisys.ny_rollebilde` er på. */
export function NyOpprettSakFlytProvider({ children }: PropsWithChildren) {
    const visNyRollebilde = useFlag("bisys.ny_rollebilde");

    return (
        <NyOpprettSakFlytContext value={visNyRollebilde ? OpprettSakFlytInnbygget : null}>
            {children}
        </NyOpprettSakFlytContext>
    );
}
