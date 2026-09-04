import type { Avvikshendelse } from "@bidrag/api/BidragForsendelseApi";
import { Alert, BodyShort, Button, Modal } from "@navikt/ds-react";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { useBidragForsendelseApi } from "../../api/api";
import useOnMutationSuccess from "../../hooks/useOnMutationSuccess";
import { RedirectTo } from "../../utils/RedirectUtils";
import { useSession } from "../forsendelse/context/SessionContext";

export default function SlettForsendelseButton() {
    const { forsendelseIdMedPrefix, enhet, saksnummer } = useSession();
    const bidragForsendelseApi = useBidragForsendelseApi();
    const openModal = () => ref.current?.showModal();
    // biome-ignore lint/suspicious/noExplicitAny: Migrering
    const closeModal = (e: React.MouseEvent<any>) => {
        e.preventDefault();
        ref.current?.close();
    };
    const ref = useRef<HTMLDialogElement>(null);

    const slettForsendelseFn = useMutation({
        mutationKey: ["slett_forsendelse"],
        mutationFn: async () => {
            const requestBody: Avvikshendelse = {
                avvikType: "SLETT_JOURNALPOST",
                detaljer: {},
            };
            await bidragForsendelseApi.api.utforAvvik(forsendelseIdMedPrefix, requestBody, {
                headers: {
                    "X-enhet": enhet,
                },
            });
        },
    });

    useOnMutationSuccess(slettForsendelseFn, () => RedirectTo.sakshistorikk(saksnummer));

    if (!forsendelseIdMedPrefix) return null;
    return (
        <>
            <Button type="button" size="small" onClick={openModal} variant="secondary" value="Slett forsendelse">
                Slett forsendelse
            </Button>
            <Modal
                ref={ref}
                onClose={closeModal}
                header={{
                    heading: "Slett forsendelse",
                }}
            >
                <Modal.Body>
                    {slettForsendelseFn.isError && (
                        <Alert variant="error">Det skjedde en feil ved sletting av forsendelse</Alert>
                    )}
                    <BodyShort>Er du sikker på at du vil slette forsendelse under opprettelse?</BodyShort>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        size="small"
                        onClick={() => slettForsendelseFn.mutate()}
                        loading={slettForsendelseFn.isPending}
                    >
                        Slett og gå tilbake til sakshistorikk
                    </Button>
                    <Button
                        size="small"
                        onClick={closeModal}
                        disabled={slettForsendelseFn.isPending}
                        variant="tertiary"
                    >
                        Avbryt
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
