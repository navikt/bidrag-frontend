import { EyeIcon } from "@navikt/aksel-icons";
import { Detail, HStack } from "@navikt/ds-react";
import type { SaksDokument } from "../types";

interface DokumentKnappProps {
    dokument: SaksDokument;
    isSelected: boolean;
    isVisited: boolean;
    onClick: () => void;
    /**
     * Når true skilles hoveddokument og vedlegg visuelt fra hverandre i stedet for at alle
     * dokumenter får en generisk «↳»-pil. Brukes i flat liste der journalposten ikke er en egen node.
     */
    visDokumentRolle?: boolean;
}

export function DokumentKnapp({
    dokument,
    isSelected,
    isVisited,
    onClick,
    visDokumentRolle = false,
}: DokumentKnappProps) {
    const kanÅpnes = dokument.kanÅpnes;
    const erHoveddokument = visDokumentRolle && dokument.erHoveddokument;

    // Hoveddokumentet har ofte nøyaktig samme tittel som journalposten det ligger under. Å gjenta
    // den teksten får listen til å se ut som den har ett dokument for mye, så raden merkes i stedet
    // med rollen sin. Selve tittelen er uansett synlig i journalpost-headeren rett over.
    const tittelDupliserer =
        erHoveddokument &&
        Boolean(dokument.journalpostTittel?.trim()) &&
        dokument.journalpostTittel?.trim() === dokument.tittel.trim();

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
            className={`relative w-full min-w-0 py-1.5 pr-3 pl-7 text-left transition-colors rounded-r block ${backgroundClass} ${borderClass} ${
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
                {!erHoveddokument && <Detail className="text-gray-500 shrink-0 font-normal">↳</Detail>}
                <Detail
                    weight={isSelected || erHoveddokument ? "semibold" : "regular"}
                    className={`truncate flex-1 min-w-0 ${
                        tittelDupliserer ? "text-gray-600" : tittelFargeClass
                    } ${kanÅpnes && !isSelected && !tittelDupliserer ? "hover:underline" : ""}`}
                    title={dokument.tittel}
                >
                    {dokument.tittel}
                </Detail>
            </HStack>
        </button>
    );
}
