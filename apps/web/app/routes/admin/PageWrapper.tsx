import "./index.css";

import {Loader} from "@navikt/ds-react";
import {useIsRestoring} from "@tanstack/react-query";
import React, {PropsWithChildren} from "react";

interface PageWrapperProps {
    name: string;
}

export default function PageWrapper({children, name}: PropsWithChildren<PageWrapperProps>) {
    const isRestoring = useIsRestoring();

    return <div className={name}>{isRestoring ? <Loader/> : children}</div>;
}
