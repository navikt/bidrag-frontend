import "./InfoKnapp.css";

import { QuestionmarkIcon } from "@navikt/aksel-icons";
import { Button, Modal } from "@navikt/ds-react";
import type React from "react";
import { type PropsWithChildren, useRef } from "react";

type InfoKnappProps = {
    buttonClassName?: string;
    className?: string;
    title?: string;
    buttonText?: string;
    roundedIcon?: boolean;
};
export default function InfoKnapp({
    children,
    className,
    buttonClassName,
    buttonText,
    title,
}: PropsWithChildren<InfoKnappProps>) {
    const ref = useRef<HTMLDialogElement>(null);

    const closeModal = () => {
        ref.current?.close();
        // cleanupAfterClosedModal();
    };
    const openModal = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        ref.current?.showModal();
    };
    const onlyIcon = buttonText === undefined;
    return (
        <>
            <Button
                title={title}
                variant="tertiary"
                className={`${buttonClassName} ${onlyIcon ? "p-0" : ""} infoknapp`}
                size="xsmall"
                icon={<QuestionmarkIcon />}
                onClick={openModal}
            >
                {buttonText}
            </Button>

            <Modal
                ref={ref}
                aria-labelledby="modal-info"
                closeOnBackdropClick
                onClose={closeModal}
                className={`max-w-[900px] ${className} m-auto `}
            >
                <Modal.Header className="h-[10px]" closeButton></Modal.Header>
                <Modal.Body>
                    <div className="max-h-[800px] mdx-content">{children}</div>
                </Modal.Body>
            </Modal>
        </>
    );
}
