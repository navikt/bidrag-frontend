import "./PopoverToolbar.css";

import {
    ArrowRedoIcon,
    ArrowsCirclepathIcon,
    ArrowUndoIcon,
    EraserIcon,
    ExpandIcon,
    FileXMarkIcon,
    MinusIcon,
    PlusIcon,
    ShrinkIcon,
} from "@navikt/aksel-icons";
import { Button } from "@navikt/ds-react";
import type React from "react";

import { useMaskingContainer } from "../../../../components/masking/MaskingContainer";
import { usePdfViewerContext } from "../../../../components/pdfviewer/PdfViewerContext";
import { usePdfEditorContext } from "../PdfEditorContext";

export default function PopoverToolbar() {
    const { scale, zoom, pagesCount, currentPage } = usePdfViewerContext();
    const { resetZoom, onZoomOut, onZoomIn, zoomToFit } = zoom;
    const { removedPages, mode, dokumentMetadata, toggleDeletedPage, isAllowedToDeletePage, rotatePage } =
        usePdfEditorContext();
    const { initAddItem } = useMaskingContainer();

    function removedPagesBefore(pageNumber: number) {
        return removedPages.filter((p) => p < pageNumber);
    }

    const currentPageNotIncludingRemoved = currentPage - removedPagesBefore(currentPage).length;
    const isEditMode = mode === "edit";

    const isEditable = dokumentMetadata?.state === "EDITABLE" || mode === "remove_pages_only";
    const editedPagesCount = pagesCount - removedPages.length;

    function stopSidebarClose(e: React.SyntheticEvent) {
        e.stopPropagation();
    }

    return (
        <div
            className={"popover-toolbar"}
            onClick={stopSidebarClose}
            onMouseDown={stopSidebarClose}
            onPointerDown={stopSidebarClose}
        >
            <div className={"buttons_row"}>
                <div className={"zoom_buttons flex flex-row gap-2 text-[var(--ax-text-neutral)]"}>
                    {scale > 1 ? (
                        <Button
                            onClick={resetZoom}
                            size={"small"}
                            variant={"tertiary-neutral"}
                            icon={<ShrinkIcon />}
                            title="Tilpass til siden"
                        />
                    ) : (
                        <Button
                            onClick={zoomToFit}
                            size={"small"}
                            variant={"tertiary-neutral"}
                            icon={<ExpandIcon />}
                            title="Tilpass til bredde"
                        />
                    )}
                    <Button
                        onClick={() => onZoomOut()}
                        size={"small"}
                        variant={"tertiary-neutral"}
                        icon={<MinusIcon />}
                        title="Zoom ut"
                    />
                    <div>{Math.round(scale * 100)}%</div>
                    <Button
                        onClick={() => onZoomIn()}
                        size={"small"}
                        variant={"tertiary-neutral"}
                        icon={<PlusIcon />}
                        title="Zoom inn"
                    />
                </div>
                <div className={"divider"}></div>
                <div
                    style={{ marginLeft: "6px", marginRight: "6px" }}
                    className="flex flex-row gap-2 text-[var(--ax-text-neutral)]"
                >
                    <div>{currentPageNotIncludingRemoved}</div> <div>av</div> <div>{editedPagesCount}</div>
                </div>
                <div className={"divider"}></div>
                {isEditable && (
                    <div className={"editor_buttons"}>
                        {isEditMode && (
                            <Button
                                onClick={initAddItem}
                                size={"small"}
                                variant={"tertiary-neutral"}
                                icon={<EraserIcon />}
                                iconPosition={"left"}
                                title="Ny maskering"
                            >
                                Masker
                            </Button>
                        )}

                        <Button
                            onClick={() => rotatePage(currentPage, "LEFT")}
                            size={"small"}
                            variant={"tertiary-neutral"}
                            icon={<ArrowsCirclepathIcon />}
                            title="Roter side mot venstre"
                            aria-label="Roter side mot venstre"
                        >
                            Roter venstre
                        </Button>

                        <Button
                            onClick={() => rotatePage(currentPage, "RIGHT")}
                            size={"small"}
                            variant={"tertiary-neutral"}
                            icon={<ArrowsCirclepathIcon />}
                            title="Roter side mot høyre"
                            aria-label="Roter side mot høyre"
                        >
                            Roter høyre
                        </Button>
                        <Button
                            onClick={() => {
                                toggleDeletedPage(currentPage);
                            }}
                            disabled={!isAllowedToDeletePage()}
                            size={"small"}
                            variant={"tertiary-neutral"}
                            icon={<FileXMarkIcon />}
                            iconPosition={"left"}
                            title={isAllowedToDeletePage() ? "Fjern side" : "Kan ikke fjerne alle sider"}
                        >
                            Fjern side
                        </Button>
                        {isEditMode && <UndoRedoButtons />}
                    </div>
                )}
            </div>
        </div>
    );
}

function UndoRedoButtons() {
    const { onRedo, onUndo, history } = usePdfEditorContext();

    return (
        <div className={"undo_redo_buttons"}>
            <Button
                onClick={onUndo}
                size={"small"}
                title="Angre"
                disabled={!history.canUndo}
                variant={"tertiary-neutral"}
                icon={<ArrowUndoIcon />}
                iconPosition={"left"}
            ></Button>
            <Button
                onClick={onRedo}
                disabled={!history.canRedo}
                size={"small"}
                title="Gjør om"
                variant={"tertiary-neutral"}
                icon={<ArrowRedoIcon />}
                iconPosition={"left"}
            ></Button>
        </div>
    );
}
