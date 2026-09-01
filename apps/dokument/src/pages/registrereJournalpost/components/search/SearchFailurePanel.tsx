import { Alert, BodyShort } from "@navikt/ds-react";
import React, { type ReactElement } from "react";

import { isEmpty, isTrue } from "../../../../common/utils/ObjectUtils";
import { useHentGjelder } from "../../../../hooks/usePersonApi";
import { useSearch } from "../../../../store/SearchContext";
import PersonSakNoAccessWarning from "../modal/PersonSakNoAccessWarning";

interface SearchFailureProps {
    resetSearch: () => void;
    failedSearchValue?: string;
}

export default function SearchFailurePanel(props: SearchFailureProps): ReactElement {
    const person = useHentGjelder();
    const { enkelSak } = useSearch();

    const searchFailed =
        enkelSak?.begrensetTilgang || person?.begrensetTilgang == true || !isEmpty(props.failedSearchValue);

    if (!searchFailed) {
        return null;
    }

    if (person?.begrensetTilgang || enkelSak?.begrensetTilgang) {
        return <PersonSakNoAccessWarning person={person} sak={enkelSak} onCancel={props.resetSearch} />;
    }

    const personSearchFailed = isTrue(person?.feil) || isTrue(person?.begrensetTilgang);

    return (
        <div className={"search-failure-panel"}>
            <Alert className={"alertstripe"} variant="info" inline>
                <BodyShort>
                    {personSearchFailed ? "Fant ingen person med fødselsnummer" : "Fant ingen sak med saksnummer"}{" "}
                    {props.failedSearchValue}
                </BodyShort>
            </Alert>
        </div>
    );
}
