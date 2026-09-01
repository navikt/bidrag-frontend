import type { DistribuerTilAdresse } from "@bidrag/api/BidragDokumentApi";
import { Alert, BodyShort, Heading, Loader } from "@navikt/ds-react";
import React, { useEffect, useState } from "react";
import { useHentJournalpost } from "../../../../../hooks/useDokumentApi";
import { hentMottakerAdresse } from "../../../../../hooks/usePersonApi";
import BestillDistribusjonInfo from "../../../../../pages/visjournalpost/components/distribuer/BestillDistribusjonInfo";
import { useJournalpost } from "../../../../../store/JournalpostContext";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import type { AvvikTypeCommonProps } from "./AvvikTypes";

type BestillNyDistribusjonProps = AvvikTypeCommonProps;

function BestillNyDistribusjon(props: BestillNyDistribusjonProps) {
    const handleSubmit = (values: BestillNyDistribusjonFirstStepValues) => {
        props.sendAvvik({
            type: AvvikType.BESTILL_NY_DISTRIBUSJON,
            adresse: values.adresse,
        });
        props.setActiveStep(2);
    };

    return (
        <>
            <BestillNyDistribusjonFirstStep isActive={props.activeStep === 1} onSubmit={handleSubmit} />
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Ny distribusjon er bestilt</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

interface BestillOriginalFirstStepProps {
    isActive: boolean;
    onSubmit: (values: BestillNyDistribusjonFirstStepValues) => void;
}

interface BestillNyDistribusjonFirstStepValues {
    adresse: DistribuerTilAdresse;
}

function BestillNyDistribusjonFirstStep(props: BestillOriginalFirstStepProps) {
    const [adresse, setAdresse] = useState<DistribuerTilAdresse>();
    const journalpost = useHentJournalpost();
    const { avsenderMottaker } = useJournalpost();
    const [onEditMode, setOnEditMode] = useState<boolean>(false);
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [error, setError] = useState<string>();

    const adresseFromJp = journalpost.distribuertTilAdresse;
    const missingAdresse = !adresse && !loadingData;
    const returdatoMissing =
        journalpost.returDetaljer?.dato == null && journalpost.returDetaljer?.logg.some((logg) => logg.dato == null);
    useEffect(() => {
        hentMottakerAdresse(journalpost.avsenderMottaker?.ident)
            .then(setAdresse)
            .finally(() => setLoadingData(false));
    }, []);

    useEffect(() => {
        setError(undefined);
    }, [adresse]);

    function onSubmit() {
        setError(undefined);
        if (missingAdresse) {
            setError("Adresse må settes før distribusjon");
        } else {
            props.onSubmit({ adresse });
        }
    }
    if (!props.isActive) {
        return null;
    }

    if (loadingData) {
        return <Loader />;
    }

    return (
        <div>
            {returdatoMissing && (
                <Alert variant="warning" className={"mt-2 mb-2"}>
                    <BodyShort>{"Returdato for siste retur må settes før bestilling av ny distribusjon"}</BodyShort>
                </Alert>
            )}
            {error && (
                <Alert variant="error" className={"mt-2 mb-2"}>
                    <BodyShort>{error}</BodyShort>
                </Alert>
            )}
            <BodyShort>Her kan du bestille ny distribusjon av journalpost</BodyShort>
            <BodyShort>
                Kontroller adresse nøye for å forsikre at brevet sendes til riktig destinasjon
                <br />
                <br />
                <i>Etter bestilling av ny distribusjon vil returloggen låses for endringer</i>
            </BodyShort>
            <Heading style={{ marginTop: "10px" }} size={"xsmall"} spacing>
                Distribusjon bestilles med følgende mottaker og adresse:
            </Heading>
            <div>
                {missingAdresse && (
                    <Alert variant="warning">
                        <BodyShort>
                            Fant ingen adresse for{" "}
                            {journalpost.avsenderMottaker?.ident ?? journalpost.avsenderMottaker?.navn}
                        </BodyShort>
                    </Alert>
                )}
                <div className={"mt-[-15px]"}>
                    <BestillDistribusjonInfo
                        mottakerId={journalpost.avsenderMottaker?.ident}
                        mottakerNavn={avsenderMottaker.visningsnavn}
                        adresse={adresse}
                        editable
                        onEditModeChanged={setOnEditMode}
                        onAdresseChanged={setAdresse}
                    />
                </div>
            </div>
            <AvvikModalButtons
                onSubmit={onSubmit}
                submitButtonLabel={"Bestill"}
                disabled={onEditMode || returdatoMissing}
            />
        </div>
    );
}

export default BestillNyDistribusjon;
