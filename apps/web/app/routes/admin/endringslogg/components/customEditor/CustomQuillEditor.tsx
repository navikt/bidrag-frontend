import "quill/dist/quill.snow.css";
import "quill/dist/quill.core.css";
import "./CustomQuillEditor.css";
import "quill-paste-smart";

import { ErrorMessage } from "@navikt/ds-react";
import Quill from "quill";
import QuillResize from "quill-resize-module";
import { useEffect, useRef, useState } from "react";
const Clipboard = Quill.import("modules/clipboard");

//@ts-ignore
class CustomClipboard extends Clipboard {
    onCaptureCopy(e: ClipboardEvent) {
        //@ts-ignore
        const range = this.quill.getSelection();
        if (range == null) return;

        //@ts-ignore
        const text = this.quill.getText(range);
        //@ts-ignore
        const html = this.quill.getSemanticHTML(range);
        const styledHtml = this.tilpassFormatteringForLegacyBidragMaler(html);

        e.clipboardData.setData("text/plain", text);
        e.clipboardData.setData("text/html", styledHtml);
        // console.log(text);
        // console.log(styledHtml);
        e.preventDefault();
    }
    tilpassFormatteringForLegacyBidragMaler(html: string): string {
        // Create a container and fill it with the copied HTML.
        const container = document.createElement("div");
        container.innerHTML = html.replaceAll("&nbsp;", " ");

        // Apply general styles for font family and line height.
        container.style.fontFamily = "'Times New Roman', serif";
        container.style.lineHeight = "1";
        container.style.fontSize = "11pt";
        // For p, strong, and i elements, apply a font size of 11pt (Word font size is measured in pt and not px).
        const elements = container.querySelectorAll("*");
        elements.forEach((el) => {
            if (el.tagName === "H3") {
                const strong = document.createElement("strong");
                strong.innerHTML = el.innerHTML;
                // strong.style.fontSize = "11pt";
                // strong.style.fontFamily = "'Times New Roman', serif";
                el.replaceWith(strong);
            } else if (!["H1", "H2", "H4", "H5", "H6"].includes(el.tagName)) {
                //@ts-ignore
                // el.style.fontSize = "11pt";
                // el.style.whiteSpace = "normal";
            }
        });

        return container.outerHTML;
    }
}

// Quill.register("modules/clipboard", CustomClipboard, true);
Quill.register("modules/resize", QuillResize);

type EditorProps = {
    readOnly: boolean;
    defaultValue: string;
    onTextChange: (html: string) => void;
    resize?: boolean;
    error?: string;
    ref;
};
export const CustomQuillEditor = ({ readOnly, defaultValue, onTextChange, ref, resize, error }: EditorProps) => {
    const containerRef = useRef(null);
    const [quill, setQuill] = useState(null);

    useEffect(() => {
        const textChangeHandler = () => {
            if (quill.getLength() <= 1) {
                onTextChange("");
            } else {
                onTextChange(quill.getSemanticHTML().replaceAll("<p></p>", "<p><br/></p>"));
            }
        };

        if (quill) {
            quill.on(Quill.events.TEXT_CHANGE, textChangeHandler);
        }

        return () => {
            quill?.off(Quill.events.TEXT_CHANGE, textChangeHandler);
        };
    }, [quill, onTextChange]);

    useEffect(() => {
        const container = containerRef.current;
        const editorContainer = container.appendChild(container.ownerDocument.createElement("div"));
        const quillEditor = new Quill(editorContainer, {
            theme: "snow",
            readOnly,
            modules: {
                resize: {},
                history: {},

                toolbar: {
                    container: [
                        [{ color: [] }, { background: [] }],
                        ["bold", "italic", "underline", "image", "link", { header: 3 }],
                        // [{ 'color': "red" }, { 'background': "yellow" }]
                    ],
                },
                clipboard: {
                    customButtons: [],
                    keepSelection: true,
                    substituteBlockElements: true,
                    magicPasteLinks: false,
                    removeConsecutiveSubstitutionTags: false,
                },
            },
        });
        setQuill(quillEditor);
        ref.current = quillEditor;

        return () => {
            ref.current = null;
            container.innerHTML = "";
        };
    }, [ref]);

    useEffect(() => {
        if (quill) {
            const currentHTML = quill.getSemanticHTML().replaceAll("<p></p>", "<p><br/></p>");

            if (defaultValue !== currentHTML) {
                const updatedDelta = quill.clipboard.convert({ html: defaultValue });
                quill.setContents(updatedDelta, "silent");
            }
        }
    }, [quill, defaultValue]);

    useEffect(() => {
        if (quill) {
            quill.enable(!readOnly);
        }
    }, [readOnly, quill]);

    return (
        <div>
            <div
                className={`ql-top-container ${readOnly ? "readonly" : ""} ${resize ? "resizable" : ""} ${
                    error ? "error" : ""
                }`}
                ref={containerRef}
            ></div>
            {error && (
                <ErrorMessage size="small" showIcon className="mt-2">
                    {error}
                </ErrorMessage>
            )}
        </div>
    );
};
