import { BodyLong, BodyShort, Label } from "@navikt/ds-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { reformatText } from "../components/CustomEditor";
import { CustomQuillEditor } from "../components/CustomQuillEditor";

type BegrunnelseProps = { behandlingId?: string; broadcastChannel?: string };

export default (props: BegrunnelseProps) => {
    const quillRef = useRef(null);
    const [searchParams] = useSearchParams();
    const label = searchParams.get("label");
    const description = searchParams.get("description");
    const prefilledHtml = searchParams.get("prefilledHtml") ?? undefined;
    const [value, setValue] = useState(searchParams.get("value"));
    const channel = useMemo(() => new BroadcastChannel(decodeURIComponent(props.broadcastChannel)), []);

    useEffect(() => {
        const unloadHandler = () => {
            channel.postMessage({ action: "componentUnmounted" });
            channel.close();
        };
        window.addEventListener("beforeunload", unloadHandler);

        channel.onmessage = (event) => {
            switch (event.data.action) {
                case "textChange":
                    setValue(event.data.value);
                    break;
                case "componentUnmounted":
                    window.close();
                    break;
            }
        };

        return () => window.removeEventListener("beforeunload", unloadHandler);
    }, []);

    function onTextChange(text: string) {
        setValue(reformatText(text));
        channel.postMessage({ action: "textChange", value: text });
    }

    return (
        <div className="max-w-[1092px] m-auto px-6 py-6">
            <div>
                <BodyLong size="small" as="div">
                    {label && (
                        <Label className="flex items-center gap-2" spacing size="small">
                            {label}
                        </Label>
                    )}

                    {description && (
                        <BodyShort spacing textColor="subtle" size="small" className="max-w-[500px] mt-[-0.375rem]">
                            {description}
                        </BodyShort>
                    )}
                    <CustomQuillEditor
                        ref={quillRef}
                        defaultValue={value}
                        prefilledHtml={prefilledHtml}
                        onTextChange={onTextChange}
                        readOnly={false}
                        resize
                    />
                </BodyLong>
            </div>
        </div>
    );
};
