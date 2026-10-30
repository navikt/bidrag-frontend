import "../index.css";
import "@navikt/ds-css";

import { Provider } from "@navikt/ds-react";
import React, { PropsWithChildren, useRef } from "react";

interface IPageWrapperProps {
    name: string;
}

export default function PageWrapper({ children, name }: PropsWithChildren<IPageWrapperProps>) {
    const divRef = useRef<HTMLDivElement>(null);
    return (
        <div className="bidrag-sak-ui" ref={divRef}>
            <Provider rootElement={divRef.current}>
                <div className={name}>{children}</div>
            </Provider>
        </div>
    );
}
