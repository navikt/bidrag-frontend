/**
 * @bidrag/behandling-app er migrert fra en frittstående app og typesjekkes med
 * mildere innstillinger (se apps/behandling-app/tsconfig.json). For å unngå at
 * apps/web typesjekker pakkens kildekode på nytt med strict mode, peker
 * tsconfig sin paths-mapping til denne deklarasjonen av det offentlige API-et.
 *
 * TODO: fjern når behandling-app er strict-kompatibel.
 */
import type { FunctionComponent } from "react";

export type BehandlingPageProps = {
    behandlingId?: string;
    vedtakId?: string;
};

export declare const BehandlingPage: FunctionComponent<BehandlingPageProps>;
export declare const BehandlingPageWrapper: FunctionComponent<BehandlingPageProps>;
export declare const NotatPage: FunctionComponent<BehandlingPageProps>;
export declare const BegrunnelsePage: FunctionComponent<{ behandlingId?: string; broadcastChannel?: string }>;
export declare const ForskuddBrukerveiledningPage: FunctionComponent;
export declare const BidragBrukerveiledningPage: FunctionComponent;
export declare const SærbidragBrukerveiledningPage: FunctionComponent;
