import "./CopyToClipboard.less";

import copy from "copy-to-clipboard";
import React, { useState } from "react";
import { Popover } from "react-tiny-popover";

import File from "../icons/File";
interface CopyToClipboardProps {
    value: string;
}
export default function CopyToClipboard({ value }: CopyToClipboardProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

    function copyCode(copyValue: string) {
        copy(copyValue, {
            format: "text/plain",
        });
    }

    function onCopyButtonClick(e: React.MouseEvent) {
        e.preventDefault();
        copyCode(value);
        setIsPopoverOpen(true);
        setTimeout(() => setIsPopoverOpen(false), 2000);
    }

    return (
        <Popover
            containerClassName={"copy-to-clipboard popover popover--controlled popover--hoyre popover--uten-pil"}
            isOpen={isPopoverOpen}
            padding={30}
            positions={["right"]} // preferred positions by priority
            content={
                <div className={"popover__content-inner"}>
                    <p className="typo-normal" style={{ padding: "0.5rem" }}>
                        {" "}
                        Kopiert!{" "}
                    </p>
                </div>
            }
            onClickOutside={() => setIsPopoverOpen(false)}
        >
            <div onClick={onCopyButtonClick} className={"copy-button"}>
                <File />
            </div>
        </Popover>
    );
}
