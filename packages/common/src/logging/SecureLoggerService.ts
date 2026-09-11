import { AbstractLoggerService } from "./AbstractLoggerService.ts";
import type { LogInfo } from "./log.types.ts";

export class SecureLoggerService extends AbstractLoggerService {
    // Sikker logg skal aldri havne i telemetri (Faro), uansett om window.faro finnes.
    protected static override readonly rapporterTilTelemetri = false;

    static override async log(logInfo: LogInfo, headers?: Record<string, string>): Promise<void> {
        await fetch("/log/secure", {
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
