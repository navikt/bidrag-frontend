import { Button, Dialog } from "@navikt/ds-react";

/** Bekreftelse før et utfylt skjema nullstilles. */
export default function NullstillDialog({
    open,
    onOpenChange,
    beskrivelse,
    onBekreft,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    beskrivelse: string;
    onBekreft: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Popup width="small" role="alertdialog">
                <Dialog.Header>
                    <Dialog.Title>Er du sikker?</Dialog.Title>
                    <Dialog.Description>{beskrivelse}</Dialog.Description>
                </Dialog.Header>
                <Dialog.Footer>
                    <Button type="button" size="small" onClick={onBekreft}>
                        Ja, start på nytt
                    </Button>
                    <Dialog.CloseTrigger>
                        <Button type="button" size="small" variant="secondary">
                            Avbryt
                        </Button>
                    </Dialog.CloseTrigger>
                </Dialog.Footer>
            </Dialog.Popup>
        </Dialog>
    );
}
