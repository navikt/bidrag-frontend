import { AbstractLoggerService } from "./AbstractLoggerService.ts";
import type { LogInfo } from "./log.types.ts";

export class LoggerService extends AbstractLoggerService {
    static override async log(logInfo: LogInfo, headers?: Record<string, string>): Promise<void> {
        await fetch("/log", {
            mode: "cors",
            cache: "no-cache",
            body: JSON.stringify(logInfo),
            method: "POST",
            headers: {
                ...headers,
                "Content-type": "application/json; charset=UTF-8",
            },
        });
    }
}
