import type { FileData } from "../types";
import { Base64ByteConverter } from "./Base64ByteConverter";

export class FileUtils {
    static dataToFileUrl(data: FileData, type: string): string {
        let byteData = data;
        if (typeof data === "string") {
            byteData = FileUtils._base64ToArrayBuffer(data);
        }
        const fileBlob = new Blob([byteData as BlobPart], { type: type });
        return URL.createObjectURL(fileBlob);
    }

    static openFile(data: FileData, openInNewWindow = true): void {
        const fileURL = FileUtils.dataToFileUrl(data, "application/pdf");
        FileUtils.openFileUrl(fileURL, openInNewWindow);
    }

    static async openFileUrl(fileURL?: string, openInNewWindow = false): Promise<void> {
        if (!fileURL) {
            return;
        }
        const result = window.open(fileURL, openInNewWindow ? "_blank" : "_self");
        if (result === null) {
            alert("Kunne ikke åpne fil. Vennligst gi tillatelse til å åpne popup vindu");
        }
    }

    static _arrayBufferToBase64(data: Uint8Array) {
        return Base64ByteConverter.fromByteArray(data);
    }

    static _base64ToArrayBuffer(data: string): Uint8Array {
        return Base64ByteConverter.toByteArray(data);
    }
}
