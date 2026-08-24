import "quill/dist/quill.snow.css";
import "quill/dist/quill.core.css";
import "./CustomQuillEditor.css";
import "quill-paste-smart";

import { ErrorMessage } from "@navikt/ds-react";
import Quill from "quill";
import { useEffect, useRef, useState } from "react";

const Clipboard = Quill.import("modules/clipboard");

//@ts-expect-error
class CustomClipboard extends Clipboard {
    onCaptureCopy(e: ClipboardEvent, isCut = false) {
        //@ts-expect-error
        const range = this.quill.getSelection();
        if (range == null) return;

        //@ts-expect-error
        const text = this.quill.getText(range);
        //@ts-expect-error
        const html = this.quill.getSemanticHTML(range);
        const styledHtml = this.tilpassFormatteringForLegacyBidragMaler(html);

        e.clipboardData.setData("text/plain", text);
        e.clipboardData.setData("text/html", styledHtml);

        if (isCut) {
            //@ts-expect-error
            this.quill.deleteText(range, Quill.sources.USER);
        }

        e.preventDefault();
    }

    onCaptureCut(e: ClipboardEvent) {
        this.onCaptureCopy(e, true);
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
                // el.style.fontSize = "11pt";
                // el.style.whiteSpace = "normal";
            }
        });

        return container.outerHTML;
    }
}

Quill.register("modules/clipboard", CustomClipboard, true);
export type EditorProps = {
    readOnly: boolean;
    defaultValue: string;
    prefilledHtml?: string;
    onTextChange: (html: string) => void;
    resize?: boolean;
    error?: React.ReactNode;
    ref;
};
const normalizeEditorHtml = (html = "") => html.replaceAll("<p></p>", "<p><br/></p>");
const isEmptyEditorHtml = (html = "") => {
    const normalized = normalizeEditorHtml(html).trim();
    return normalized === "" || normalized === "<p><br/></p>";
};

export const CustomQuillEditor = ({
    readOnly,
    defaultValue,
    prefilledHtml,
    onTextChange,
    ref,
    resize,
    error,
}: EditorProps) => {
    const containerRef = useRef(null);
    const [quill, setQuill] = useState(null);
    const hasResolvedInitialPrefillRef = useRef(false);

    useEffect(() => {
        const textChangeHandler = () => {
            if (quill.getLength() <= 1) {
                onTextChange("");
                return;
            }

            onTextChange(normalizeEditorHtml(quill.getSemanticHTML()));
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
                history: {},

                toolbar: readOnly
                    ? false
                    : {
                          container: [
                              ["bold", "italic", "underline", { header: 3 }],
                              // [{ 'color': "red" }, { 'background': "yellow" }]
                          ],
                      },
                clipboard: {
                    allowed: {
                        tags: ["strong", "h3", "h4", "em", "p", "br", "span", "u"],
                        // attributes: ['href', 'rel', 'target', 'class', "style"]
                        attributes: [],
                    },
                    customButtons: [],
                    keepSelection: false,
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
        if (!quill) {
            return;
        }

        const normalizedPrefilledHtml = normalizeEditorHtml(prefilledHtml ?? "");
        const normalizedDefaultValue = normalizeEditorHtml(defaultValue ?? "");
        const shouldPrefill =
            !hasResolvedInitialPrefillRef.current &&
            normalizedPrefilledHtml.length > 0 &&
            isEmptyEditorHtml(normalizedDefaultValue);
        const nextHtml = shouldPrefill ? normalizedPrefilledHtml : normalizedDefaultValue;

        if (!isEmptyEditorHtml(normalizedDefaultValue)) {
            hasResolvedInitialPrefillRef.current = true;
        }

        if (shouldPrefill) {
            hasResolvedInitialPrefillRef.current = true;
        }

        const currentHTML = normalizeEditorHtml(quill.getSemanticHTML());

        if (nextHtml !== currentHTML) {
            const updatedDelta = quill.clipboard.convert({ html: nextHtml });
            quill.setContents(updatedDelta, "silent");
        }
    }, [quill, defaultValue, prefilledHtml]);

    useEffect(() => {
        if (quill) {
            quill.enable(!readOnly);
        }
    }, [readOnly, quill]);

    return (
        <div>
            <div
                className={`ql-top-container ${readOnly ? "readonly" : ""} ${resize ? "resizable" : ""} ${error ? "error" : ""}`}
                ref={containerRef}
            ></div>
            {!readOnly && error && (
                <ErrorMessage size="small" showIcon className="mt-2">
                    {error}
                </ErrorMessage>
            )}
        </div>
    );
};
