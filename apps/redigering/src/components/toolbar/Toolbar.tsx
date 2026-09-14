/** biome-ignore-all lint/a11y/noStaticElementInteractions: wrapper only stops click propagation and has no interactive semantics of its own */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: wrapper only stops click propagation and has no interactive semantics of its own */
import "./Toolbar.css";

import type { FC, PropsWithChildren } from "react";

const Toolbar: FC<PropsWithChildren<unknown>> = ({ children }) => {
    return (
        <div
            className={"editor_toolbar"}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <div className={"toolbar_content"}>{children}</div>
        </div>
    );
};

export default Toolbar;
