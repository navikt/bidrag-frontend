import { Loader } from "@navikt/ds-react";
import React from "react";

export const OverlayLoader = ({ loading }: { loading: boolean }) => {
    if (!loading) return null;
    return (
        <div className="flex items-center justify-center absolute top-0 bottom-0 w-full overflow-hidden z-0">
            <Loader size="medium" title="Lagrer..." transparent />
        </div>
    );
};

export const NavigationLoader = ({ loading }: { loading: boolean }) => {
    if (!loading) return null;
    return (
        <div className="flex items-start justify-center absolute top-0 bottom-0 w-full overflow-hidden z-0">
            <Loader size="3xlarge" title="Lagrer..." transparent />
        </div>
    );
};
