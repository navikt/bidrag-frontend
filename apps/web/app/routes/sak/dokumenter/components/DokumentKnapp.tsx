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
    const kanÅpnes = dokument.kanÅpnes;

    const tittelFargeClass = isSelected ? "text-gray-900" : kanÅpnes ? "text-[var(--a-text-action)]" : "text-gray-500";

    const backgroundClass = isSelected ? "bg-[var(--a-surface-action-subtle,#cce1ff)]" : "bg-transparent";
    const borderClass = isSelected
        ? "border-l-4 border-[var(--a-border-action,#0056b4)]"
        : "border-l-4 border-transparent";

    return (
        <button
            type="button"
            onClick={() => kanÅpnes && onClick()}
            aria-current={isSelected ? "true" : "false"}
            className={`relative w-full py-1.5 pr-3 pl-7 text-left transition-colors rounded-r block ${backgroundClass} ${borderClass} ${
                kanÅpnes ? "cursor-pointer" : "cursor-not-allowed"
            }`}
        >
            {isVisited && (
                <EyeIcon
                    title="Sett"
                    aria-label="Sett"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm shrink-0"
                />
            )}

            <HStack gap="space-1" align="center" wrap={false} className="w-full min-w-0">
                <Detail className="text-gray-500 shrink-0 font-normal">↳</Detail>
                <Detail
                    weight={isSelected ? "semibold" : "regular"}
                    className={`truncate flex-1 min-w-0 ${tittelFargeClass} ${
                        kanÅpnes && !isSelected ? "underline" : ""
                    }`}
                >
                    {dokument.tittel}
                </Detail>
            </HStack>
        </button>
    );
}
