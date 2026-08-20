import { visningsnavnForTransaksjonskode } from "./transaksjonstyper";

interface TransaksjonTypeProps {
    kode?: string | null;
}

export function TransaksjonType({ kode }: TransaksjonTypeProps) {
    if (!kode) {
        return null;
    }
    return (
        <div>
            <strong>{kode}</strong> {visningsnavnForTransaksjonskode(kode)}
        </div>
    );
}
