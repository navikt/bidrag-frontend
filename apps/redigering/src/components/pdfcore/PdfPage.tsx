import type { RenderTask } from "pdfjs-dist";
import type { PDFPageProxy } from "pdfjs-dist/types/web/pdf_viewer";
import React, {
    type CSSProperties,
    type MutableRefObject,
    type PropsWithChildren,
    useEffect,
    useRef,
    useState,
} from "react";

import { type PdfDocumentContextProps, usePdfDocumentContext } from "./PdfDocumentContext";
export type PageRenderedFn = (containerElement: HTMLDivElement) => void;

interface PdfPageProps {
    pageRendered?: PageRenderedFn;
    pageDestroyed?: () => void;
    pageNumber: number;
    index: number;
    onPageClicked?: (pageNumber: number) => void;
    style?: CSSProperties;
    pageRef?: MutableRefObject<HTMLDivElement>;
    rotation?: number;
}

const PdfPage = (props: PropsWithChildren<PdfPageProps>) => {
    const contextProps = usePdfDocumentContext();

    return <PdfPageMemo {...props} {...contextProps} />;
};

type PdfPageMemoProps = PdfPageProps & PdfDocumentContextProps;
const PdfPageMemo = React.memo(
    ({
        pdfDocument,
        renderPageIndexes,
        scale,
        children,
        pageNumber,
        style,
        index,
        rotation,
    }: PropsWithChildren<PdfPageMemoProps>) => {
        const [renderedPageNumber, setRenderedPageNumber] = useState(pageNumber);
        const [pageObject, setPageObject] = useState<PDFPageProxy>();
        const divRef = useRef<HTMLDivElement>(null);
        const isDrawed = useRef<boolean>(false);
        const isPageRenderStarted = useRef<boolean>(false);
        const pageRotation = rotation ?? 0;

        useEffect(() => {
            if (hasPageNumberChanged()) {
                divRef.current?.querySelector(".page")?.remove();
            }
            if (pdfDocument && !isPageRenderStarted.current) {
                isPageRenderStarted.current = true;
                renderPage().catch(console.error);
            }

            setRenderedPageNumber(pageNumber);
        }, [pdfDocument, pageNumber]);

        function hasPageNumberChanged() {
            return renderedPageNumber !== pageNumber && isDrawed.current;
        }

        function shouldRenderPage(renderPageIndexes: number[]) {
            return renderPageIndexes.includes(index);
        }

        function renderPage() {
            isDrawed.current = false;
            return pdfDocument.getPage(pageNumber).then((page) => {
                setPageObject(page);
            });
        }

        function getStyle() {
            if (pageObject == null) return {};
            const viewport = pageObject.getViewport({ scale: 1, rotation: pageRotation });
            const width = viewport.width;
            const height = viewport.height;
            return {
                "--page-width": `${width}px`,
                "--page-height": `${height}px`,
                width: "var(--page-width)",
                height: "var(--page-height)",
            };
        }

        return (
            <div
                data-index={index}
                style={{
                    ...style,
                    ...getStyle(),
                }}
                className={"pagecontainer page"}
                ref={divRef}
                data-page-number={pageNumber}
            >
                {shouldRenderPage(renderPageIndexes) && (
                    <PDFCanvas pdfPage={pageObject} scale={scale} pageNumber={pageNumber} rotation={pageRotation} />
                )}
                {children}
            </div>
        );
    },
    (prevProps, nextProps) =>
        !shouldRerenderPage(prevProps.renderPageIndexes, nextProps.renderPageIndexes, nextProps.index) &&
        prevProps.pdfDocument === nextProps.pdfDocument &&
        prevProps.scale === nextProps.scale &&
        prevProps.rotation === nextProps.rotation &&
        prevProps.children === nextProps.children &&
        nextProps.renderPageIndexes.includes(nextProps.index),
);

interface PDFCanvasProps {
    pdfPage: PDFPageProxy;
    pageNumber: number;
    scale: number;
    rotation: number;
}
function PDFCanvas({ pdfPage, scale, pageNumber, rotation, children }: PropsWithChildren<PDFCanvasProps>) {
    const pageRenderTask = useRef<RenderTask>(undefined);
    const pageRenderNextScale = useRef<number>(undefined);
    const timeoutId = useRef<NodeJS.Timeout>(undefined);
    const canvasRef = useRef<HTMLDivElement>(undefined);

    useEffect(() => {
        pageRenderNextScale.current = scale;
        if (timeoutId.current !== null) {
            clearTimeout(timeoutId.current);
        }
        timeoutId.current = setTimeout(() => {
            drawPage(pageRenderNextScale.current);
            if (timeoutId.current !== null) {
                clearTimeout(timeoutId.current);
                timeoutId.current = null;
            }
        }, 200);
    }, [scale]);

    useEffect(() => {
        drawPage(scale);
    }, [pdfPage, rotation]);

    function fitCanvasToPage(scale: number) {
        const canvasElement = canvasRef.current.querySelector("canvas");
        canvasElement.style.transformOrigin = "0px 0px";
        canvasElement.style.transform = `scale(${1 / scale})`;
    }
    function drawPage(scale: number) {
        if (pdfPage == null || !scale || !canvasRef.current) return;
        if (pageRenderTask.current != null) {
            pageRenderNextScale.current = scale;
            return;
        }
        const viewport = pdfPage.getViewport({ scale: scale, rotation: rotation });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        pageRenderTask.current = pdfPage.render(renderContext);
        return pageRenderTask.current.promise
            .then(() => {
                if (!canvasRef.current) return;
                canvasRef.current.querySelector("canvas").replaceWith(canvas);
                fitCanvasToPage(scale);
            })
            .catch((e) => {
                console.debug("RENDERING CANCELLED", pageNumber, e);
            })
            .finally(() => {
                pageRenderTask.current = null;
                if (pageRenderNextScale.current !== null && pageRenderNextScale.current !== scale) {
                    drawPage(pageRenderNextScale.current);
                    pageRenderNextScale.current = null;
                }
            });
    }
    return (
        <div className="canvasWrapper" ref={canvasRef}>
            <canvas className="canvas" />
            {children}
        </div>
    );
}

function shouldRerenderPage(prevRenderPageIndexes: number[], renderPageIndexes: number[], index: number) {
    const changedFromNotVisibleToVisible = !prevRenderPageIndexes.includes(index) && renderPageIndexes.includes(index);
    const changedFromVisibleToNotVisible = prevRenderPageIndexes.includes(index) && !renderPageIndexes.includes(index);
    return changedFromNotVisibleToVisible || changedFromVisibleToNotVisible;
}

export default PdfPage;
