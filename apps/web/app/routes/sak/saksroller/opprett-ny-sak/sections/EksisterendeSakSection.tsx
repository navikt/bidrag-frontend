import type { BidragssakDto } from "@bidrag/api/SakApi";
import EksisterendeSakAlert from "../EksisterendeSakAlert";

interface EksisterendeSakSectionProps {
    harEksisterendeSak: boolean;
    eksisterendeSak: BidragssakDto | null;
    partISakenNavn: string;
    motpartNavn?: string;
}

/**
 * Seksjon som viser advarsel om eksisterende sak hvis relevant.
 * Brukes i alle opprett-sak flow for konsistent behandling av eksisterende saker.
 */
export default function EksisterendeSakSection({
    harEksisterendeSak,
    eksisterendeSak,
    partISakenNavn,
    motpartNavn,
}: EksisterendeSakSectionProps) {
    if (!harEksisterendeSak || !eksisterendeSak) {
        return null;
    }

    return (
        <EksisterendeSakAlert
            eksisterendeSak={eksisterendeSak}
            partISakenNavn={partISakenNavn}
            motpartNavn={motpartNavn}
        />
    );
}
