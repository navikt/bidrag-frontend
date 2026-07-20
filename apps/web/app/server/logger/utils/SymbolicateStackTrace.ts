import { RawSourceMap, SourceMapConsumer } from "source-map";

const STACK_FRAME_REGEX = /^(\s*at\s+(?:.*?\()?)(.+):(\d+):(\d+)(\)?)$/;
const SOURCE_MAP_URL_REGEX = /^[\s\S]*[#@]\s*sourceMappingURL=(\S+)\s*$/m;
const FETCH_TIMEOUT_MS = 3000;
const MAX_CACHE_SIZE = 200;

const sourceMapConsumerCache = new Map<string, Promise<SourceMapConsumer | null>>();

interface ISymbolicationResult {
    symbolicatedStackTrace: string;
    didSymbolicate: boolean;
    debug: ISymbolicationDebug;
}

interface ISymbolicationDebug {
    totalLines: number;
    frameLines: number;
    symbolicatedFrames: number;
    failures: Record<SymbolicationFailureReason, number>;
}

type SymbolicationFailureReason =
    | "frame_not_matched"
    | "unsupported_frame_url"
    | "source_map_unavailable"
    | "original_position_not_found";

interface IStackFrame {
    prefix: string;
    scriptUrl: string;
    line: number;
    column: number;
    suffix: string;
    rawLine: string;
}

interface IParseStackFrameResult {
    frame: IStackFrame | null;
    failureReason?: SymbolicationFailureReason;
}

function hasAllowedHost(url: URL): boolean {
    const allowedHosts = process.env.STACKTRACE_SOURCE_MAP_ALLOWED_HOSTS;

    // Keep local development working even with host restrictions.
    if (process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1"].includes(url.hostname)) {
        return true;
    }

    if (!allowedHosts || !allowedHosts.trim()) {
        return true;
    }

    const host = url.hostname.toLowerCase();
    return allowedHosts
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
        .some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
}

function withTimeout(): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    return controller.signal;
}

async function fetchText(url: string): Promise<string | null> {
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        return null;
    }

    if (!hasAllowedHost(parsedUrl)) {
        return null;
    }

    try {
        const response = await fetch(url, { signal: withTimeout() });
        if (!response.ok) {
            return null;
        }
        return await response.text();
    } catch {
        return null;
    }
}

function getSourceMapReference(scriptContent: string): string | null {
    const match = scriptContent.match(SOURCE_MAP_URL_REGEX);
    const sourceMapReference = match?.[1];
    if (!sourceMapReference) {
        return null;
    }

    return sourceMapReference;
}

function decodeInlineSourceMap(sourceMapReference: string): RawSourceMap | null {
    if (!sourceMapReference.startsWith("data:")) {
        return null;
    }

    const separatorIndex = sourceMapReference.indexOf(",");
    if (separatorIndex < 0) {
        return null;
    }

    const metadata = sourceMapReference.substring(0, separatorIndex);
    const payload = sourceMapReference.substring(separatorIndex + 1);

    try {
        const json = metadata.includes(";base64")
            ? Buffer.from(payload, "base64").toString("utf-8")
            : decodeURIComponent(payload);
        return JSON.parse(json) as RawSourceMap;
    } catch {
        return null;
    }
}

function resolveSourceMapUrl(scriptUrl: string, sourceMapReference: string): string | null {
    if (!sourceMapReference) {
        return null;
    }

    if (sourceMapReference.startsWith("data:")) {
        return null;
    }

    try {
        return new URL(sourceMapReference, scriptUrl).href;
    } catch {
        return null;
    }
}

function isSymbolicFrameUrl(scriptUrl: string): boolean {
    return (
        scriptUrl.startsWith("http://") ||
        scriptUrl.startsWith("https://") ||
        scriptUrl.startsWith("webpack-internal:///") ||
        scriptUrl.startsWith("webpack:///")
    );
}

function createEmptyFailureCounters(): Record<SymbolicationFailureReason, number> {
    return {
        frame_not_matched: 0,
        unsupported_frame_url: 0,
        source_map_unavailable: 0,
        original_position_not_found: 0,
    };
}

function registerFailure(
    failures: Record<SymbolicationFailureReason, number>,
    failureReason?: SymbolicationFailureReason
): void {
    if (!failureReason) {
        return;
    }
    failures[failureReason] += 1;
}

function parseStackFrame(stackLine: string): IParseStackFrameResult {
    const match = stackLine.match(STACK_FRAME_REGEX);
    if (!match) {
        return {
            frame: null,
            failureReason: "frame_not_matched",
        };
    }

    const [, prefix = "", scriptUrl = "", line, column, suffix = ""] = match;
    if (!isSymbolicFrameUrl(scriptUrl)) {
        return {
            frame: null,
            failureReason: "unsupported_frame_url",
        };
    }

    return {
        frame: {
            prefix,
            scriptUrl,
            line: Number(line),
            column: Number(column),
            suffix,
            rawLine: stackLine,
        },
    };
}

