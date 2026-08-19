import React, { type MutableRefObject, type ReactElement } from "react";

import AutoSuggest from "../autosuggest/AutoSuggest";
import AutoCompleteTeksterAsList from "./beskrivelse_autocomplete_tekster.json";

interface EndreDokumentTittelProps {
    label?: string | ReactElement;
    description?: string;
    defaultValue?: string;
    onTitleChange: (value: string) => void;
    error?: string;
    containerRef?: MutableRefObject<HTMLDivElement>;
}

export default function EndreDokumentTittel(props: EndreDokumentTittelProps) {
    const { label, defaultValue, onTitleChange, error } = props;

    return (
        <div ref={props.containerRef} style={{ width: "inherit" }}>
            <AutoSuggest
                label={label}
                defaultValue={defaultValue}
                changeInnhold={onTitleChange}
                error={error}
                description={props.description}
                options={AutoCompleteTeksterAsList}
            />
        </div>
    );
}
