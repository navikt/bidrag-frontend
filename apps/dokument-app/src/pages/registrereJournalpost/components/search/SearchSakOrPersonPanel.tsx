import { TextField } from "@navikt/ds-react";
import { debounce } from "lodash";
import React, { type ChangeEvent, type ReactElement, useRef, useState } from "react";

import AvansertSok from "../../../../common/components/person/AvansertSok";
import { useStartPersonOrSakSearchCallback } from "../../../../servicesV2/useSakApi";
import { useSearch } from "../../../../store/SearchContext";
import SearchFailurePanel from "./SearchFailurePanel";

export default function SearchSakOrPersonPanel(): ReactElement {
    const [failedSearchValue, setFailedSearchValue] = useState<string>("");
    const { searchValue, setSearchValue, setEnkelSak } = useSearch();
    const startPersonOrSakSearch = useStartPersonOrSakSearchCallback();

    const startSearch = useRef(
        debounce((searchValue: string) => {
            startPersonOrSakSearch(searchValue).then((success) => {
                if (success == false) {
                    setFailedSearchValue(searchValue);
                }
            });
        }, 300),
    );

    function handleSearchFieldInputChange(e: ChangeEvent<HTMLInputElement>) {
        const searchValueFromEvent = e.target.value;
        doSearch(searchValueFromEvent);
    }

    function doSearch(value: string) {
        setSearchValue(value);
        setFailedSearchValue("");
        startSearch.current.cancel();
        startSearch.current(value);
    }

    function resetSearch() {
        setFailedSearchValue("");
        setEnkelSak(undefined);
        setSearchValue(undefined);
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.code === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            startSearch.current(searchValue);
        }
    }

    return (
        <div className="search search-sak-person-panel">
            <div className={"search-field"} onKeyDown={onKeyDown}>
                <TextField
                    label={"Fødsels- eller Saksnummer"}
                    onChange={handleSearchFieldInputChange}
                    value={searchValue}
                    size="small"
                    className="personident"
                    type="text"
                    name="searchInputForSaknrEllerFnr"
                />
                <AvansertSok onResult={(data) => doSearch(data.ident)} />
            </div>
            <React.Suspense fallback={<></>}>
                <SearchFailurePanel resetSearch={resetSearch} failedSearchValue={failedSearchValue} />
            </React.Suspense>
        </div>
    );
}
