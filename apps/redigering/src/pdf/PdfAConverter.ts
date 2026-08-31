import { LoggerService } from "@bidrag/common";
import { PDFDict, PDFDocument, PDFHexString, PDFName, type PDFObject, PDFString } from "@cantoo/pdf-lib";

import { BIDRAG_FORSENDELSE_API } from "../api/api";
import type { PdfDocumentType } from "../components/utils/types";
// Vite (i motsetning til webpack) krever eksplisitt `?url` for at binærfiler
// skal håndteres som assets. Filen er liten nok til at Vite inliner den som
// en base64 data-URI, tilsvarende webpacks tidligere `asset/inline`-regel.
import colorProfileUrl from "./files/sRGB2014.icc?url";
import { PDF_EDITOR_CREATOR, PDF_EDITOR_PRODUCER, PdfProducerHelpers } from "./PdfHelpers";

function dataUriToUint8Array(dataUri: string): Uint8Array {
    const base64 = dataUri.slice(dataUri.indexOf(",") + 1);
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export class PdfAConverter {
    private origDoc: PDFDocument;
    private title: string;
    private pdfDoc: PDFDocument;
    async convertAndSave(origDoc: PDFDocument, title: string, copyPDF = false): Promise<Uint8Array> {
        this.origDoc = origDoc;
        this.title = title;
        this.pdfDoc = await this.copyPdfDocument(this.origDoc, copyPDF);
        const documentDate = new Date();
        const documentId = crypto.randomUUID().replaceAll("-", "");
        //await flattenForm(this.pdfDoc, () => this.loadPDF(true));
        this.addMetadata(origDoc, this.pdfDoc, documentDate, documentId, this.title);
        this.removeXFA(this.pdfDoc);
        this.addDocumentId(this.pdfDoc, documentId);
        // await this.addFont(pdfDoc);
        // this.addColorProfile(pdfDoc);
        this.deleteJavascript(this.pdfDoc);
        // useObjectStreams:false is required for PDF/A-1 conformance: PDF/A-1 (set via the
        // GTS_PDFA1 OutputIntent below) forbids cross-reference/object streams, so the classic
        // xref writer must be used here even though it produces larger files.
        const savedBytes = await this.pdfDoc.save({
            useObjectStreams: false,
        });
        // Sanity check that the serialized bytes actually round-trip through pdf-lib itself
        // (page count matches what we expect) before handing them off. This is cheap insurance
        // against silently returning a malformed PDF.
        try {
            const reloaded = await PDFDocument.load(savedBytes);
            if (reloaded.getPageCount() !== this.pdfDoc.getPageCount()) {
                LoggerService.warn(
                    `PdfAConverter.convertAndSave verify-reload page count mismatch expected=${this.pdfDoc.getPageCount()} actual=${reloaded.getPageCount()}`,
                );
            }
        } catch (e) {
            LoggerService.error("PdfAConverter.convertAndSave verify-reload failed", e);
        }
        return savedBytes;
    }
    private copyPdfDocument(originalDoc: PDFDocument, copyPDF = false): Promise<PDFDocument> {
        if (copyPDF) {
            console.debug("Copying PDF file");
            return originalDoc.copy();
        }
        return Promise.resolve(originalDoc);
    }
    addColorProfile(doc: PDFDocument) {
        const profile = dataUriToUint8Array(colorProfileUrl);
        const profileStream = doc.context.stream(profile, {
            Length: profile.length,
        });
        const profileStreamRef = doc.context.register(profileStream);

        const outputIntent = doc.context.obj({
            Type: "OutputIntent",
            S: "GTS_PDFA1",
            Info: "sRGB IEC61966-2.1",
            RegistryName: "http://www.color.org",
            OutputCondition: PDFString.of("sRGB IEC61966-2.1"),
            OutputConditionIdentifier: PDFString.of("sRGB IEC61966-2.1"),
            DestOutputProfile: profileStreamRef,
        });
        const outputIntentRef = doc.context.register(outputIntent);
        doc.catalog.set(PDFName.of("OutputIntents"), doc.context.obj([outputIntentRef]));
    }
    private addDocumentId(pdfDoc: PDFDocument, documentId: string) {
        const id = PDFHexString.of(documentId);
        pdfDoc.context.trailerInfo.ID = pdfDoc.context.obj([id, id]);
    }
    private async removeXFA(pdfDoc: PDFDocument) {
        try {
            const form = pdfDoc.getForm();

            form.deleteXFA();
        } catch (e) {
            LoggerService.error("Feil ved sletting av XFA", e);
        }
    }

    private deleteJavascript(pdfDoc: PDFDocument) {
        pdfDoc.context.enumerateIndirectObjects().forEach(([ref, obj]) => {
            if (this.isPdfObjectJavascript(obj)) {
                pdfDoc.context.delete(ref);
            }
        });
    }

    private addMetadata(originalDoc: PDFDocument, pdfDoc: PDFDocument, date: Date, _documentId: string, title: string) {
        const originalAuthor = PdfProducerHelpers.getAuthor(originalDoc);
        const originalCreationDate = PdfProducerHelpers.getCreationDate(originalDoc);
        const producer = PDF_EDITOR_PRODUCER;
        const creator = originalDoc.getCreator() ?? PDF_EDITOR_CREATOR;
        const author = originalAuthor ?? PDF_EDITOR_CREATOR;
        try {
            pdfDoc.setTitle(title, { showInWindowTitleBar: true });
            pdfDoc.setAuthor(author);
            pdfDoc.setProducer(producer);
            pdfDoc.setCreator(creator);
            pdfDoc.setCreationDate(originalCreationDate ?? date);
            pdfDoc.setModificationDate(date);
        } catch (e) {
            LoggerService.error("Feil ved setting av metadata", e);
        }

        // const metadataXML = `
        // <?xpacket begin="" id="${documentId}"?>
        //     <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.2-c001 63.139439, 2010/09/27-13:37:26">
        //     <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

        //         <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
        //         <dc:format>application/pdf</dc:format>
        //         <dc:creator>
        //             <rdf:Seq>
        //             <rdf:li>${author}</rdf:li>
        //             </rdf:Seq>
        //         </dc:creator>
        //         <dc:title>
        //             <rdf:Alt>
        //             <rdf:li xml:lang="x-default">${title}</rdf:li>
        //             </rdf:Alt>
        //         </dc:title>
        //         </rdf:Description>

        //         <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
        //         <xmp:CreatorTool>${creator}</xmp:CreatorTool>
        //         <xmp:CreateDate>${this._formatDate(originalCreationDate ?? date)}</xmp:CreateDate>
        //         <xmp:ModifyDate>${this._formatDate(date)}</xmp:ModifyDate>
        //         <xmp:MetadataDate>${this._formatDate(date)}</xmp:MetadataDate>
        //         </rdf:Description>

        //         <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
        //         <pdf:Producer>${producer}</pdf:Producer>
        //         </rdf:Description>
        //     </rdf:RDF>
        //     </x:xmpmeta>
        // <?xpacket end="w"?>
        // `.trim();
        // const metadataStream = pdfDoc.context.stream(metadataXML, {
        //     Type: "Metadata",
        //     Subtype: "XML",
        //     Length: metadataXML.length,
        // });

        // const metadataStreamRef = pdfDoc.context.register(metadataStream);

        // pdfDoc.catalog.set(PDFName.of("Metadata"), metadataStreamRef);
    }

    private isPdfObjectJavascript(obj: PDFObject) {
        if (obj instanceof PDFDict) {
            return obj.has(PDFName.of("JS"));
        }
        return false;
    }
}
export const reparerPDF = async (documentFile: PdfDocumentType): Promise<Blob> => {
    try {
        LoggerService.info("Reparerer korrupt PDF");
        const response = await BIDRAG_FORSENDELSE_API.api.reparerPdf(
            new File([documentFile as unknown as BlobPart], "", {
                type: "application/pdf",
            }),
            {
                headers: {
                    "Content-Type": "application/pdf",
                },
                format: "blob",
                paramsSerializer: {
                    indexes: null,
                },
            },
        );
        return response.data;
    } catch (e) {
        console.error("Det skjedde en feil ved reparering av korrupt PDF", e);
    }
};
export const validatePDFBytes = async (documentFile: Uint8Array): Promise<void> => {
    try {
        console.log("Validerer PDF/A kompatibilitet");
        const pdfAResult = await BIDRAG_FORSENDELSE_API.api.validerPdf(
            new File([documentFile as unknown as BlobPart], "", {
                type: "application/pdf",
            }),
            { headers: { "Content-Type": "application/pdf" } },
        );
        console.log("Validering resultat", pdfAResult.data);
    } catch (e) {
        console.error("Det skjedde en feil ved validering", e);
    }
};

export const convertTOPDFA = async (documentFile: Uint8Array): Promise<Blob> => {
    try {
        console.log("Konverterer til PDF/A");
        const pdfAResult = await BIDRAG_FORSENDELSE_API.api.convertToPdfa2(
            new File([documentFile as unknown as BlobPart], "", {
                type: "application/pdf",
            }),
            { headers: { "Content-Type": "application/pdf" } },
        );
        return pdfAResult.data;
    } catch (e) {
        console.error("Det skjedde en feil ved validering", e);
    }
};
