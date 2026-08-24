import { z } from "zod";

export interface BroadcastError {
    message: string;
    stack?: string;
}

export interface BroadcastMessage<T> {
    ok?: boolean; // deprecated
    status?: number; // deprecated
    id: string;
    error?: BroadcastError | T;
    payload: T | null;
}

export class Broadcast {
    static convertToBroadcastMessage<T>(id: string, payload: T): BroadcastMessage<T> {
        return {
            id,
            payload,
        };
    }

    static convertToBroadcastErrorMessage<T>(id: string, error: T | string): BroadcastMessage<T> {
        return {
            id,
            error: typeof error === "string" ? { message: error } : error,
            payload: null,
        };
    }

    static sendBroadcast<T>(name: string, data: BroadcastMessage<T>): void {
        const bc = new BroadcastChannel(name);
        bc.postMessage(JSON.stringify(data));
        bc.close();
    }

    static waitForBroadcast<T>(name: string, payloadSchema: z.ZodType<T>, id?: string): Promise<BroadcastMessage<T>> {
        return new Promise((resolve, reject) => {
            function onResult(obj: MessageEvent<string>): void {
                try {
                    const data = z
                        .object({
                            id: z.string(),
                            payload: payloadSchema.nullable(),
                        })
                        .passthrough()
                        .parse(JSON.parse(obj.data));

                    if (!id || data.id === id) {
                        resolve(data as BroadcastMessage<T>);
                        bc.close();
                    }
                } catch {
                    bc.close();
                    reject(new Error("Kunne ikke lese broadcast-resultatet."));
                }
            }

            const bc = new BroadcastChannel(name);
            bc.onmessage = onResult;
            bc.onmessageerror = (event: MessageEvent) => {
                bc.close();
                reject(event);
            };
        });
    }
}

export enum BroadcastNames {
    EDIT_DOCUMENT_RESULT = "EDIT_DOCUMENT_RESULT",
    EDIT_DOCUMENT_CONFIG = "EDIT_DOCUMENT_CONFIG",
    SAMHANDLERSOK_RESULT_EVENT = "SAMHANDLERSOK_RESULT_EVENT",
}
