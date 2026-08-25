import type { UseFormReturn } from "react-hook-form";

interface DevToolWrapperProps {
    form: UseFormReturn<unknown>;
}

function JsonSyntaxHighlight({ data }: { data: unknown }) {
    const jsonString = JSON.stringify(data, null, 2);

    const syntaxHighlight = (json: string) => {
        json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
            (match) => {
                let cls = "number";
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = "key";
                    } else {
                        cls = "string";
                    }
                } else if (/true|false/.test(match)) {
                    cls = "boolean";
                } else if (/null/.test(match)) {
                    cls = "null";
                }
                return `<span class="${cls}">${match}</span>`;
            },
        );
    };

    return (
        <pre
            style={{
                overflow: "auto",
                maxHeight: "calc(100vh - 80px)",
                backgroundColor: "#1e1e1e",
                padding: "10px",
                borderRadius: "4px",
            }}
            dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonString) }}
        />
    );
}

export default function DevToolWrapper({ form }: DevToolWrapperProps) {
    if (!import.meta.env.DEV) return null;
    try {
        return (
            <>
                <style>
                    {`
                        .key { color: #9cdcfe; }
                        .string { color: #ce9178; }
                        .number { color: #b5cea8; }
                        .boolean { color: #569cd6; }
                        .null { color: #569cd6; }
                    `}
                </style>
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        right: 0,
                        height: "50vh",
                        width: "400px",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRight: "none",
                        backgroundColor: "#252526",
                        overflowY: "auto",
                        zIndex: 9999,
                        boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <details style={{ marginBottom: "10px", color: "#fff" }} open>
                        <summary style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "10px" }}>
                            Form Debug Info
                        </summary>
                        <div style={{ fontSize: "12px", fontFamily: "monospace" }}>
                            <JsonSyntaxHighlight data={form.getValues()} />
                        </div>
                    </details>
                </div>
            </>
        );
    } catch (error) {
        console.error("DevTool Error:", error);
        return <div style={{ color: "red", padding: "10px" }}>DevTool failed to load</div>;
    }
}
