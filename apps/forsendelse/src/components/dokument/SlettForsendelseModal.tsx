import { BodyShort, Button, Modal } from "@navikt/ds-react";
import { useMutation } from "@tanstack/react-query";
import { useBidragForsendelseApi } from "../../api/api";
import { useSession } from "../../pages/forsendelse/context/SessionContext";
import { AvvikType } from "../../types/AvvikTypes";
import { RedirectTo } from "../../utils/RedirectUtils";

export default function SlettForsendelseModal({ closeModal }: { closeModal: () => void }) {
    const { forsendelseId, saksnummer } = useSession();
    const bidragForsendelseApi = useBidragForsendelseApi();

    const deleteForsendelseFnf = useMutation({
        mutationFn: () =>
            bidragForsendelseApi.api.utforAvvik(forsendelseId, {
                avvikType: AvvikType.SLETT_JOURNALPOST,
                detaljer: {},
            }),
        onSuccess: () => {
            RedirectTo.sakshistorikk(saksnummer);
        },
    });

    function deleteDocuments() {
        deleteForsendelseFnf.mutate();
    }
    return (
        <Modal
            open
            onClose={closeModal}
            className={`min-w-[450px] max-w-[900px]`}
            header={{
                heading: "Ønsker du å slette forsendelsen?",
            }}
        >
            <Modal.Body>
                <BodyShort spacing>
                    Du er i ferd med å slette alle dokumenter i forsendelse. En forsendelse må minst ha ett dokument.
                    <br /> Ønsker du å slette hele forsendelsen istedenfor?
                </BodyShort>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    size="small"
                    variant="danger"
                    onClick={deleteDocuments}
                    loading={deleteForsendelseFnf.isPending}
                >
                    Slett forsendelse og gå tilbake til sakshistorikk
                </Button>
                <Button size="small" variant={"tertiary"} onClick={closeModal}>
                    Avbryt
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
