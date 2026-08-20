import { Alert, type AlertProps } from "@navikt/ds-react";
import type React from "react";

type ForskuddAlertProps = {
    children?: React.ReactNode;
};

export const BehandlingAlert = ({ children, ...alertProps }: ForskuddAlertProps & AlertProps) => {
    return (
        <Alert {...alertProps} size="small" className={"w-[708px] ax-sm:max-w-[688px] " + (alertProps.className ?? "")}>
            {children}
        </Alert>
    );
};
