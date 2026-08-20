import { TransaksjonerFilterPanel } from "~/common/reskontro/TransaksjonerFilterPanel.tsx";
import { useBrukerTransaksjoner } from "./useBrukerTransaksjoner.ts";

export function BrukerTransaksjonerFilterPanel({ ident }: { ident: string }) {
    const { unikeMottakere, unikeBarn, unikeTransaksjonskoder } = useBrukerTransaksjoner(ident);

    return (
        <TransaksjonerFilterPanel
            unikeMottakere={unikeMottakere}
            unikeBarn={unikeBarn}
            unikeTransaksjonskoder={unikeTransaksjonskoder}
        />
    );
}
