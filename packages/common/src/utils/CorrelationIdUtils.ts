import { Base64ByteConverter } from "./Base64ByteConverter";

export const correlationIdHeader = "X-Correlation-ID";

export function generateCorrelationId(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(12));

    return Base64ByteConverter.fromByteArray(randomBytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
