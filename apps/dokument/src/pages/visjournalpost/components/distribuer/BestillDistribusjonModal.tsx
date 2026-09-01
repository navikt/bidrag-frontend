import type { DistribuerTilAdresse } from "@bidrag/api/BidragDokumentApi";
import { Alert, BodyShort, Button, Heading, Loader, Modal } from "@navikt/ds-react";
import React, { useEffect, useState } from "react";
import { RedirectTo } from "../../../../common/utils/RedirectUtils";
import { useDistribuerJournalpost } from "../../../../hooks/useDistribusjonApi";
import { useHentJournalpost } from "../../../../hooks/useDokumentApi";
import { useHentPostnummer } from "../../../../hooks/useKodeverkApi";
import { hentMottakerAdresse } from "../../../../hooks/usePersonApi";
import { useAppContext } from "../../../../store/AppContext";
import BestillDistribusjonInfo from "./BestillDistribusjonInfo";

interface BestillDistribusjonModalProps {
    onCancel: () => void;
}
export default function BestillDistribusjonModal({ onCancel }: BestillDistribusjonModalProps) {
    const journalpost = useHentJournalpost();
    const {
        appState: { saksnummer, påloggetEnhet },
        updateAppState,
    } = useAppContext();
    const postnummere = useHentPostnummer();
    const [adresse, setAdresse] = useState<DistribuerTilAdresse>();
    const [submitState, setSubmitState] = useState<"pending" | "idle" | "succesfull" | "error">("idle");
    const [onEditMode, setOnEditMode] = useState<boolean>(false);
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [error, setError] = useState<string>();
    const distribuerJpMutation = useDistribuerJournalpost();

    const mottaker = journalpost.avsenderMottaker;
    useEffect(() => {
        if (mottaker.adresse) {
            const adresse = { ...mottaker.adresse, land: mottaker.adresse.landkode };
            const manglerPoststed = adresse.landkode === "NO" && adresse.postnummer && !adresse.poststed;
            if (manglerPoststed) {
                adresse.poststed = getPoststedByPostnummer(adresse.postnummer);
            }
            setLoadingData(false);
        } else {
            hentMottakerAdresse(mottaker.ident)
                .then(setAdresse)
                .finally(() => setLoadingData(false));
        }
    }, []);

    function getPoststedByPostnummer(postnummer?: string) {
        if (!postnummer) {
            return undefined;
        }
        const postnummerValue = postnummere.find((value) => Object.keys(value)[0] === postnummer);
        return postnummerValue ? postnummerValue[postnummer] : undefined;
    }

    function onSubmit() {
        // if (!adresse) {
        //     setError("Adresse må settes før distribusjon");
        //     setSubmitState("error");
        //     return;
        // }

        setError(null);
        updateAppState({ disableJournalpostPoller: true });
        setSubmitState("pending");
        distribuerJpMutation
            .mutateAsync({
                journalpostId: journalpost.journalpostId,
                paloggetenhet: påloggetEnhet,
                lokalUtskrift: false,
                distribuerTilAdresse: adresse,
            })
            .then(() => {
                setSubmitState("succesfull");
                RedirectTo.sakshistorikk(saksnummer);
            })
            .catch(() => {
                setError("Det skjedde en feil ved bestilling av distribusjon. Vennligst prøv på nytt.");
                setSubmitState("error");
            });
    }

    function renderModalBody() {
        if (loadingData) {
            return <Loader />;
        }

        const submitButtonDisabled = submitState === "pending" || submitState === "succesfull" || onEditMode;
        const cancelButtonDisabled = submitState === "pending" || submitState === "succesfull";
        return (
            <>
                <React.Suspense fallback={<Loader variant="neutral" size="small" />}>
                    <BestillDistribusjonInfo
                        mottakerId={mottaker.ident}
                        mottakerNavn={mottaker.navn}
                        adresse={adresse}
                        editable={submitState === "idle"}
                        onEditModeChanged={setOnEditMode}
                        onAdresseChanged={setAdresse}
                    />
                </React.Suspense>
                <div className="flex items-center pt-4 gap-2">
                    <Button
                        size="small"
                        variant={"primary"}
                        onClick={onSubmit}
                        loading={submitState === "pending"}
                        disabled={submitButtonDisabled}
                    >
                        Bekreft og gå tilbake til sakshistorikk
                    </Button>
                    <Button size="small" variant={"secondary"} disabled={cancelButtonDisabled} onClick={onCancel}>
                        Avbryt
                    </Button>
                </div>
            </>
        );
    }

    const isSubmitting = submitState === "pending" || submitState === "succesfull";

    return (
        <Modal
            open
            aria-label=""
            className="bestill-distribusjon-modal !max-w-[800px]"
            onClose={onCancel}
            closeOnBackdropClick={false}
        >
            <Modal.Header closeButton={!isSubmitting}>
                <Heading size="medium">Skal du sende brevet sentralt/digitalt?</Heading>
            </Modal.Header>

            <Modal.Body className="w-[500px]">
                {error && (
                    <Alert variant="error" className={"mt-2"}>
                        <BodyShort>{error}</BodyShort>
                    </Alert>
                )}
                {!adresse && !loadingData && (
                    <Alert variant="warning" className={"mt-2"}>
                        <BodyShort>Fant ingen adresse for mottaker {mottaker.ident}</BodyShort>
                    </Alert>
                )}
                {submitState === "succesfull" && (
                    <Alert variant="success" className={"mt-2"}>
                        <BodyShort>Distribusjon bestilt. Åpner sakshistorikk</BodyShort>
                    </Alert>
                )}
                {renderModalBody()}
            </Modal.Body>
        </Modal>
    );
}
