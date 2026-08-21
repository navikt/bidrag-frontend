import { ExpandIcon, PadlockLockedFillIcon } from "@navikt/aksel-icons";
import { BodyLong, BodyShort, Button, Label } from "@navikt/ds-react";
import type { MutationStatus } from "@tanstack/react-query";
import { useFlag } from "@unleash/proxy-client-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBehandlingProvider } from "../context/BehandlingContext";
import { CustomQuillEditor } from "./CustomQuillEditor";
import { SaveStatusIndicator } from "./SaveStatusIndicator";

export const reformatText = (text?: string) => {
    return text?.replace(new RegExp(String.fromCharCode(10), "g"), "<br>");
};

export type CustomEditorProps = {
    name;
    value?: string;
    prefilledHtml?: string;
    label?: string;
    description?: string;
    className?: string;
    resize?: boolean;
    readOnly?: boolean;
    onChange?: (html: string) => void;
    withOpenInNewWindow?: boolean;
    error?: string;
    mutationState?: MutationStatus;
};
export function CustomTextareaEditor({
    name,
    value,
    prefilledHtml,
    label,
    description,
    className,
    resize,
    readOnly,
    onChange,
    withOpenInNewWindow,
    error,
    mutationState,
}: CustomEditorProps) {
    const begrunnelsePrefillMal = useFlag("behandling.preutfylt_begrunnelse_mal");
    const { lesemodus } = useBehandlingProvider();
    const [openInNewWindow, setOpenInNewWindow] = useState<boolean>(false);
    const quillRef = useRef(null);
    const broadcastChannelUUID = useMemo(() => crypto.randomUUID(), []);
    const channel = useMemo(() => new BroadcastChannel(broadcastChannelUUID), [broadcastChannelUUID]);
    const reformattedValue = useMemo(() => reformatText(value), [value]);
    const disabled = lesemodus || readOnly;

    useEffect(() => {
        channel.onmessage = (event) => {
            switch (event.data.action) {
                case "textChange":
                    onChange?.(event.data.value);
                    break;
                case "componentUnmounted":
                    setOpenInNewWindow(false);
                    break;
            }
        };

        return () => channel.postMessage({ action: "componentUnmounted" });
    }, []);

    const onTextChange = useCallback(
        (text: string) => {
            onChange?.(text);
            if (openInNewWindow) {
                channel.postMessage({ action: "textChange", value: reformatText(text) });
            }
        },
        [openInNewWindow],
    );

    const onOpenInNewWindow = useCallback(() => {
        if (openInNewWindow) return;

        setOpenInNewWindow(true);
        const encodedPrefilledHtml = prefilledHtml ? `&prefilledHtml=${encodeURIComponent(prefilledHtml)}` : "";
        window.open(
            `${window.location.pathname}begrunnelse/${broadcastChannelUUID}?value=${encodeURIComponent(reformattedValue)}&label=${label}${description ? `&description=${description}` : ""}${encodedPrefilledHtml}`,
            "_blank",
            "width=800,height=700,left=200,top=200",
        );
    }, [openInNewWindow, prefilledHtml]);

    return (
        <BodyLong size="small" as="div" className={className}>
            {label && (
                <Label className="flex items-center gap-2" spacing size="small" htmlFor={name}>
                    {disabled && <PadlockLockedFillIcon />} {label}{" "}
                    {!withOpenInNewWindow && (
                        <Button
                            size="xsmall"
                            variant="tertiary-neutral"
                            icon={<ExpandIcon title="Ny fane" />}
                            onClick={onOpenInNewWindow}
                            type="button"
                        />
                    )}
                    {mutationState && <SaveStatusIndicator mutationStatus={mutationState} />}
                </Label>
            )}

            {description && (
                <BodyShort spacing textColor="subtle" size="small" className="max-w-[500px] mt-[-0.375rem]">
                    {description}
                </BodyShort>
            )}
            <CustomQuillEditor
                ref={quillRef}
                resize={resize}
                readOnly={disabled}
                defaultValue={reformattedValue}
                prefilledHtml={begrunnelsePrefillMal ? prefilledHtml : undefined}
                onTextChange={onTextChange}
                error={error}
            />
        </BodyLong>
    );
}
