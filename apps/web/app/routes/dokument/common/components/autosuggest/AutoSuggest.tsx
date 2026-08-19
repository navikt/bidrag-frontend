import "./autosuggest.less";

import { TextField } from "@navikt/ds-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { useEffect } from "react";
import { ReactElement } from "react";

import { capitalizeFirstLetter } from "../../utils/StringUtils";
import { removeNonPrintableCharachters } from "../../utils/StringUtils";

interface AutoSuggestProps {
    changeInnhold: (value: string) => void;
    options: string[];
    label: string | ReactElement;
    defaultValue?: string;
    description?: string;
    error?: string;
}

export default function AutoSuggest(props: AutoSuggestProps) {
    const [activeOption, setActiveOption] = useState<number>(0);
    const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [userInput, setUserInput] = useState<string>(props.defaultValue);
    const onBlurTimeoutRef = useRef<NodeJS.Timeout>(null);
    const avoidBlurRef = useRef<boolean>(false);
    const [cursor, setCursor] = useState(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const input = inputRef.current;
        if (input) input.setSelectionRange(cursor, cursor);
    }, [inputRef, cursor, userInput]);

    function searchSuggestions(options, searchTerm) {
        const searchTermTrimmed = searchTerm.trim();
        return options
            .filter(
                (currentOptionString) =>
                    toUppercaseForEveryFirstLetter(currentOptionString).search(
                        getRegExForSearchedFirstLetterTerms(searchTermTrimmed)
                    ) > -1
            )
            .sort(sortByLengthOfString);
    }

    function getRegExForSearchedFirstLetterTerms(stringToRemoveWhiteSpacesFrom: string) {
        const charsToSearchFor = stringToRemoveWhiteSpacesFrom
            .replaceAll("+", "")
            .replaceAll(")", "")
            .replaceAll("(", "")
            .replaceAll("*", "")
            .replaceAll("[", "")
            .replaceAll("]", "")
            .split(" ");
        return charsToSearchFor.map((curr) => `(?=.*${capitalizeFirstLetter(curr)})`).join("");
    }

    function sortByLengthOfString(a, b) {
        return a.length - b.length;
    }

    function toUppercaseForEveryFirstLetter(stringToChange: string) {
        return stringToChange.split(" ").map(capitalizeFirstLetter).join("");
    }

    function hideOptions() {
        setActiveOption(0);
        setFilteredOptions([]);
        setShowOptions(false);
    }

    function onBlur() {
        onBlurTimeoutRef.current = setTimeout(() => {
            if (!avoidBlurRef.current) {
                hideOptions();
            }
        }, 10);
    }

    function avoidBlur() {
        avoidBlurRef.current = true;
        clearTimeout(onBlurTimeoutRef.current);
    }

    function onFocus(e: ChangeEvent<HTMLInputElement>) {
        const userInput = removeNonPrintableCharachters(e.target.value);
        showFilteredOptions(userInput);
        avoidBlurRef.current = false;
    }

    function showFilteredOptions(input: string) {
        const { options } = props;
        const filteredOptions = searchSuggestions(options, input);
        setShowOptions(true);
        if (filteredOptions.length > 0) {
            setActiveOption(0);
            setFilteredOptions(filteredOptions);
            setShowOptions(true);
        } else {
            setFilteredOptions([]);
            setShowOptions(false);
        }
        return filteredOptions;
    }

    function updateInput(value: string) {
        props.changeInnhold(value);
        setUserInput(value);
    }

    function onChange(e: ChangeEvent<HTMLInputElement>) {
        setCursor(e.target.selectionStart);
        const inputValue = removeNonPrintableCharachters(e.target.value);
        if (inputValue !== userInput) {
            showFilteredOptions(inputValue);
            updateInput(inputValue);
        }
    }

    function onOptionClick(e: React.MouseEvent<HTMLLIElement>) {
        avoidBlur();
        const eventTarget = e.target as HTMLElement;
        const value = eventTarget.innerText;
        updateInput(value);
        hideOptions();
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.code === "Escape") {
            setActiveOption(0);
            setShowOptions(false);
        } else if (e.code === "Enter") {
            if (showOptions) {
                const userInput = filteredOptions[activeOption];
                updateInput(userInput);
                hideOptions();
            } else {
                e.preventDefault();
                e.stopPropagation();
            }
        } else if (e.code === "ArrowUp") {
            if (activeOption === 0) {
                return;
            }
            setActiveOption((prevActiveOption) => prevActiveOption - 1);
        } else if (e.code === "ArrowDown") {
            if (activeOption === filteredOptions.length - 1) {
                return;
            }
            setActiveOption((prevActiveOption) => prevActiveOption + 1);
        }
    }

    return (
        <div className={"autosuggest"} onBlur={onBlur}>
            <div
                className={`w-full autosuggest-input ${props.label ? "has-label" : ""} ${
                    props.description ? "has-description" : ""
                }`}
            >
                <TextField
                    size="small"
                    label={props.label}
                    type="text"
                    ref={(ref) => {
                        inputRef.current = ref;
                    }}
                    description={props.description}
                    onChange={onChange}
                    onFocus={onFocus}
                    onKeyDown={onKeyDown}
                    className="w-full"
                    style={{ marginBottom: props.error ? "0px" : "30px", width: "100%" }}
                    error={props.error}
                    id={"autogsuggest_" + props.label}
                    value={userInput}
                />
                <i className={"chevron--ned"} />
            </div>
            <SelectableOptions
                avoidBlur={avoidBlur}
                show={showOptions}
                options={filteredOptions}
                activeOption={activeOption}
                onSelect={onOptionClick}
            />
        </div>
    );
}

interface SelectableOptionsProps {
    options: string[];
    show: boolean;
    activeOption: number;
    avoidBlur: () => void;
    onSelect: (e: React.MouseEvent<HTMLLIElement>) => void;
}

function SelectableOptions({ show, options, activeOption, onSelect, avoidBlur }: SelectableOptionsProps) {
    if (!show) {
        return null;
    }
    return (
        <ul className="options" style={{ marginTop: "-14px" }}>
            {options.length === 0 ? (
                <li className="option-no-content">Ingen resultat</li>
            ) : (
                options.map((optionName, index) => {
                    return (
                        <li
                            className={index === activeOption ? "option-active" : ""}
                            key={optionName}
                            onClick={onSelect}
                            onMouseDown={avoidBlur}
                            onFocus={avoidBlur}
                        >
                            {optionName}
                        </li>
                    );
                })
            )}
        </ul>
    );
}
