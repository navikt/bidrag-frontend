import "./FeedbackPopup.css";

import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, Heading, Link } from "@navikt/ds-react";
import { useEffect } from "react";

import FeedbackForm from "./FeedbackForm";
import FeedbackThankYouMessage from "./FeedbackThankYouMessage";

interface Props {
    isOpen: boolean;
    isAnswered: boolean;
    onDoNotShow: () => void;
}

const FeedbackPopup = ({ isOpen, isAnswered, onDoNotShow }: Props) => {
    useEffect(() => {
        const element = document.getElementById("feedbackPopup");
        if (element) {
            if (isOpen) {
                element.classList.remove("closed");
            } else {
                element.classList.add("closed");
            }
        }
    }, [isOpen]);

    const renderForm = () => (
        <Box
            tabIndex={-1}
            id="feedbackPopup"
            borderWidth="3"
            borderRadius="4"
            shadow="dialog"
            className="FeedbackPopup"
        >
            <Heading level="1" size="medium" spacing className="FeedbackPopup__title">
                Gi din tilbakemelding!
            </Heading>
            <BodyShort size="small" spacing>
                Vi ønsker din tilbakemelding for at løsningen skal bli best mulig.
            </BodyShort>
            <BodyShort size="small" spacing>
                Endringsønsker og/eller feil på en konkret bruker må meldes i{" "}
                <Link
                    href="hhttps://jira.adeo.no/plugins/servlet/desk/portal/541/create/1861"
                    target="_blank"
                    rel="noopener noreferrer external help"
                    variant="action"
                >
                    Porten
                    <ExternalLinkIcon title="Åpne 'Porten' i en ny fane" aria-hidden={true} />
                </Link>
            </BodyShort>
            <FeedbackForm onDoNotShow={onDoNotShow} />
        </Box>
    );

    return isAnswered ? <FeedbackThankYouMessage /> : renderForm();
};

export default FeedbackPopup;
