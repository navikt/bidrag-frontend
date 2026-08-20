import { Alert, BodyShort, Dialog, Loader } from "@navikt/ds-react";
import { useQuery } from "@tanstack/react-query";
import { hentTransaksjonerPaTransaksjonsid } from "~/api/query/reskontro.query";
import { DetaljTransaksjonerTabell } from "~/routes/sak/reskontro/DetaljTransaksjonerTabell.tsx";

interface MotposterDialogProps {
    transaksjonsid: number | null;
    onClose: () => void;
}

export function MotposterDialog({ transaksjonsid, onClose }: MotposterDialogProps) {
    // enabled styres av om dialogen faktisk er åpnet, slik at kallet
    // ikke gjøres før brukeren ber om det (lazy)
    const { data, isLoading, isError } = useQuery({
        ...hentTransaksjonerPaTransaksjonsid(transaksjonsid ?? 0),
        enabled: !!transaksjonsid,
    });

    const motposter = data?.transaksjoner ?? [];

    return (
        <Dialog open={!!transaksjonsid} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Popup width={"80%"}>
                <Dialog.Header>
                    <Dialog.Title>Motposter for transaksjon {transaksjonsid ?? ""}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    {isLoading && <Loader size="small" title="Henter motposter …" />}
                    {isError && (
                        <Alert variant="error" size="small">
                            Klarte ikke å hente motposter.
                        </Alert>
                    )}
                    {!isLoading && !isError && motposter.length === 0 && <BodyShort>Ingen motposter funnet.</BodyShort>}
                    {motposter.length > 0 && (
                        <DetaljTransaksjonerTabell transaksjoner={motposter} skjulMotposter={true} />
                    )}
                </Dialog.Body>
            </Dialog.Popup>
        </Dialog>
    );
}
