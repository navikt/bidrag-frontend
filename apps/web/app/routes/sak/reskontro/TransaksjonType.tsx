import { visningsnavnForTransaksjonskode } from "./transaksjonstyper";

interface TransaksjonTypeProps {
    kode: string;
}

export function TransaksjonType({ kode }: TransaksjonTypeProps) {
    const visning = visningsnavnForTransaksjonskode(kode);
    return (
        <div>
            <strong>{kode}</strong> {visning}
        </div>
    );
}
