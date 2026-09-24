import { Alert, type AlertProps } from "@navikt/ds-react";
import type { ReactNode } from "react";

type ForskuddAlertProps = {
    children?: ReactNode;
};

export const BehandlingAlert = ({ children, ...alertProps }: ForskuddAlertProps & AlertProps) => {
    return (
        <Alert
            {...alertProps}
            size="small"
            className={`w-[708px] ax-sm:max-w-[688px] mb-1 ${alertProps.className ?? ""}`}
        >
            {children}
        </Alert>
    );
};
