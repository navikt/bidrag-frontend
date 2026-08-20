import { TransaksjonerFilterPanelView } from "~/common/reskontro/TransaksjonerFilterPanelView.tsx";
import { useBrukerTransaksjoner } from "./useBrukerTransaksjoner.ts";

export function BrukerTransaksjonerFilterPanel({ ident }: { ident: string }) {
    const { unikeMottakere, unikeBarn, unikeTransaksjonskoder } = useBrukerTransaksjoner(ident);

    return (
        <TransaksjonerFilterPanelView
            unikeMottakere={unikeMottakere}
            unikeBarn={unikeBarn}
            unikeTransaksjonskoder={unikeTransaksjonskoder}
        />
    );
}
