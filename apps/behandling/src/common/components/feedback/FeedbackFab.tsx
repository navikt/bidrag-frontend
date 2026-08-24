import "./FeedbackFab.css";

import { ChatElipsisIcon, XMarkIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, VStack } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { FeedbackProvider, useFeedback } from "./FeedbackContext";
import FeedbackPopup from "./FeedbackPopup";

const localStorageKey = "behandling__tilbakemelding__do-not-show";

const UserFeedbackDialog = () => {
    const visTilbakemelding = useFlag("behandling.vis_tilbakemelding");

    if (!visTilbakemelding) {
        return null;
    }

    return (
        <FeedbackProvider>
            <FeedbackFab />
        </FeedbackProvider>
    );
};
const FeedbackFab = () => {
    const doNotShowFromLocalStorage = window.localStorage.getItem(localStorageKey) === "true";

    const [doNotShow, setDoNotShow] = useState<boolean>(doNotShowFromLocalStorage);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const node = useRef<HTMLDivElement>(null);
    const prevStateAnswered = useRef<boolean>(false);

    const { state } = useFeedback();
    const isAnswered = state.isAnswered;
    const handleClick = useCallback(
        (e: Event) => {
            const fabElement = node.current;
            const target = e.target as Element;

            // Check if click is inside the fab button
            if (fabElement?.contains(target)) {
                return;
            }

            // Check if click is inside the popup by traversing up the DOM tree
            if (isOpen) {
                let element = target;
                while (element) {
                    if (element.id === "feedbackPopup") {
                        return; // Click is inside popup, don't close
                    }
                    element = element.parentElement;
                }
            }

            // Close popup if click is outside
            setIsOpen(false);
        },
        [isOpen],
    );
    useEffect(() => {
        if (prevStateAnswered.current && !isAnswered) {
            setIsOpen(false);
        }
        prevStateAnswered.current = isAnswered;
    }, [isAnswered]);
    useEffect(() => {
        document.addEventListener("mousedown", handleClick);
        return () => {
            document.removeEventListener("mousedown", handleClick);
        };
    }, [handleClick]);

    useEffect(() => {
        const el = document.getElementById("feedbackFab");
        if (el) {
            if (isOpen) {
                el.classList.add("open");
            } else {
                el.classList.remove("open");
            }
        }
    }, [isOpen]);

    const toggleIsOpen = () => setIsOpen(!isOpen);

    const handleDoNotShow = () => {
        window.localStorage.setItem(localStorageKey, "true");
        setDoNotShow(true);
    };

    if (doNotShow) {
        return null;
    }

    return (
        <Box ref={node} id="feedbackFab" shadow="dialog" className="FeedbackFab">
            {!isAnswered && (
                <button type="button" onClick={toggleIsOpen} className="FeedbackFab__button">
                    <VStack align="center">
                        <BodyShort size="small" className="FeedbackFab__button-text">
                            Gi tilbakemelding
                        </BodyShort>
                        {isOpen ? (
                            <XMarkIcon
                                title="Lukk tilbakemelding"
                                fontSize="1.5rem"
                                aria-hidden={true}
                                className="FeedbackFab__button-icon"
                            />
                        ) : (
                            <ChatElipsisIcon
                                title="Vis tilbakemelding"
                                fontSize="2rem"
                                aria-hidden={true}
                                className="FeedbackFab__button-icon"
                            />
                        )}
                    </VStack>
                </button>
            )}
            <FeedbackPopup isOpen={isOpen} isAnswered={isAnswered} onDoNotShow={handleDoNotShow} />
        </Box>
    );
};

export default UserFeedbackDialog;
