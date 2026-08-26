import { TransaksjonerFilterPanel } from "~/common/reskontro/TransaksjonerFilterPanel.tsx";
import { useTransaksjoner } from "./useTransaksjoner";

export function SakTransaksjonerFilterPanel({ saksnummer }: { saksnummer: string }) {
    const { unikeMottakere, unikeBarn, unikeTransaksjonskoder } = useTransaksjoner(saksnummer);

    return (
        <TransaksjonerFilterPanel
            unikeMottakere={unikeMottakere}
            unikeBarn={unikeBarn}
            unikeTransaksjonskoder={unikeTransaksjonskoder}
        />
    );
}
