import { CustomError, LoggerService } from "@bidrag/common";
import { BodyLong, BodyShort, Box, Button, CopyButton, Heading, HStack, Label, Link, List, VStack } from "@navikt/ds-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useBisysLink } from "~/common/bisys/useBisysLink.ts";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Iskrem } from "./Iskrem";
import styles from "./errorpage.module.css";

export interface ErrorPageProps {
    error: unknown;
}

export default function ErrorPage({ error }: ErrorPageProps) {
    const [logResponse, setLogResponse] = useState<{ exceptionCode: string; status: string }>();

    const errorMessage = error instanceof Error ? error.message : undefined;
    const stackTrace = error instanceof Error ? error.stack : undefined;
    const status = error instanceof CustomError ? error.status : 500;

    useEffect(() => {
        let cancelled = false;

        LoggerService.error(errorMessage ?? "Ukjent feil", {
            message: errorMessage ?? "Ukjent feil",
            stack_trace: stackTrace,
            errorType: error instanceof Error ? error.name : "UnknownError",
            status,
        }).then((response) => {
            if (!cancelled) {
                setLogResponse({ exceptionCode: response.exceptionCode, status: String(status) });
            }
        });

        return () => {
            cancelled = true;
        };
    }, [error]);

    if (!logResponse) {
        return null;
    }

    return (
        <Box
            background="raised"
            borderWidth="1"
            borderRadius="8"
            borderColor="neutral-subtle"
            maxWidth="48rem"
            marginInline="auto"
            marginBlock="space-48 space-24"
            paddingBlock="space-24"
            paddingInline="space-64"
            asChild
        >
            <VStack gap="space-32" justify="center">
                <HStack gap="space-16" align="end" justify="center">
                    <Iskrem />
                    <Heading spacing level="2" size="large">
                        {"Det var flaut :("}
                    </Heading>
                </HStack>
                <VStack gap="space-16" align="start" justify="center">
                    <ErrorInfo error={errorMessage} stackTrace={stackTrace} />
                    <ContactInformation exceptionCode={logResponse.exceptionCode} />
                    <ButtonRow />
                </VStack>
            </VStack>
        </Box>
    );
}

function ButtonRow() {
    const { bisysUrl, setBisysLinkTarget } = useBisysLink();
    const { saksnummer } = useParams();

    useEffect(() => {
        setBisysLinkTarget("oppgaveliste", { saksnr: saksnummer ?? "" });
    }, [saksnummer]);

    return (
        <HStack gap="space-4" align="center">
            {bisysUrl && (
                <Button as="a" href={bisysUrl} variant="primary" size="small">
                    Tilbake til oppgavelisten
                </Button>
            )}
            <Button onClick={() => window.location.reload()} variant="tertiary" size="small">
                Oppdater side
            </Button>
        </HStack>
    );
}

function ErrorInfo({ error, stackTrace }: { error?: string; stackTrace?: string }) {
    const parsedStackTrace = formatStackTrace(stackTrace);

    return (
        <>
            <BodyLong>
                <Heading size="medium" spacing>
                    En teknisk feil har oppstått
                </Heading>
                <Heading size="small" spacing>
                    Hva skjedde?
                </Heading>
                <Label size="small">Mulige årsaker:</Label>
                <List as="ul" size="small">
                    <List.Item>Dette skyldes en feil med serverne. Vi jobber med å fikse feilen.</List.Item>
                    <List.Item>Det skjedde en midlertidig feil. Prøv å laste siden på nytt.</List.Item>
                </List>
            </BodyLong>
            {error && (
                <BodyLong>
                    <Heading size="small" spacing>
                        Feilmelding:
                    </Heading>
                    <Box background="sunken" borderRadius="4" padding="space-4" as={BodyShort} size="small">
                        <code>{error}</code>
                    </Box>
                </BodyLong>
            )}
            {parsedStackTrace && (
                <BodyLong>
                    <details>
                        <summary>Vis feildetaljer</summary>
                        <Box
                            background="sunken"
                            borderRadius="4"
                            paddingInline="space-16"
                            paddingBlock="space-8"
                            as="div"
                            style={{ marginTop: "10px", marginBottom: "10px" }}
                        >
                            <StackTraceDetails
                                headline={parsedStackTrace.headline}
                                frames={parsedStackTrace.frames}
                                extraLines={parsedStackTrace.extraLines}
                            />
                        </Box>
                    </details>
                </BodyLong>
            )}
        </>
    );
}

function StackTraceDetails({ headline, frames, extraLines }: { headline?: string; frames: string[]; extraLines: string[] }) {
    return (
        <div className={styles["stacktrace-container"]}>
            {headline && <div className={styles["stacktrace-headline"]}>{headline}</div>}
            {frames.length > 0 && (
                <div className={styles["stacktrace-section"]}>
                    <div className={styles["stacktrace-section-title"]}>Stack frames</div>
                    <ol className={styles["stacktrace-frames"]}>
                        {frames.map((frame, index) => (
                            <li key={`${frame}-${index}`} className={styles["stacktrace-frame"]}>
                                {frame}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
            {extraLines.length > 0 && (
                <div className={styles["stacktrace-section"]}>
                    <div className={styles["stacktrace-section-title"]}>Tilleggsdetaljer</div>
                    <div className={styles["stacktrace-extra-lines"]}>{extraLines.join("\n")}</div>
                </div>
            )}
        </div>
    );
}

function formatStackTrace(stackTrace?: string):
    | {
          headline?: string;
          frames: string[];
          extraLines: string[];
      }
    | undefined {
    if (!stackTrace?.trim()) {
        return undefined;
    }

    const lines = stackTrace
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const headline = lines.find((line) => line.startsWith("Error") || line.toLowerCase().includes("network error"));
    const frames = lines.filter((line) => line.startsWith("at ")).map((line) => line.replace(/^at\s+/, ""));
    const extraLines = lines.filter((line) => line !== headline && !line.startsWith("at "));

    return {
        headline,
        frames,
        extraLines,
    };
}

function ContactInformation({ exceptionCode }: { exceptionCode: string }) {
    return (
        <>
            <Heading size="medium">Vil du ta kontakt med brukerstøtte?</Heading>
            <Heading size="xsmall">Ved kontakt med brukerstøtte oppgi koden under:</Heading>
            <ExceptionCode exceptionCode={exceptionCode} />
            <div style={{ display: "flex", justifyContent: "row" }}>
                <BodyShort size="small">
                    Vennligst lim inn koden over i feltet "Tittel", da du oppretter sak i{" "}
                    <Link
                        href={"https://jira.adeo.no/plugins/servlet/desk/portal/541/create/1861"}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Porten
                        <ExternalLinkIcon aria-hidden fontSize="1.5rem" />
                    </Link>
                </BodyShort>
            </div>
        </>
    );
}

function ExceptionCode({ exceptionCode }: { exceptionCode: string }) {
    return (
        <HStack gap="space-4" align="center" justify="start">
            <BodyShort weight="semibold">Feilkode: </BodyShort>
            <BodyShort>{exceptionCode}</BodyShort>
            <CopyButton size="small" copyText={exceptionCode} activeText="Kopiert" />
        </HStack>
    );
}
