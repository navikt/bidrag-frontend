import type { AlertProps } from "@navikt/ds-react";
import { type ReactNode, useState } from "react";

import { BehandlingAlert } from "./BehandlingAlert";

type StatefulAlertProps = {
    children?: ReactNode;
    alertKey: string;
};
export default function StatefulAlert({ children, ...alertprops }: StatefulAlertProps & AlertProps) {
    return <AlertWithCloseButton {...alertprops}>{children}</AlertWithCloseButton>;
}
const AlertWithCloseButton = ({
    children,
    alertKey,
    ...alertProps
}: {
    children?: ReactNode;
    alertKey: string;
} & AlertProps) => {
    const [show, setShow] = useState(window.localStorage.getItem(alertKey) !== "closed");

    const close = () => {
        window.localStorage.setItem(alertKey, "closed");
        setShow(false);
    };
    return (
        show && (
            <BehandlingAlert size="small" {...alertProps} closeButton={alertProps.closeButton} onClose={close}>
                {children || "Content"}
            </BehandlingAlert>
        )
    );
};