async function createSourceMapConsumer(scriptUrl: string): Promise<SourceMapConsumer | null> {
    if (!scriptUrl.startsWith("http://") && !scriptUrl.startsWith("https://")) {
        return null;
    }

    const scriptContent = await fetchText(scriptUrl);
    if (!scriptContent) {
        return null;
    }

    const sourceMapReference = getSourceMapReference(scriptContent);
    if (!sourceMapReference) {
        return null;
    }

    const inlineSourceMap = decodeInlineSourceMap(sourceMapReference);
    if (inlineSourceMap) {
        try {
            return await new SourceMapConsumer(inlineSourceMap);
        } catch {
            return null;
        }
    }

    const sourceMapUrl = resolveSourceMapUrl(scriptUrl, sourceMapReference);
    if (!sourceMapUrl) {
        return null;
    }

    const sourceMapText = await fetchText(sourceMapUrl);
    if (!sourceMapText) {
        return null;
    }

    try {
        const sourceMap = JSON.parse(sourceMapText) as RawSourceMap;
        return await new SourceMapConsumer(sourceMap);
    } catch {
        return null;
    }
}

function getSourceMapConsumer(scriptUrl: string): Promise<SourceMapConsumer | null> {
    const cachedConsumer = sourceMapConsumerCache.get(scriptUrl);
    if (cachedConsumer) {
        return cachedConsumer;
    }

    const consumerPromise = createSourceMapConsumer(scriptUrl);
    sourceMapConsumerCache.set(scriptUrl, consumerPromise);

    if (sourceMapConsumerCache.size > MAX_CACHE_SIZE) {
        const oldestKey = sourceMapConsumerCache.keys().next().value;
        if (oldestKey) {
            void sourceMapConsumerCache.get(oldestKey)?.then((consumer) => consumer?.destroy());
            sourceMapConsumerCache.delete(oldestKey);
        }
    }

    return consumerPromise;
}

function cleanSourcePath(source: string): string {
    // webpack source maps encode paths as webpack://appname/path/to/file — strip the scheme+name prefix
    return source.replace(/^webpack:\/\/[^/]*\//, "");
}

function mapToOriginalFrame(frame: IStackFrame, consumer: SourceMapConsumer): string {
    const originalPosition = consumer.originalPositionFor({
        line: frame.line,
        column: Math.max(frame.column - 1, 0),
        bias: SourceMapConsumer.GREATEST_LOWER_BOUND,
    });

    if (!originalPosition.source || !originalPosition.line || originalPosition.column == null) {
        return frame.rawLine;
    }

    const source = cleanSourcePath(originalPosition.source);
    const line = originalPosition.line;
    const column = originalPosition.column + 1;

    return `${frame.prefix}${source}:${line}:${column}${frame.suffix}`;
}

function deduplicateStackLines(stackTrace: string): string {
    const seen = new Set<string>();
    return stackTrace
        .split("\n")
        .filter((line) => {
            const trimmed = line.trim();
            if (!trimmed) return true;
            if (seen.has(trimmed)) return false;
            seen.add(trimmed);
            return true;
        })
        .join("\n");
}

export async function symbolicateStackTrace(stackTrace?: string): Promise<ISymbolicationResult> {
    const emptyDebug: ISymbolicationDebug = {
        totalLines: 0,
        frameLines: 0,
        symbolicatedFrames: 0,
        failures: createEmptyFailureCounters(),
    };

    if (!stackTrace?.trim()) {
        return {
            symbolicatedStackTrace: stackTrace ?? "",
            didSymbolicate: false,
            debug: emptyDebug,
        };
    }

    const stackLines = deduplicateStackLines(stackTrace).split("\n");
    let didSymbolicate = false;
    const failures = createEmptyFailureCounters();
    let frameLines = 0;
    let symbolicatedFrames = 0;

    const mappedLines = await Promise.all(
        stackLines.map(async (line) => {
            const { frame, failureReason } = parseStackFrame(line.trimEnd());
            if (!frame) {
                registerFailure(failures, failureReason);
                return line;
            }
            frameLines += 1;

            const consumer = await getSourceMapConsumer(frame.scriptUrl);
            if (!consumer) {
                registerFailure(failures, "source_map_unavailable");
                return line;
            }

            const mappedFrame = mapToOriginalFrame(frame, consumer);
            if (mappedFrame !== frame.rawLine) {
                didSymbolicate = true;
                symbolicatedFrames += 1;
            } else {
                registerFailure(failures, "original_position_not_found");
            }
            return mappedFrame;
        })
    );

    return {
        symbolicatedStackTrace: mappedLines.join("\n"),
        didSymbolicate,
        debug: {
            totalLines: stackLines.length,
            frameLines,
            symbolicatedFrames,
            failures,
        },
    };
}
