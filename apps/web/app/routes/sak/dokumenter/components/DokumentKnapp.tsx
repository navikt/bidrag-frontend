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

    const tittelFargeClass = isSelected
        ? "text-gray-900"
        : kanAapnes
          ? "text-[var(--a-text-action)]"
          : "text-gray-500";

    const backgroundClass = isSelected ? "bg-[var(--a-surface-action-subtle,#cce1ff)]" : "bg-transparent";
    const borderClass = isSelected ? "border-l-4 border-[var(--a-border-action,#0056b4)]" : "border-l-4 border-transparent";

    return (
        <button
            type="button"
            onClick={() => kanAapnes && onClick()}
            aria-current={isSelected ? "true" : "false"}
            className={`w-full py-1.5 px-2 text-left transition-colors rounded-r block ${backgroundClass} ${borderClass} ${
                kanAapnes ? "cursor-pointer" : "cursor-not-allowed"
            }`}
        >
            <HStack align="center" gap="space-4" wrap={false} className="w-full min-w-0">
                <Detail
                    weight={isSelected ? "semibold" : "regular"}
                    className={`truncate flex-1 min-w-0 ${tittelFargeClass} ${
                        kanAapnes && !isSelected ? "underline" : ""
                    }`}
                >
                    ↳ {dokument.tittel}
                </Detail>
                {isVisited && (
                    <EyeIcon
                        title="Sett"
                        aria-label="Sett"
                        className="text-gray-500 shrink-0 text-xs"
                    />
                )}
            </HStack>
        </button>
    );
}