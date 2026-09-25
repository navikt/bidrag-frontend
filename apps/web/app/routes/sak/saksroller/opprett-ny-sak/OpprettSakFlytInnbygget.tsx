import type { NyOpprettSakFlytProps } from "@bidrag/common";
import { useMemo } from "react";
import OpprettSakFlyt from "./OpprettSakFlyt";
import { type OpprettSakFlytValg, SaksrolleroversiktProvider } from "./saksrolleroversiktContext";

/** Den nye flyten slik behandling og dokument viser den i en modal. */
export default function OpprettSakFlytInnbygget({
    ident,
    rolle,
    initialForelder,
    eierfogd,
    onOpprettet,
    onAvbryt,
}: NyOpprettSakFlytProps) {
    const valg = useMemo<OpprettSakFlytValg>(
        () => ({ inngang: { ident, rolle, initialForelder, eierfogd }, onOpprettet, onAvbryt }),
        [ident, rolle, initialForelder, eierfogd, onOpprettet, onAvbryt],
    );

    return (
        <SaksrolleroversiktProvider {...valg}>
            <OpprettSakFlyt visning="modal" />
        </SaksrolleroversiktProvider>
    );
}
