import { type PDFFont, type PDFPage, type PDFPageDrawRectangleOptions, RotationTypes, rgb } from "@cantoo/pdf-lib";

import type { ICoordinates, IMaskingItemProps } from "../../components/masking/MaskingItem";

/**
 * Stateless masking geometry and drawing helpers. These take the page/font/coordinates they
 * need as parameters rather than reading them from instance state, so they can be tested and
 * reused independently of PdfProducer's document-lifecycle state.
 */

export function getFontsize(width: number, height: number): number {
    const longestSide = Math.max(height, width);
    if (longestSide < 30) {
        return 2;
    } else if (longestSide < 50) {
        return 4;
    } else if (longestSide < 80) {
        return 7;
    } else if (longestSide < 150) {
        return 8;
    } else if (longestSide < 200) {
        return 12;
    } else if (longestSide < 300) {
        return 14;
    }
    return 16;
}

/**
 * Converts masking-item coordinates (defined against the page's unrotated layout) into the
 * draw coordinates/size needed once the page's current /Rotate value is taken into account.
 * Falls back to A4 dimensions and 0 rotation if the page's inheritable attributes cannot be
 * read (corrupted parent chain).
 */
export function getCoordinatesAfterRotation(page: PDFPage, itemCoordinates: ICoordinates) {
    let pageRotation = 0;
    try {
        pageRotation = page.getRotation().angle;
    } catch {
        /* corrupted parent chain */
    }
    let pageWidth = 595;
    let pageHeight = 842;
    try {
        pageWidth = page.getWidth();
        pageHeight = page.getHeight();
    } catch {
        /* corrupted parent chain — fall back to A4 */
    }

    // These coords are now from bottom/left
    const coordsFromBottomLeft = {
        x: itemCoordinates.x,
        y: itemCoordinates.y,
    };

    let drawX: number;
    let drawY: number;
    let height = itemCoordinates.height;
    let width = itemCoordinates.width;
    if (pageRotation === 90) {
        // Reference point is on the top left corner.
        // Down is positive. Adjust item coordinates to be top left
        drawY = coordsFromBottomLeft.x;
        drawX = coordsFromBottomLeft.y + pageWidth;
        height = itemCoordinates.width;
        width = itemCoordinates.height;
    } else if (pageRotation === 180) {
        // Reference point is on the top right corner.
        coordsFromBottomLeft.y = -itemCoordinates.height - itemCoordinates.y;
        drawX = -coordsFromBottomLeft.x + pageWidth - itemCoordinates.width;
        drawY = -coordsFromBottomLeft.y + pageHeight - itemCoordinates.height;
    } else if (pageRotation === 270) {
        // Reference point is on the bottom right corner.
        drawX = -coordsFromBottomLeft.y - itemCoordinates.height;
        drawY = pageHeight - coordsFromBottomLeft.x - itemCoordinates.width;
        height = itemCoordinates.width;
        width = itemCoordinates.height;
    } else {
        // Reference point is on the bottom left corner.
        coordsFromBottomLeft.y = -itemCoordinates.height - itemCoordinates.y;
        drawX = coordsFromBottomLeft.x;
        drawY = coordsFromBottomLeft.y;
    }
    return {
        x: drawX,
        y: drawY,
        width,
        height,
    };
}

export function calculateTextCoordinates(
    page: PDFPage,
    font: PDFFont,
    coordinates: PDFPageDrawRectangleOptions,
    itemCoordinates: ICoordinates,
    text: string,
) {
    const shouldRotateText = itemCoordinates.height > itemCoordinates.width;
    const fontSize = getFontsize(coordinates.width, coordinates.height);
    let rotation = 0;
    try {
        rotation = page.getRotation().angle;
    } catch {
        /* corrupted parent chain */
    }
    const textRotation = rotation == 180 ? 180 : rotation == 90 ? 90 : rotation == 270 ? -90 : 0;
    const textLenght = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);
    let x = coordinates.x + coordinates.width / 2;
    let y = coordinates.y + coordinates.height / 2;
    if (rotation == 90) {
        x -= shouldRotateText ? -textLenght / 2 : textHeight / 2;
        y -= shouldRotateText ? -textHeight / 2 : textLenght / 2;
    } else if (rotation == 270) {
        x -= shouldRotateText ? textLenght / 2 : textHeight / 2;
        y -= shouldRotateText ? textHeight / 2 : -textLenght / 2;
    } else if (rotation == 180) {
        x -= shouldRotateText ? textHeight / 2 : -textLenght / 2;
        y -= shouldRotateText ? -textLenght / 2 : -textHeight / 2;
    } else {
        x -= shouldRotateText ? -textHeight / 2 : textLenght / 2;
        y -= shouldRotateText ? textLenght / 2 : textHeight / 2;
    }
    return {
        x,
        y,
        angle: textRotation + (shouldRotateText ? 90 : 0),
    };
}

/**
 * Draws masking rectangles and "Skjermet" labels on the given pages for each masking item.
 * Mutates the pages in place (pdf-lib has no immutable drawing API); does not read or write
 * any state beyond what is passed in.
 */
export function maskPages(getPage: (pageNumber: number) => PDFPage, font: PDFFont, items: IMaskingItemProps[]): void {
    items
        .sort((a, b) => (a.pageNumber > b.pageNumber ? 1 : -1))
        .forEach((item) => {
            const page = getPage(item.pageNumber);
            const itemCoordinates = item.coordinates;
            const shortestSide = Math.min(itemCoordinates.height, itemCoordinates.width);
            const coordinatesAdjusted = getCoordinatesAfterRotation(page, itemCoordinates);
            const coordinates: PDFPageDrawRectangleOptions = {
                ...coordinatesAdjusted,
                color: rgb(1, 1, 1),
                borderColor: rgb(0, 0, 0),
                borderWidth: shortestSide < 200 ? 0.5 : 1,
                opacity: 1,
            };
            page.drawRectangle(coordinates);
            const text = "Skjermet";
            const fontSize = getFontsize(coordinates.width, coordinates.height);
            const textCoordinates = calculateTextCoordinates(page, font, coordinates, itemCoordinates, text);
            page.drawText(text, {
                x: textCoordinates.x,
                y: textCoordinates.y,
                size: fontSize,
                opacity: 0.5,
                rotate: {
                    type: RotationTypes.Degrees,
                    angle: textCoordinates.angle,
                },
                color: rgb(0.1, 0.1, 0.1),
            });
        });
}
