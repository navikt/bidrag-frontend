import { logger } from "@navikt/pino-logger";
import { teamLogger } from "@navikt/pino-logger/team-log";
import type { Logger } from "pino";

const combinedLogger: Logger = {
    level: logger.level,
    // Implement all the logger methods to call both loggers
    fatal: (obj: any, ...args: any[]) => {
        logger.fatal(obj, ...args);
        teamLogger.fatal(obj, ...args);
    },
    error: (obj: any, ...args: any[]) => {
        logger.error(obj, ...args);
        teamLogger.error(obj, ...args);
    },
    warn: (obj: any, ...args: any[]) => {
        logger.warn(obj, ...args);
        teamLogger.warn(obj, ...args);
    },
    info: (obj: any, ...args: any[]) => {
        logger.info(obj, ...args);
        teamLogger.info(obj, ...args);
    },
    debug: (obj: any, ...args: any[]) => {
        logger.debug(obj, ...args);
        teamLogger.debug(obj, ...args);
    },
    trace: (obj: any, ...args: any[]) => {
        logger.trace(obj, ...args);
        teamLogger.debug(obj, ...args);
    },
    //@ts-expect-error
    child: (bindings: pino.Bindings) => {
        const childLogger = logger.child(bindings);
        const teamChildLogger = teamLogger.child(bindings);

        // Return a combined child logger
        return {
            level: childLogger.level,
            fatal: (obj: any, ...args: any[]) => {
                childLogger.fatal(obj, ...args);
                teamChildLogger.fatal(obj, ...args);
            },
            error: (obj: any, ...args: any[]) => {
                childLogger.error(obj, ...args);
                teamChildLogger.error(obj, ...args);
            },
            warn: (obj: any, ...args: any[]) => {
                childLogger.warn(obj, ...args);
                teamChildLogger.warn(obj, ...args);
            },
            info: (obj: any, ...args: any[]) => {
                childLogger.info(obj, ...args);
                teamChildLogger.info(obj, ...args);
            },
            debug: (obj: any, ...args: any[]) => {
                childLogger.debug(obj, ...args);
                teamChildLogger.debug(obj, ...args);
            },
            trace: (obj: any, ...args: any[]) => {
                childLogger.trace(obj, ...args);
                teamChildLogger.trace(obj, ...args);
            },
        };
    },
};

export const navLogger = combinedLogger;
export const secureNavLogger = teamLogger;
