import "./FeedbackThankYouMessage.css";

import { BodyLong, Box, VStack } from "@navikt/ds-react";

import { smilies } from "./feedback";

const FeedbackThankYouMessage = () => {
    return (
        <Box borderWidth="3" borderRadius="4" shadow="dialog" className="FeedbackThankYouMessage">
            <VStack gap="space-2" align="center">
                <img src={smilies.veldigFornoyd} alt="Smiley" />
                <BodyLong size="small" align="center">
                    Takk for at du tok deg tid til å gi tilbakemelding. Vi bruker innspillene til å forbedre løsningen.
                </BodyLong>
            </VStack>
        </Box>
    );
};

export default FeedbackThankYouMessage;
