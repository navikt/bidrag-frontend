import type { BidragssakDto } from "@bidrag/api/SakApi";
import { MaskerSensitivInfo } from "@bidrag/common";
import { Alert } from "@navikt/ds-react";
import LasterSkeleton from "../components/LasterSkeleton";
import EksisterendeSakSection from "./EksisterendeSakSection";

export type EksisterendeSakStatusProps = {
    infoMelding: {
        type: "info" | "error" | "warning";
        melding: string;
    } | null;
    harEksisterendeSak: boolean;
    eksisterendeSak: BidragssakDto | null;
    isLoading: boolean;
    partISakenNavn: string;
    motpartNavn?: string;
    lastetekst?: string;
};

export default function EksisterendeSakStatus({
    infoMelding,
    harEksisterendeSak,
    eksisterendeSak,
    isLoading,
    partISakenNavn,
    motpartNavn,
    lastetekst = "Henter sak...",
}: EksisterendeSakStatusProps) {
    return (
        <>
            {infoMelding && (
                <Alert size="small" variant={infoMelding.type}>
                    <MaskerSensitivInfo>{infoMelding.melding}</MaskerSensitivInfo>
                </Alert>
            )}
            <EksisterendeSakSection
                harEksisterendeSak={harEksisterendeSak}
                eksisterendeSak={eksisterendeSak}
                partISakenNavn={partISakenNavn}
                motpartNavn={motpartNavn}
            />
            {isLoading && <LasterSkeleton tekst={lastetekst} />}
        </>
    );
}
