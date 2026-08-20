import { CheckmarkCircleIcon, XMarkOctagonIcon } from "@navikt/aksel-icons";
import { BodyShort, Loader } from "@navikt/ds-react";
import type { MutationStatus } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

interface Props {
    mutationStatus: MutationStatus;
}

type FadeSlotProps = {
    visible: boolean;
    children: React.ReactNode;
};

const StatusWrapper = ({ visible, children }: FadeSlotProps) => {
    return (
        <div
            className={`col-start-1 row-start-1 flex items-center transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            {children}
        </div>
    );
};

export function SaveStatusIndicator({ mutationStatus }: Props) {
    const [showSuccess, setShowSuccess] = useState(false);
    const prevStatusRef = useRef(mutationStatus);

    useEffect(() => {
        const transitionedToSuccess = prevStatusRef.current === "pending" && mutationStatus === "success";

        if (transitionedToSuccess) {
            setShowSuccess(true);

            const timeout = setTimeout(() => {
                setShowSuccess(false);
            }, 1000);

            return () => clearTimeout(timeout);
        }

        prevStatusRef.current = mutationStatus;
    }, [mutationStatus]);

    return (
        <div className="grid grid-cols-1 grid-rows-1 items-center min-h-[1.25rem]" aria-live="polite">
            <StatusWrapper visible={mutationStatus === "pending"}>
                <Loader size="small" />
            </StatusWrapper>

            <StatusWrapper visible={mutationStatus === "error"}>
                <div className="inline-flex items-center gap-[3px]">
                    <XMarkOctagonIcon style={{ color: "var(--ax-text-danger-decoration)" }} />{" "}
                    <BodyShort size="small" style={{ color: "var(--ax-text-danger-subtle)" }}>
                        Lagring feilet
                    </BodyShort>
                </div>
            </StatusWrapper>

            <StatusWrapper visible={showSuccess}>
                <CheckmarkCircleIcon title="Lagret" style={{ color: "var(--ax-text-success-decoration)" }} />
            </StatusWrapper>
        </div>
    );
}
