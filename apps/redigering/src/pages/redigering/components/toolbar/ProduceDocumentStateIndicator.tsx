import { BodyLong, BodyShort } from "@navikt/ds-react";

import { usePdfEditorContext } from "../PdfEditorContext";

export default function ProduceDocumentStateIndicator() {
    const { produceAndSaveProgress } = usePdfEditorContext();

    if (produceAndSaveProgress.state === "IDLE" || produceAndSaveProgress.state === "ERROR") {
        return null;
    }
    function renderText() {
        if (produceAndSaveProgress.state === "PRODUCING") {
            return "Klargjør dokumentet. Vennligst vent (ikke lukk vinduet/fanen).";
        } else if (produceAndSaveProgress.state === "SAVING_DOCUMENT") {
            return "Lagrer dokumentet. Vennligst vent (ikke lukk vinduet/fanen).";
        } else if (produceAndSaveProgress.state === "CLOSING_WINDOW") {
            return "Lukker vinduet/fanen...";
        }
    }

    const progress = Math.min(100, produceAndSaveProgress.progress ?? 0);
    return (
        <BodyLong className="w-full p-2">
            <BodyShort>{renderText()}</BodyShort>
            <div className="w-full bg-ax-neutral-300 rounded-full h-1.5 mb-4 dark:bg-ax-neutral-500 mt-2">
                <div
                    className="bg-[brand-blue] h-1.5 rounded-full dark:bg-[brand-blue]"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </BodyLong>
    );
}
