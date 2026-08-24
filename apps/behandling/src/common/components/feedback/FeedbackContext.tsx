import type React from "react";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";

import { useSendFeedback } from "./useFeedbackMutation";

export interface FeedbackState {
    isAnswered: boolean;
    error: string | null;
    pending: boolean;
}

interface FeedbackContextType {
    state: FeedbackState;
    sendFeedback: (feedback: { comment: string; rating: string }) => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

const ANSWER_DELAY_MS = 2000;

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error("useFeedback must be used within a FeedbackProvider");
    }
    return context;
};

interface FeedbackProviderProps {
    children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
    const [isAnswered, setIsAnswered] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const sendFeedbackMutation = useSendFeedback();

    const sendFeedback = async (feedback: { comment: string; rating: string }) => {
        setError(null);
        try {
            await sendFeedbackMutation.mutateAsync(feedback);
            setIsAnswered(true);
            if (answerTimeoutRef.current) {
                clearTimeout(answerTimeoutRef.current);
            }
            answerTimeoutRef.current = setTimeout(() => {
                setIsAnswered(false);
            }, ANSWER_DELAY_MS);
        } catch {
            setError("Failed to send feedback");
        }
    };

    useEffect(() => {
        return () => {
            if (answerTimeoutRef.current) {
                clearTimeout(answerTimeoutRef.current);
            }
        };
    }, []);

    const state: FeedbackState = {
        isAnswered,
        error,
        pending: sendFeedbackMutation.isPending,
    };

    return <FeedbackContext.Provider value={{ state, sendFeedback }}>{children}</FeedbackContext.Provider>;
};
