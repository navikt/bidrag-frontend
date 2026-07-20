import { randomBytes, webcrypto } from "node:crypto";
import type { ErrorCode } from "@bidrag/common";

const { subtle } = webcrypto;
const INSTANCE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INSTANCE_CODE_LENGTH = 5;

export default async function exceptionToErrorCode(
    stack_trace: string,
    _appName: string,
): Promise<ErrorCode> {
    const errorCode = await exceptionToExceptionCode(stack_trace);
    const exceptionCode = exceptionToInstanceCode(errorCode);

    return {
        errorCode,
        exceptionCode,
    };
}

async function exceptionToExceptionCode(message: string) {
    const hash = await sha256(message);
    return hash.substring(0, 3);
}

function exceptionToInstanceCode(errorCode: string) {
    const uniqueCode = createReadableUniqueCode();
    return `${errorCode}-${uniqueCode}`;
}

function createReadableUniqueCode(): string {
    const code = Array.from(randomBytes(INSTANCE_CODE_LENGTH))
        .map(
            (randomValue) =>
                INSTANCE_CODE_ALPHABET[
                    randomValue % INSTANCE_CODE_ALPHABET.length
                ],
        )
        .join("");

    return code;
}

async function sha256(message: string): Promise<string> {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await subtle.digest("SHA-256", msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    return hashArray.map((b) => `00${b.toString(16)}`.slice(-2)).join("");
}
