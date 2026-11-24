import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PdfPage from "./PdfPage";

const { getPage } = vi.hoisted(() => ({ getPage: vi.fn() }));

vi.mock("./PdfDocumentContext", () => ({
    usePdfDocumentContext: () => ({
        pdfDocument: { getPage },
        renderPageIndexes: [0],
        scale: 1,
    }),
}));

describe("PdfPage rotation", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
        container = document.createElement("div");
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it.each([
        [0, undefined, 0],
        [90, undefined, 90],
        [180, undefined, 180],
        [270, undefined, 270],
        [90, 90, 180],
        [270, 90, 0],
        [0, -90, 270],
        [90, 450, 180],
    ])("uses source rotation %s plus user delta %s for both layout and canvas", async (sourceRotation, userRotation, expectedRotation) => {
        const getViewport = vi.fn(({ scale, rotation }: { scale: number; rotation: number }) => ({
            rotation,
            width: (rotation % 180 === 0 ? 900 : 500) * scale,
            height: (rotation % 180 === 0 ? 500 : 900) * scale,
        }));
        const render = vi.fn(() => ({ promise: Promise.resolve() }));
        getPage.mockResolvedValue({ rotate: sourceRotation, getViewport, render });

        await act(async () => {
            root.render(createElement(PdfPage, { pageNumber: 1, index: 0, rotation: userRotation }));
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        const expectedWidth = expectedRotation % 180 === 0 ? 900 : 500;
        const expectedHeight = expectedRotation % 180 === 0 ? 500 : 900;
        const page = container.querySelector<HTMLElement>(".pagecontainer");
        expect(page?.style.getPropertyValue("--page-width")).toBe(`${expectedWidth}px`);
        expect(page?.style.getPropertyValue("--page-height")).toBe(`${expectedHeight}px`);
        const canvas = container.querySelector("canvas");
        expect(canvas?.width).toBe(expectedWidth);
        expect(canvas?.height).toBe(expectedHeight);
        expect(render).toHaveBeenCalledWith(
            expect.objectContaining({
                viewport: expect.objectContaining({ rotation: expectedRotation }),
            }),
        );
    });
});
