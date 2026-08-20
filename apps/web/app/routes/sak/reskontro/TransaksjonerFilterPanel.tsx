import { TransaksjonerFilterPanelView } from "~/common/reskontro/TransaksjonerFilterPanelView";
import { useTransaksjoner } from "./useTransaksjoner";

export function TransaksjonerFilterPanel({ saksnummer }: { saksnummer: string }) {
    const { unikeMottakere, unikeBarn, unikeTransaksjonskoder } = useTransaksjoner(saksnummer);

    return (
        <TransaksjonerFilterPanelView
            unikeMottakere={unikeMottakere}
            unikeBarn={unikeBarn}
            unikeTransaksjonskoder={unikeTransaksjonskoder}
        />
    );
}
