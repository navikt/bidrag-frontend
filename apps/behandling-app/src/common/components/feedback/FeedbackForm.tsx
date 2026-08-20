import "./FeedbackForm.css";

import { BodyShort, Button, HStack, Textarea, VStack } from "@navikt/ds-react";
import { useForm } from "react-hook-form";
import { useFeedback } from "./FeedbackContext";
import type { Rating } from "./feedback";

interface Props {
    onDoNotShow: () => void;
}

interface FeedbackFormValues {
    comment: string;
    rating: Rating;
}

const FeedbackForm = ({ onDoNotShow }: Props) => {
    const { state, sendFeedback } = useFeedback();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FeedbackFormValues>({
        defaultValues: {
            comment: "",
            rating: "-1",
        },
        mode: "onChange",
    });

    const commentValue = watch("comment");

    const onSubmit = async (data: FeedbackFormValues) => {
        await sendFeedback({
            comment: data.comment,
            rating: data.rating,
        });
    };

    const handleFormClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="FeedbackForm" onClick={handleFormClick}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <VStack>
                    <BodyShort size="small" spacing>
                        Hvordan fungerer løsningen for deg? Kunne noe vært enklere?
                    </BodyShort>
                    <Textarea
                        {...register("comment")}
                        label={
                            "Du kan her gi din anonyme tilbakemelding. Den vil bli lest og vurdert, men blir ikke besvart."
                        }
                        maxLength={750}
                        size="small"
                        error={errors.comment?.message}
                        className="FeedbackForm__textarea"
                    />
                    <HStack>
                        <Button
                            size="small"
                            variant="primary"
                            type="submit"
                            loading={state.pending}
                            disabled={commentValue === ""}
                        >
                            Send
                        </Button>
                        <Button
                            size="small"
                            variant="tertiary"
                            onClick={onDoNotShow}
                            className="FeedbackForm__button--dontshow"
                        >
                            Ikke vis denne igjen
                        </Button>
                    </HStack>
                </VStack>
            </form>
        </div>
    );
};

export default FeedbackForm;
