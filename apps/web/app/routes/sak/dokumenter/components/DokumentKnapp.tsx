import { EyeIcon } from "@navikt/aksel-icons";
import { Detail, HStack } from "@navikt/ds-react";
import type { SaksDokument } from "../types";

interface DokumentKnappProps {
    dokument: SaksDokument;
    isSelected: boolean;
    isVisited: boolean;
    onClick: () => void;
}

export function DokumentKnapp({ dokument, isSelected, isVisited, onClick }: DokumentKnappProps) {
    const kanAapnes = dokument.kanAapnes;
    const fontColor = isSelected
        ? "var(--a-text-default, #101010)"
        : kanAapnes
          ? "var(--a-text-action, #0067c5)"
          : "var(--a-text-subtle, #707070)";

    const backgroundStyle = isSelected ? "var(--a-surface-action-subtle, #cce1ff)" : "transparent";
    const borderStyle = isSelected ? "4px solid var(--a-border-action, #0056b4)" : "4px solid transparent";
    const fontStyling = isSelected ? 800 : 400;
    const ariaState = isSelected ? "true" : "false";

    return (
        <button
            type="button"
            onClick={() => kanAapnes && onClick()}
            aria-current={ariaState}
            style={{
                width: "100%",
                padding: "0.375rem 0.5rem",
                textAlign: "left",
                minHeight: "unset",
                borderRadius: "0 0.25rem 0.25rem 0",
                border: "none",
                borderLeft: borderStyle,
                background: backgroundStyle,
                cursor: kanAapnes ? "pointer" : "not-allowed",
                display: "block",
                transition: "background-color 0.15s ease",
                boxSizing: "border-box",
            }}
        >
            <HStack align="center" gap="space-4" wrap={false} style={{ width: "100%", minWidth: 0 }}>
                <Detail
                    style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: fontStyling,
                        color: fontColor,
                        textDecoration: kanAapnes && !isSelected ? "underline" : "none",
                        minWidth: 0,
                    }}
                >
                    ↳ {dokument.tittel}
                </Detail>
                {isVisited && (
                    <EyeIcon
                        title="Sett"
                        aria-label="Sett"
                        style={{
                            color: "var(--a-text-subtle, #707070)",
                            flexShrink: 0,
                            fontSize: "0.875rem",
                        }}
                    />
                )}
            </HStack>
        </button>
    );
}
