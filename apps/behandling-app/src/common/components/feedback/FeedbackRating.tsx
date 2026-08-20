import "./FeedbackRating.css";

import type { ChangeEvent } from "react";
import { type Rating, smilies } from "./feedback";

interface FeedbackRatingProps {
    name: string;
    selected: Rating;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const FeedbackRating = ({ name, selected, handleChange }: FeedbackRatingProps) => {
    return (
        <section className={"FeedbackRating" + (selected === "-1" ? " not-started" : "")}>
            <RatingOption
                value="1"
                src={smilies.veldigMisfornoyd}
                alt="Veldig misfornøyd"
                {...{ name, selected, handleChange }}
            />
            <RatingOption value="2" src={smilies.misfornoyd} alt="Misfornøyd" {...{ name, selected, handleChange }} />
            <RatingOption value="3" src={smilies.noytral} alt="Nøytral" {...{ name, selected, handleChange }} />
            <RatingOption value="4" src={smilies.fornoyd} alt="Fornøyd" {...{ name, selected, handleChange }} />
            <RatingOption
                value="5"
                src={smilies.veldigFornoyd}
                alt="Veldig fornøyd"
                {...{ name, selected, handleChange }}
            />
        </section>
    );
};

interface RatingOptionProps extends FeedbackRatingProps {
    value: Rating;
    src: string;
    alt: string;
}

const RatingOption = ({ value, src, alt, name, selected, handleChange }: RatingOptionProps) => {
    return (
        <label className="RatingOption">
            <input
                type="radio"
                name={name}
                className="screen-reader-only"
                value={value}
                checked={selected === value}
                aria-checked={selected === value}
                onChange={handleChange}
            />
            <img src={src} alt={alt} />
        </label>
    );
};

export default FeedbackRating;
