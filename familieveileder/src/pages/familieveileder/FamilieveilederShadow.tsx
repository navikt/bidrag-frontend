import React, { useEffect, useRef } from "react";

import { createCustomElement, createEventsForFunctionProps, getParsedProps } from "../../customElementLoader";
import FamilieveilederPage, { IFamilieveilederProps } from "./FamilieveilederPage";

const parentElementId = "bidrag-sak-ui_familieveileder";
const appName = "familie-veileder";
const App = (props: IFamilieveilederProps) => {
    const isCreating = useRef(false);
    const id = useRef(parentElementId + props.fodselsnummer + props.rolle);

    useEffect(() => {
        return createEventsForFunctionProps(props, appName);
    }, [props]);

    useEffect(() => {
        createCustomElement(appName, getParsedProps(props, appName), FamilieveilederPage, id.current);
        if (isCreating.current) return;
        isCreating.current = true;
    }, []);
    //@ts-ignore
    return <familie-veileder id={id.current} {...getParsedProps(props, appName)}></familie-veileder>;
};

export default App;
