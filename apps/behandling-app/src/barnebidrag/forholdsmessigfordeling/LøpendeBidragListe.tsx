import type { BeregnetBidragBarnDto } from "@bidrag/api/BidragBehandlingApiV1";
import { ReadMore } from "@navikt/ds-react";
import { BpsBeregnedeTotalBidragPerioderTabell } from "../../common/components/vedtak/BpsBeregnedeTotalbidragTabell";

export default function LøpendeBidragListe({
    løpendeBidrag,
    harOpprettetFF,
}: {
    løpendeBidrag: BeregnetBidragBarnDto[];
    harOpprettetFF: boolean;
}) {
    if (!løpendeBidrag || løpendeBidrag.length === 0) {
        return null;
    }

    return (
        <ReadMore
            header={harOpprettetFF ? "Løpende bidrag når forholdsmessig fordeling ble opprettet" : "Løpende bidrag"}
            size="small"
            className="mt-4"
        >
            <BpsBeregnedeTotalBidragPerioderTabell beregning={løpendeBidrag} />
        </ReadMore>
    );
}
