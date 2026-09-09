import "@navikt/ds-css";
import "../../app/index.css";

import { BodyLong, BodyShort, Box, Detail, Heading, Link, VStack } from "@navikt/ds-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { eksporterPerFil, resolve, stories } from "./stories";

function grupperPerSeksjon(filstier: string[]) {
    const seksjoner = new Map<string, string[]>();
    for (const filsti of filstier) {
        const sep = filsti.lastIndexOf("/");
        const seksjon = sep === -1 ? "/" : filsti.slice(0, sep);
        const fil = sep === -1 ? filsti : filsti.slice(sep + 1);
        seksjoner.set(seksjon, [...(seksjoner.get(seksjon) ?? []), fil]);
    }
    return [...seksjoner.entries()];
}

function FilMedEksporter({
    seksjon,
    fil,
    eksportnavn,
    valgtStoryId,
}: {
    seksjon: string;
    fil: string;
    eksportnavn: string[];
    valgtStoryId?: string;
}) {
    const filsti = `${seksjon}/${fil}`;

    if (eksportnavn.length <= 1) {
        const aktiv = valgtStoryId === filsti || valgtStoryId?.startsWith(`${filsti}/`);
        return (
            <Link
                href={`?story=${encodeURIComponent(filsti)}`}
                underline={false}
                style={aktiv ? { fontWeight: 600 } : undefined}
            >
                {aktiv ? "▸ " : ""}
                {fil}
            </Link>
        );
    }

    return (
        <VStack gap="space-4">
            <BodyShort weight="semibold">{fil}</BodyShort>
            <VStack gap="space-4" paddingInline="space-12 space-0">
                {eksportnavn.map((navn) => {
                    const storyId = `${filsti}/${navn}`;
                    const aktiv = storyId === valgtStoryId;
                    return (
                        <Link
                            key={navn}
                            href={`?story=${encodeURIComponent(storyId)}`}
                            underline={false}
                            style={aktiv ? { fontWeight: 600 } : undefined}
                        >
                            {aktiv ? "▸ " : ""}
                            {navn}
                        </Link>
                    );
                })}
            </VStack>
        </VStack>
    );
}

function Sidebar({
    filstier,
    eksporterPerFil,
    valgtStoryId,
}: {
    filstier: string[];
    eksporterPerFil: Record<string, string[]>;
    valgtStoryId?: string;
}) {
    const seksjoner = grupperPerSeksjon(filstier);

    return (
        <Box
            as="nav"
            background="sunken"
            borderColor="neutral-subtle"
            borderWidth="0 1 0 0"
            padding="space-24"
            style={{ height: "100vh", overflowY: "auto", position: "sticky", top: 0 }}
        >
            <VStack gap="space-28">
                <Heading level="1" size="small">
                    🖼️ Stories
                </Heading>
                {seksjoner.map(([seksjon, filer]) => {
                    const seksjonsnavn = seksjon.split("/").pop() || seksjon;
                    return (
                        <VStack key={seksjon} gap="space-16">
                            <Detail textColor="subtle" uppercase title={seksjon}>
                                {seksjonsnavn}
                            </Detail>
                            <VStack gap="space-8">
                                {filer.map((fil) => (
                                    <FilMedEksporter
                                        key={fil}
                                        seksjon={seksjon}
                                        fil={fil}
                                        eksportnavn={eksporterPerFil[`${seksjon}/${fil}`] ?? []}
                                        valgtStoryId={valgtStoryId}
                                    />
                                ))}
                            </VStack>
                        </VStack>
                    );
                })}
            </VStack>
        </Box>
    );
}

function Velkomst({ antallFiler }: { antallFiler: number }) {
    return (
        <VStack gap="5" maxWidth="40rem">
            <Heading level="1" size="xlarge">
                Story-galleri
            </Heading>
            <BodyLong size="large">Velg en story fra menyen til venstre for å mounte den.</BodyLong>
            <BodyShort textColor="subtle">
                {antallFiler} {antallFiler === 1 ? "story-fil" : "story-filer"} tilgjengelig. Menyen mounter
                default-eksporten i filen - vil du se en annen variant/eksport, legg til{" "}
                <Box as="code" background="accent-soft" padding="1" borderRadius="small">
                    /EksportNavn
                </Box>{" "}
                bak i URL-en selv, f.eks.{" "}
                <Box as="code" background="accent-soft" padding="1" borderRadius="small">
                    ?story=mappe/Fil/EksportNavn
                </Box>
                .
            </BodyShort>
        </VStack>
    );
}

function Feil({ storyId, melding }: { storyId: string; melding: string }) {
    return (
        <VStack gap="2" maxWidth="40rem">
            <Heading level="1" size="medium">
                Kunne ikke mounte story
            </Heading>
            <BodyShort>
                <Box as="code">{storyId}</Box>
            </BodyShort>
            <BodyShort textColor="subtle">{melding}</BodyShort>
        </VStack>
    );
}

function getRequiredElement(id: string) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Story-galleriet mangler nødvendig element: #${id}`);
    return element;
}

const rootEl = getRequiredElement("root");
const sidebarEl = getRequiredElement("sidebar");

const filstier = Object.keys(stories).sort();
const storyIdFraUrl = new URLSearchParams(location.search).get("story");

Promise.all(filstier.map((filsti) => eksporterPerFil(filsti).then((navn) => [filsti, navn] as const))).then((par) => {
    const eksporterPerFilMap = Object.fromEntries(par);
    createRoot(sidebarEl).render(
        <StrictMode>
            <Sidebar
                filstier={filstier}
                eksporterPerFil={eksporterPerFilMap}
                valgtStoryId={storyIdFraUrl ?? undefined}
            />
        </StrictMode>,
    );
});

const rootTreVisning = createRoot(rootEl);
if (storyIdFraUrl) {
    resolve(storyIdFraUrl)
        .then((Story) => {
            const KomponentType = Story as React.ComponentType<Record<string, unknown>> | undefined;
            if (!KomponentType) {
                rootTreVisning.render(
                    <StrictMode>
                        <Feil storyId={storyIdFraUrl} melding="Fant ingen komponent-eksport for denne stien." />
                    </StrictMode>,
                );
                return;
            }
            rootTreVisning.render(
                <StrictMode>
                    <KomponentType />
                </StrictMode>,
            );
        })
        .catch((error: unknown) => {
            rootTreVisning.render(
                <StrictMode>
                    <Feil storyId={storyIdFraUrl} melding={error instanceof Error ? error.message : String(error)} />
                </StrictMode>,
            );
        });
} else {
    rootTreVisning.render(
        <StrictMode>
            <Velkomst antallFiler={filstier.length} />
        </StrictMode>,
    );
}
