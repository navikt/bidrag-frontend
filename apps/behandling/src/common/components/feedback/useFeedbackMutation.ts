import { SecureLoggerService } from "@bidrag/common";
import { useMutation } from "@tanstack/react-query";

export interface Feedback {
    comment: string;
    rating: string;
}

const sendFeedbackApi = async (feedback: Feedback): Promise<void> => {
    SecureLoggerService.feedback(`Tilbakemelding: Kommentar="${feedback.comment}"`);

    await new Promise((resolve) => setTimeout(resolve, 1000));
};

export const useSendFeedback = () => {
    return useMutation({
        mutationFn: sendFeedbackApi,
        retry: false,
        onError: (error) => {
            console.error("Failed to send feedback:", error);
        },
    });
};
