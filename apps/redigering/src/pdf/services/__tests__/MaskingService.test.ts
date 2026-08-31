import { PDFDocument, RotationTypes } from "@cantoo/pdf-lib";
import { describe, expect, it } from "vitest";

import { getCoordinatesAfterRotation, getFontsize, maskPages } from "../MaskingService";

describe("getFontsize", () => {
    it.each([
        [20, 20, 2],
        [40, 10, 4],
        [70, 10, 7],
        [120, 10, 8],
        [180, 10, 12],
        [250, 10, 14],
        [400, 10, 16],
    ])("returns the expected font size for %d x %d", (width, height, expected) => {
        expect(getFontsize(width, height)).toBe(expected);
    });
});

describe("getCoordinatesAfterRotation", () => {
    it("maps coordinates unchanged in orientation for an unrotated page", async () => {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]);
        const itemCoordinates = { x: 10, y: 20, width: 100, height: 50 };

        const result = getCoordinatesAfterRotation(page, itemCoordinates);

        expect(result.width).toBe(100);
        expect(result.height).toBe(50);
    });

    it("swaps width/height for a page rotated 90 degrees", async () => {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]);
        page.setRotation({ type: RotationTypes.Degrees, angle: 90 });
        const itemCoordinates = { x: 10, y: 20, width: 100, height: 50 };

        const result = getCoordinatesAfterRotation(page, itemCoordinates);

        expect(result.width).toBe(50);
        expect(result.height).toBe(100);
    });

    it("falls back to A4 dimensions when the page's inheritable attributes are unreadable", async () => {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]);
        // Simulate a corrupted parent chain by making getWidth/getHeight throw.
        page.getWidth = () => {
            throw new Error("Parent.ascend is not a function");
        };
        page.getHeight = () => {
            throw new Error("Parent.ascend is not a function");
        };

        const result = getCoordinatesAfterRotation(page, { x: 0, y: 0, width: 10, height: 10 });

        // Should not throw, and should still return usable draw coordinates.
        expect(typeof result.x).toBe("number");
        expect(typeof result.y).toBe("number");
    });
});

describe("maskPages", () => {
    it("draws a rectangle and label on each masked page without throwing", async () => {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([595, 842]);
        pdfDoc.addPage([595, 842]);
        const font = await pdfDoc.embedFont("Helvetica");

        expect(() =>
            maskPages((pageNumber) => pdfDoc.getPage(pageNumber - 1), font, [
                { pageNumber: 1, coordinates: { x: 10, y: 10, width: 50, height: 20 } } as never,
                { pageNumber: 2, coordinates: { x: 5, y: 5, width: 30, height: 60 } } as never,
            ]),
        ).not.toThrow();
    });
});
